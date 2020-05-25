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
  x[len >> 5] |= 0x80 << (len % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

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
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = md5_ff(a, b, c, d, x[i], 7, -680876936);
    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5_gg(b, c, d, a, x[i], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5_hh(d, a, b, c, x[i], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i], 6, -198630844);
    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
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
    output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
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
  output[(input.length >> 2) - 1] = undefined;
  for (i = 0; i < output.length; i += 1) {
    output[i] = 0;
  }
  for (i = 0; i < input.length * 8; i += 8) {
    output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
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
  ipad[15] = opad[15] = undefined;
  if (bkey.length > 16) {
    bkey = binl_md5(bkey, key.length * 8);
  }
  for (i = 0; i < 16; i += 1) {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }
  hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
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
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F) +
    hex_tab.charAt(x & 0x0F);
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

        if (data) {
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
            hash: this._hash,
            isValid: this._isValid,
            rawData: this._rawData
        };
    }

    restoreManifest(manifestData) {
        if (!manifestData) {
            this._isValid = false;
            return;
        }
        this._path = manifestData.path;
        this._hash = manifestData.hash;
        this._rawData = manifestData.rawData;

        this.restoreCache();
    }

    restoreCache() {
        this.cache = ["jakecache.js"];
        let tmp = {};
        // Ignore different protocol
        for (let pathname of this._rawData.cache) {
            let path = new URL(pathname, location);
            if (path.protocol === location.protocol) {
                if (!tmp[path]) {
                    this.cache.push(path);
                    tmp[path] = path;
                }
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
        return version + "_" + this._hash;
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
                            console.log(`JakeCache-SW noupdate: ${hash}`);
                            return resolve(false);
                        }

                        console.log(`JakeCache-SW update: ${hash} (was: ${this._hash})`);

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

const isAutoUpdate = false;

const CacheStatus = {
    UNCACHED: 0,
    IDLE: 1,
    CHECKING: 2,
    DOWNLOADING: 3,
    UPDATEREADY: 4,
    OBSOLETE: 5
};

let manifest = null;
let cacheStatus = CacheStatus.UNCACHED;

function postMessage(msg) {
    return self.clients.matchAll().then(clients => {

        if (!clients.length) {
            console.log(`JakeCache-SW no clients!! message:`, msg);
        }

        return Promise.all(
            clients.map(client => {
                return client.postMessage(msg);
            })
        );
    });
}

async function storeManifest(newManifest, manifestVersion) {
    manifestVersion = manifestVersion || "current";

    await idbKeyval.set(manifestVersion, newManifest.manifestData(), manifestStore);

    return Promise.resolve(newManifest);
}

async function loadManifest(manifestVersion) {
    try {
        manifestVersion = manifestVersion || "current";

        const mnfstData = await idbKeyval.get("current", manifestStore);
        if (!mnfstData) {
            return Promise.resolve(null);
        }

        let manifest = new JakeCacheManifest(mnfstData);
        return Promise.resolve(manifest);
    } catch (err) {
        console.log(`JakeCache-SW error ${err}`);
        return Promise.reject(err);
    }
}


async function loadCurrentManifest() {
    const mnf = await loadManifest("current");
    if (!mnf) {
        manifest = null;
        cacheStatus = CacheStatus.UNCACHED;
        console.log("JakeCache-SW uncached ");
        return Promise.resolve(null);
    }

    manifest = mnf;
    return Promise.resolve(manifest);
}

async function deleteOldCaches() {
    let cacheWhitelist = [];
    if (!manifest) {
        manifest = await loadCurrentManifest();
    }

    if (manifest) {
        cacheWhitelist.push(manifest.cacheName());
    }

    console.log('JakeCache-SW deleteing old caches except:', cacheWhitelist);

    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(function (cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
            }
        }));
}

let updating = false;

async function update(pathname, options = {}) {
    if (!pathname) {
        console.log("JakeCache-SW No pathname!");
        return Promise.reject('No pathname');
    }

    if (updating) {
        console.log("JakeCache-SW already updating");
        return Promise.reject('already updating');
    }

    updating = true;

    let nextManifest = new JakeCacheManifest();
    self.options = options;

    let manifestVersion = 'current';

    try {
        if (!manifest) {
            manifest = await loadCurrentManifest();
        }

        if (manifest) {
            self.options.hash = manifest.hash();
        }

        const isNeededToUpdate = await nextManifest.fetchData(pathname, self.options);
        if (isNeededToUpdate) {
            console.log(`JakeCache-SW storing to cache ${nextManifest.cacheName()} `);
            const cache = await caches.open(nextManifest.cacheName());
            await cache.addAll(nextManifest.cache);

            let isUpgrade = manifest && !isAutoUpdate;
            if (isUpgrade) {
                manifestVersion = 'next';
            }

            console.log(`JakeCache-SW stored to cache ${nextManifest.cacheName()} `);
            await storeManifest(nextManifest, manifestVersion);
            console.log(`JakeCache-SW saved to indexed db ${nextManifest.cacheName()} `);

            if (isAutoUpdate) {
                manifest = nextManifest;
                try {
                    await deleteOldCaches();
                } catch (err) {
                    console.log(`JakeCache-SW deleteOldCaches error: ${err}`);
                }
            }
            else if (isUpgrade) {
                cacheStatus = CacheStatus.UPDATEREADY;
                postMessage({ type: "updateready" });
            }

            updating = false;
            return Promise.resolve();
        } else {
            updating = false;
            cacheStatus = CacheStatus.CACHED;
            return Promise.resolve('JakeCache-SW noupdate needed');
        }
    }
    catch (err) {
        updating = false;
        console.log(`JakeCache-SW error: ${err}`);
        cacheStatus = CacheStatus.IDLE;
        postMessage({ type: "idle" });
        return Promise.reject(err);
    }
}

async function swapCache() {

    try {
        if (!manifest) {
            manifest = await loadCurrentManifest();
        }

        const mnfstNextData = await idbKeyval.get("next", manifestStore);

        if (mnfstNextData) {
            await idbKeyval.set("current", mnfstNextData, manifestStore);
            manifest = new JakeCacheManifest(mnfstNextData);

            await idbKeyval.del("next", manifestStore);

            try {
                await deleteOldCaches();
            } catch (err) {
                console.log(`JakeCache-SW deleteOldCaches error: ${err}`);
            }

            console.log(`JakeCache-SW swapCache done`);

            postMessage({ type: "updated" });
        } else {
            console.log(`JakeCache-SW no manifest to update to`);
        }

        if (!manifest) {
            cacheStatus = CacheStatus.UNCACHED;
        } else {
            cacheStatus = CacheStatus.CACHED;
        }
    }
    catch (err) {
        console.log(`JakeCache-SW swapCache error: ${err}`);

        if (mnfstNextData) {
            cacheStatus = CacheStatus.UPDATEREADY;
            postMessage({ type: "updateready" });
        } else {
            cacheStatus = CacheStatus.UNCACHED;
            postMessage({ type: "error" });
        }

        return Promise.reject(err);
    }
}


self.addEventListener("message", function (event) {
    let loc = location.pathname.replace('jakecache-sw.js', 'ns.appcache');
    loc = location.pathname.replace('sw.js', 'ns.appcache');

    switch (event.data.command) {
        case "update":
            let path = event.data.pathname || loc;
            update.call(this, path, event.data.options);
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

const manifestName = 'manifest.appcache';

self.addEventListener("install", function (event) {
    let loc = location.pathname.replace(/([\w\-]+\.js)/, manifestName);

    event.waitUntil(
        update(loc, { cache: "reload" })
            .catch((e) => Promise.resolve())
            .finally(() => self.skipWaiting())
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        deleteOldCaches()
            .then(function () {
                self.clients.claim();
            })
    );
});

function fromNetwork(request) {
    return fetch(request);
}

async function fromCache(request) {

    let cacheName = '';
    if (!manifest) {
        manifest = await loadCurrentManifest();
    }

    if (manifest) {
        cacheName = manifest.cacheName();
    }

    if (!cacheName) {
        Promise.reject('no-cache');
    }

    return caches.open(cacheName).then((cache) =>
        cache.match(request).then((matching) =>
            matching || Promise.reject('no-match')
        ));
}

// to refresh cache
async function updateCache(request, response) {
    // cach eonly js files
    if (!request.url.endsWith('.js')) {
        return Promise.resolve();
    }

    let cacheName = '';
    if (!manifest) {
        manifest = await loadCurrentManifest();
    }

    if (manifest) {
        cacheName = manifest.cacheName();
    }

    if (!cacheName) {
        Promise.reject('no-cache');
    }

    return caches.open(cacheName).then((cache) =>
        fetch(request).then((response) =>
            cache.put(request, response.clone()).then(() => response)
        )
    );
}

self.addEventListener("fetch", function (event) {
    let url = new URL(event.request.url);
    // console.log(url);

    if (event.request.url.includes("sw-fetch-test")) {
        event.respondWith(new Response('{"result": "ok"}', {
            headers: {
                "status": 200,
                "statusText": "service worker response",
                'Content-Type': 'application/json'
            }
        }));
        return;
    }

    // Ignore non-GET and different schemes.
    if (
        (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin' ||
            !event.request.url.startsWith(self.location.origin) ||
            event.request.method !== "GET" ||
            url.protocol !== location.protocol)
    ) {
        return;
    }

    event.respondWith(async function () {

        try {
            return await fromCache(event.request);
        } catch (e) {
            const resp = await fromNetwork(event.request);
            event.waitUntil(async function () {
                await updateCache(event.request);
            }());
            return resp;
        }
    }());

});
