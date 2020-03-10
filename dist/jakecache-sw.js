'use strict';

/*
* es6-md5
* Port of https://github.com/blueimp/JavaScript-MD5 to ES2015
*
* Copyright 2011, Sebastian Tschan
* https://blueimp.net
*
* Licensed under the MIT license:
* http://www.opensource.org/licenses/MIT
*
* Based on
* A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
* Digest Algorithm, as defined in RFC 1321.
* Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
* Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
* Distributed under the BSD License
* See http://pajhome.org.uk/crypt/md5 for more info.
*/

/*
* Add integers, wrapping at 2^32. This uses 16-bit operations internally
* to work around bugs in some JS interpreters.
*/
function safe_add (x, y) {
  const lsw = (x & 0xFFFF) + (y & 0xFFFF);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF)
}

/*
* Bitwise rotate a 32-bit number to the left.
*/
function bit_rol (num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt))
}

/*
* These functions implement the four basic operations the algorithm uses.
*/
function md5_cmn (q, a, b, x, s, t) {
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b)
}
function md5_ff (a, b, c, d, x, s, t) {
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t)
}
function md5_gg (a, b, c, d, x, s, t) {
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t)
}
function md5_hh (a, b, c, d, x, s, t) {
  return md5_cmn(b ^ c ^ d, a, b, x, s, t)
}
function md5_ii (a, b, c, d, x, s, t) {
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t)
}

/*
* Calculate the MD5 of an array of little-endian words, and a bit length.
*/
function binl_md5 (x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << (len % 32)
  x[(((len + 64) >>> 9) << 4) + 14] = len

  let i;
  let olda;
  let oldb;
  let oldc;
  let oldd;
  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (i = 0; i < x.length; i += 16) {
    olda = a
    oldb = b
    oldc = c
    oldd = d

    a = md5_ff(a, b, c, d, x[i], 7, -680876936)
    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586)
    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819)
    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330)
    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897)
    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426)
    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341)
    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983)
    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416)
    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417)
    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063)
    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162)
    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682)
    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101)
    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290)
    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329)

    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510)
    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632)
    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713)
    b = md5_gg(b, c, d, a, x[i], 20, -373897302)
    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691)
    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083)
    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335)
    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848)
    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438)
    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690)
    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961)
    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501)
    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467)
    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784)
    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473)
    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734)

    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558)
    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463)
    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562)
    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556)
    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060)
    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353)
    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632)
    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640)
    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174)
    d = md5_hh(d, a, b, c, x[i], 11, -358537222)
    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979)
    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189)
    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487)
    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835)
    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520)
    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651)

    a = md5_ii(a, b, c, d, x[i], 6, -198630844)
    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415)
    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905)
    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055)
    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571)
    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606)
    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523)
    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799)
    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359)
    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744)
    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380)
    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649)
    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070)
    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379)
    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259)
    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551)

    a = safe_add(a, olda)
    b = safe_add(b, oldb)
    c = safe_add(c, oldc)
    d = safe_add(d, oldd)
  }
  return [a, b, c, d]
}

/*
* Convert an array of little-endian words to a string
*/
function binl2rstr (input) {
  let i;
  let output = '';
  for (i = 0; i < input.length * 32; i += 8) {
    output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF)
  }
  return output
}

/*
* Convert a raw string to an array of little-endian words
* Characters >255 have their high-byte silently ignored.
*/
function rstr2binl (input) {
  let i;
  const output = [];
  output[(input.length >> 2) - 1] = undefined
  for (i = 0; i < output.length; i += 1) {
    output[i] = 0
  }
  for (i = 0; i < input.length * 8; i += 8) {
    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32)
  }
  return output
}

/*
* Calculate the MD5 of a raw string
*/
function rstr_md5 (s) {
  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8))
}

/*
* Calculate the HMAC-MD5, of a key and some data (raw strings)
*/
function rstr_hmac_md5 (key, data) {
  let i;
  let bkey = rstr2binl(key);
  const ipad = [];
  const opad = [];
  let hash;
  ipad[15] = opad[15] = undefined
  if (bkey.length > 16) {
    bkey = binl_md5(bkey, key.length * 8)
  }
  for (i = 0; i < 16; i += 1) {
    ipad[i] = bkey[i] ^ 0x36363636
    opad[i] = bkey[i] ^ 0x5C5C5C5C
  }
  hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128))
}

/*
* Convert a raw string to a hex string
*/
function rstr2hex (input) {
  const hex_tab = '0123456789abcdef';
  let output = '';
  let x;
  let i;
  for (i = 0; i < input.length; i += 1) {
    x = input.charCodeAt(i)
    output += hex_tab.charAt((x >>> 4) & 0x0F) +
    hex_tab.charAt(x & 0x0F)
  }
  return output
}

/*
* Encode a string as utf-8
*/
function str2rstr_utf8 (input) {
  return unescape(encodeURIComponent(input))
}

/*
* Take string arguments and return either raw or hex encoded strings
*/
function raw_md5 (s) {
  return rstr_md5(str2rstr_utf8(s))
}
function hex_md5 (s) {
  return rstr2hex(raw_md5(s))
}
function raw_hmac_md5 (k, d) {
  return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))
}
function hex_hmac_md5 (k, d) {
  return rstr2hex(raw_hmac_md5(k, d))
}

function md5 (string, key, raw) {
  if (!key) {
    if (!raw) {
      return hex_md5(string)
    }
    return raw_md5(string)
  }
  if (!raw) {
    return hex_hmac_md5(key, string)
  }
  return raw_hmac_md5(key, string)
}

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
  this.options = options;

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