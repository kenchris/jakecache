class JakeCacheManifest {

    constructor(path = "") {
        this._path = path;
    }

    parse() {
        if (this._data)
            return this._data;
        
        // http://html5doctor.com/go-offline-with-application-cache/
        return fetch(this._path).then((response) => {
            var reader = response.body.getReader();
            var decoded = '';
            var decoder = new TextDecoder();
            this._data = {};

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
  
                        if (!this._data[header]) {
                            this._data[header] = [];
                        }
                        this._data[header].push(line);
                    }

                    resolve(this._data);
                });
            });
        });
    }
}

var CACHE_NAME = 'jakecache';

let manifest = new JakeCacheManifest("appcache.manifest");

self.addEventListener('install', function(event) {
  event.waitUntil(
    manifest.parse().then((data) => {
      return caches.open(CACHE_NAME)
      .then(function(cache) {
        let toCache = data.cache;
        for (let fallback of data.fallback) {
           let [_, redirect] = fallback.split(" ");
           toCache.push(redirect);
        }

        return cache.addAll(data.cache);
      });
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(manifest.parse().then(data => {
    caches.match(event.request)
      .then(response => {
         // Always consult CACHE first
         if (response)
           return response;
           
         // Use FALLBACK if offline
         if (!navigator.onLine) {
           let url = new URL(event.request);
    
           for (let fallback of data.fallback) {
             let [pathname, redirectPath] = fallback.split(" ");
             if (url.pathname === pathname) {
               url.pathname = redirectPath;
               return Response.redirect(url.href);
             }
           }
         }
         
         // Use NETWORK if * or path is in list.  
         if (cache.network[0] === "*")
           return fetch(event.request);
           
         for (allowNetwork of data.network) {
           if (allowNetwork === event.request)
             return fetch(event.request);  
         }
         
         // Else fail.
         return Response.error();
      });
  }));
});