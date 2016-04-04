class JakeCacheManifest {
    constructor(path = "") {
        this._path = path;
    }

    parse() {
        // http://html5doctor.com/go-offline-with-application-cache/
        return fetch(this._path).then((response) => {
            var reader = response.body.getReader();
            var decoded = '';
            var decoder = new TextDecoder();
            this._rawData = {};

            return reader.read().then((result) => {
                return new Promise((resolve, reject) => {
                    decoded += decoder.decode(result.value || new Uint8Array, {
                        stream: !result.done
                    });

                    var lines = decoded.split(/\r|\n/);
                    let header = "cache"; // default.

                    if (lines.shift() !== "CACHE MANIFEST") {
                        return reject();
                    }

                    for (let line of lines) {
                        line = line.replace(/#.*$/, "").trim();

                        if (line === "") {
                          continue;
                        }

                        let res = line.match(/^([A-Z]*):/);
                        if (res) {
                            header = res[1].toLowerCase();
                            continue;
                        }

                        if (!this._rawData[header]) {
                            this._rawData[header] = [];
                        }
                        this._rawData[header].push(line);
                    }

                    this.cache = [];
                    // Ignore different protocol
                    for (let pathname of this._rawData.cache) {
                      let path = new URL(pathname, location);
                      if (path.protocol === location.protocol) {
                        this.cache.push(path);
                      }
                    }

                    this.fallback = [];
                    for (let entry of this._rawData.fallback) {
                      let [pathname, fallbackPath] = entry.split(" ");
                      let path = new URL(pathname, location);
                      let fallback = new URL(fallbackPath, location);

                      // Ignore cross-origin fallbacks
                      if (path.origin === fallback.origin) {
                        this.fallback.push([path, fallback]);
                        this.cache.push(fallback);
                      }
                    }

                    this.allowNetworkFallback = false;
                    this.network = [];
                    for (let entry of this._rawData.network) {
                      if (entry === '*') {
                        this.allowNetworkFallback = true;
                        continue;
                      }
                      let path = new URL(entry, location);
                      if (path.protocol === location.protocol) {
                        this.network.push(path);
                      }
                    }

                    resolve();
                });
            });
        });
    }
}

var CACHE_NAME = 'jakecache';

let manifest = new JakeCacheManifest("appcache.manifest");

self.addEventListener('install', function(event) {
  event.waitUntil(
    manifest.parse()
    .then(() => {
      // Appcache is no-cors by default.
      let requests = manifest.cache.map(url => {
        return new Request(url, { mode: 'no-cors' });
      });

      return Promise.all(requests.map(request => {
        // Manual fetch to emulate appcache behavior.
        return fetch(request).then(response => {
          // section 5.6.4 of http://www.w3.org/TR/2011/WD-html5-20110525/offline.html

          // Redirects are fatal.
          if (response.url != request.url) {
            throw Error();
          }

          if (response.type != 'opaque') {
            // If the error was a 404 or 410 HTTP response or equivalent
            // Skip this resource. It is dropped from the cache.
            if (response.status < 200 || response.status >= 300) {
              return undefined;
            }

            // HTTP caching rules, such as Cache-Control: no-store, are ignored.
            if ((response.headers.get('cache-control') || '').match(/no-store/i)) {
              return undefined;
            }
          }

          return response;
        });
      }));
    }).then(responses => {
      return caches.open(CACHE_NAME).then(cache => {
        return Promise.all(responses.filter(response => response).map((response, index) => {
          return cache.put(requests[index], response);
        }));
      });
    })
  );
});


self.addEventListener('fetch', function(event) {
  let url = new URL(event.request.url);

  // Ignore non-GET and different schemes.
  if (event.request.method != 'GET' || url.scheme != location.scheme) {
    return;
  }

  event.respondWith(manifest.parse().then(_ => {
    // Process network-only.
    if (manifest.network.filter(entry => entry.href === url.href).length) {
      return fetch(event.request);
    }

    caches.match(event.request)
      .then(response => {
        // Cache always wins.
        if (response) {
          return response;
        }

        // Fallbacks consult network, and falls back on failure.
        for (let [path, fallback] of manifest.fallback) {
          if (url.href.indexOf(path) === 0) {
            return fetch(event.request).then(response => {
              // Same origin only.
              if (new URL(response.url).origin != location.origin) {
                throw Error();
              }

              if (response.type != 'opaque') {
                if (response.status < 200 || response.status >= 300) {
                  throw Error();
                }
              }
            }).catch(_ => {
              return cache.match(fallback);
            });
           }
         }

         if (manifest.allowNetworkFallback) {
           return fetch(event.request);
         }

         return response; // failure.
      });
  }));
});