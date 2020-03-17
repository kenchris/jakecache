import { md5 } from "./lib/md5";
self.importScripts("idb-keyval-iife.js");

const manifestStore = new idbKeyval.Store("manifest-db", "manifest-db");

class JakeCacheManifest {
  constructor(data) {
    this._path = null;
    this._hash = null;
    this._isValid = false;
    this._fetchOptions = { credentials: "same-origin" };
    this._rawData = {
      version: "",
      cache: [],
      fallback: [],
      network: []
    };

    if(data){
      this.restoreManifest(data);
    }
  }

  hash() {
    return this._hash;
  }
  isValid() {
    return this._isValid;
  }
  manifestData() {
    return {
      cacheName: this.cacheName(),
      path: this._path,
      hash : this._hash,
      isValid : this._isValid,
      rawData: this._rawData
    };
  }

  restoreManifest(manifestData) {
    if(!manifestData){
      this._isValid = false;
      return;
    }
    this._path = manifestData.path;
    this._hash = manifestData.hash;
    this._rawData = manifestData.rawData

    this.restoreCache();
  }

  restoreCache() {
    
    this.cache = ["jakecache.js"];
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
      if (entry === "*") {
        this.allowNetworkFallback = true;
        continue;
      }
      let path = new URL(entry, location);
      if (path.protocol === location.protocol) {
        this.network.push(path);
      }
    }

    this._isValid = true;
    
  }

  
  pathName() {
    return this._path;
  }

  cacheName() {
    let version = this._rawData.version;
    return version + '_' + this._hash;
  }

  fetchData(path, options = {}) {
    this._path = path;

    if (this._isValid && options.cache !== "reload") {
      return Promise.resolve(false);
    }

    // http://html5doctor.com/go-offline-with-application-cache/
    return fetch(new Request(this._path, options), this._fetchOptions).then(
      response => {
        if (
          response.type === "opaque" ||
          response.status === 404 ||
          response.status === 410
        ) {
          return Promise.reject();
        }

        this._hash = options.hash ? options.hash : this._hash;
        
        return response.text().then(result => {
          return new Promise((resolve, reject) => {
            let hash = md5(result);
            if (this._hash && hash.toString() === this._hash.toString()) {
              console.log("noupdate: " + hash);
              return resolve(false);
            }

            console.log(`update: ${hash} (was: ${this._hash})`);

            this._hash = hash;

            let lines = result.split(/\r|\n/);
            let header = "cache"; // default.
            let versionRegexp = /\s*(#\sVersion:)\s*([\w\.]*)/gm;

            let firstLine = lines.shift();
            if (firstLine !== "CACHE MANIFEST") {
              return reject();
            }
            let versionFound = false;
            for (let line of lines) {
              if (!versionFound) {
                let match = versionRegexp.exec(line);
                if (match) {
                  versionFound = true;
                  this._rawData.version = match[match.length - 1];
                }
              }

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

            if (!versionFound) {
              this._rawData.version = "" + new Date().getTime();
            }
            
            this.restoreCache();
            resolve(true);
          });
        });
      }
    );
  }
}

self.addEventListener("message", function(event) {
  switch (event.data.command) {
    case "update":
      update.call(this, event.data.pathname, event.data.options);
      break;
    case "abort":
      postMessage({
        type: "error",
        message: "Not implementable without cancellable promises."
      });
      break;
    case "swapCache":
      swapCache();
      break;
  }
});

let manifest = null;

const CacheStatus = {
  UNCACHED: 0,
  IDLE: 1,
  CHECKING: 2,
  DOWNLOADING: 3,
  UPDATEREADY: 4,
  OBSOLETE: 5
};

let cacheStatus = CacheStatus.UNCACHED;

function postMessage(msg) {
  return self.clients.matchAll().then(clients => {
    return Promise.all(
      clients.map(client => {
        return client.postMessage(msg);
      })
    );
  });
}

function swapCache() {
  idbKeyval.get('current', manifestStore).then(mnfstData => {
      if(mnfstData){
        return caches.delete(mnfstData.cacheName);
      }
  }).then(() => {
      return idbKeyval.get('next', manifestStore)
  }).then(mnfstData => {
    if(mnfstData){
      manifest = new JakeCacheManifest(mnfstData);

      return idbKeyval.set('current', mnfstData, manifestStore);
    }else{
      cacheStatus = CacheStatus.UNCACHED;
    }
  }).then(() => {
    return idbKeyval.del('next', manifestStore);
  }).then(_ => {
    cacheStatus = CacheStatus.IDLE;
    postMessage({ type: "updated" });
  });
}

// 7.9.4
function update(pathname, options = {}) {
  if (!pathname) {
    console.log("No pathname!");
    return Promise.reject();
  }
  
  let nextManifest = new JakeCacheManifest();

  // *.2.2
  (this || self).options = options;

  return idbKeyval.get('current', manifestStore).then(mnfstData => {
      if(!mnfstData){
        manifest = null;
        this.uncached = true;
        cacheStatus = CacheStatus.UNCACHED;
        console.log("uncached " + this.uncached);
        return Promise.resolve(this.uncached);
      }else{
        manifest = new JakeCacheManifest(mnfstData);
        this.options = this.options || {};
        this.options.hash = manifest.hash();
      }

      return caches.open(mnfstData.cacheName).then(cache => {
        if(!cache){
          manifest = null;
          this.uncached = true;
          cacheStatus = CacheStatus.UNCACHED;
          console.log("uncached " + this.uncached);
          return Promise.resolve(this.uncached);
        }

        return cache.keys().then(keyData => {
          this.uncached = !keyData || !keyData.length;
          if(this.uncached){
            manifest = null;
            cacheStatus = CacheStatus.UNCACHED;
          }
          console.log("uncached " + this.uncached);
          return Promise.resolve(this.uncached);
        })
      })
    })
    .then(uncached => {
      
      if (cacheStatus === CacheStatus.UPDATEREADY) {
        postMessage({ type: "updateready" });
        postMessage({ type: "abort" });
        return Promise.reject();
      }
      // *.2.4 and *.2.6
      if (cacheStatus === CacheStatus.CHECKING) {
        postMessage({ type: "checking" });
        postMessage({ type: "abort" });
        return Promise.reject();
      }
      // *.2.4, *.2.5, *.2.6
      if (cacheStatus === CacheStatus.DOWNLOADING) {
        postMessage({ type: "checking" });
        postMessage({ type: "downloading" });
        postMessage({ type: "abort" });
        return Promise.reject();
      }
      return Promise.resolve(uncached);
    })
    .then(uncached => {
      // *.2.7 and *.2.8
      cacheStatus = CacheStatus.CHECKING;
      postMessage({ type: "checking" });

      // FIXME: *.6: Fetch manifest, mark obsolete if fails.
     

      return nextManifest.fetchData(pathname, this.options).catch(err => {
        cacheStatus = CacheStatus.OBSOLETE;
        postMessage({ type: "obsolete" });
        // FIXME: *.7: Error for each existing entry.
        cacheStatus = CacheStatus.IDLE;
        postMessage({ type: "idle" });
        return Promise.reject(err);
      });

      
    }).then(modified => {
      this.modified = modified;
      // *.2: If cache group already has an application cache in it, then
      // this is an upgrade attempt. Otherwise, this is a cache attempt.
      return caches.keys().then(cacheNames => {
        return Promise.resolve(!!cacheNames.length);
      });
    })
    .then(upgrade => {
      this.upgrade = upgrade;
      if (this.upgrade && !this.modified) {
        cacheStatus = CacheStatus.IDLE;
        postMessage({ type: "noupdate" });
        return Promise.reject();
      }

      // Appcache is no-cors by default.
      this.requests = nextManifest.cache.map(url => {
        return new Request(url, { mode: "no-cors" });
      });

      cacheStatus = CacheStatus.DOWNLOADING;
      postMessage({ type: "downloading" });

      this.loaded = 0;
      this.total = this.requests.length;

      return Promise.all(
        this.requests.map(request => {
          // Manual fetch to emulate appcache behavior.
          return fetch(request, nextManifest._fetchOptions).then(response => {
            cacheStatus = CacheStatus.PROGRESS;
            postMessage({
              type: "progress",
              lengthComputable: true,
              loaded: ++this.loaded,
              total: this.total,
              url: request.url.toString()
            });

            // section 5.6.4 of http://www.w3.org/TR/2011/WD-html5-20110525/offline.html

            // Redirects are fatal.
            if (response.url !== request.url) {
              throw Error();
            }

            // FIXME: should we update this.total below?

            if (response.type !== "opaque") {
              // If the error was a 404 or 410 HTTP response or equivalent
              // Skip this resource. It is dropped from the cache.
              if (response.status < 200 || response.status >= 300) {
                return undefined;
              }

              // HTTP caching rules, such as Cache-Control: no-store, are ignored.
              if (
                (response.headers.get("cache-control") || "").match(/no-store/i)
              ) {
                return undefined;
              }
            }

            return response;
          });
        })
      );
    }).then(responses => {
      this.responses = responses.filter(response => response);    
      return Promise.resolve(this.responses);
    })
    .then(responses => {
      console.log("Adding to cache " + nextManifest.cacheName());
      return caches
        .open(nextManifest.cacheName())
        .then(cache => {
          return Promise.all(
            responses.map((response, index) => {
              return cache.put(self.requests[index], response);
            })
          );
        }).then(_ => {
          let manifestVersion = 'next';
          if(!this.upgrade){
            manifest = nextManifest;
            manifestVersion = 'current';
          }

          return idbKeyval.set(manifestVersion, nextManifest.manifestData(), manifestStore);
        });
    }).then(_ => { 
      if (this.upgrade) 
      {
        cacheStatus = CacheStatus.UPDATEREADY;
        postMessage({ type: "updateready" });
      } else {
        cacheStatus = CacheStatus.CACHED;
        postMessage({ type: "cached" });
      }
      return Promise.resolve();
    })
    .catch(err => {
      if (err) {
        postMessage({ type: "error" }, err);
        console.log(err);
      }
    });
}

self.addEventListener("install", function(event) {
  event.waitUntil(
   self.skipWaiting()
   );
});

self.addEventListener("activate", function(event) {

  event.waitUntil(
    idbKeyval.get('current', manifestStore).then(mnfstData => {
      if(mnfstData){
        manifest = new JakeCacheManifest(mnfstData);
        cacheStatus = CacheStatus.CACHED;
      }
      return Promise.resolve(manifest);
    }).then(mnfst => {
      if(mnfst){
        return update(mnfst.pathName(), { cache : "reload" });
      }
      return Promise.resolve();
    }).then(self.clients.claim())
    );
});

self.addEventListener("fetch", function(event) {
  if(manifest && manifest.isValid() && cacheStatus === CacheStatus.UNCACHED){
    cacheStatus = CacheStatus.CACHED;
  }

  if (cacheStatus === CacheStatus.UNCACHED) {
    return fetch(event.request);
  }

  let url = new URL(event.request.url);

  // Ignore non-GET and different schemes.
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.method !== "GET" || url.scheme !== location.scheme) {
    return;
  }

  // if (!event.request.url.startsWith(self.location.origin)) {
  //   // External request, or POST, ignore
  //   return void event.respondWith(fetch(event.request));
  // }

  // FIXME TEST: Get data from IndexedDB instead.
  let mnfstPromise = manifest
    ? Promise.resolve(manifest)
    : idbKeyval.get("current", manifestStore).then(mnfstData => {
        if (mnfstData) {
          manifest = new JakeCacheManifest(mnfstData);
        }
        return manifest;
    });

    function checkCache(mnfst)
    {
        return caches
            .open(mnfst.cacheName())
            .then(function (cache) {
                if(!cache)
                {
                  throw Error('Cache not found');
                }

                return cache.match(event.request).then(response => {
                    // Cache always wins.
                    if (response) {
                        return response;
                    }

                    // Fallbacks consult network, and falls back on failure.
                    for (let [path, fallback] of mnfst.fallback) {
                        if (url.href.indexOf(path) === 0) {
                            return fetch(event.request)
                                .then(response => {
                                    // Same origin only.
                                    if (new URL(response.url).origin !== location.origin) {
                                        throw Error();
                                    }

                                    if (response.type !== "opaque") {
                                        if (response.status < 200 || response.status >= 300) {
                                            throw Error();
                                        }
                                    }
                                })
                                .catch(_ => {
                                    return cache.match(fallback);
                                });
                        }
                    }

                    if (mnfst.allowNetworkFallback) {
                        return fetch(event.request);
                    }

                    return response; // failure.
                });
            })
            .catch(err => {
                if (err) {
                    postMessage({ type: "error" }, err);
                    console.log(err);
                }
                //error with cache remove current manifest
                manifest = null;
                idbKeyval.del("current", manifestStore);
                cacheStatus = CacheStatus.UNCACHED;
                return fetch(event.request);
            });
    }

  event.respondWith(
    mnfstPromise
      .then(mnfst => {
        if (!mnfst) {
          cacheStatus = CacheStatus.UNCACHED;
          return fetch(event.request);
        }

        // Process network-only.
        if (mnfst.network.filter(entry => entry.href === url.href).length) {
          return fetch(event.request);
        }

        return checkCache(mnfst);
      })
      .catch(err => {
        if (err) {
          postMessage({ type: "error" }, err);
          console.log(err);
        }
        //error with cache remove current manifest
        manifest = null;
        idbKeyval.del("current", manifestStore);
        cacheStatus = CacheStatus.UNCACHED;
        return fetch(event.request);
      })
  );
});
