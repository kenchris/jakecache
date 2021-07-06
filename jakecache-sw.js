import { md5 } from './lib/md5'

class JakeCacheManifest {

  constructor () {
    this._path = null
    this._hash = null
    this._isValid = false
    this._fetchOptions = { credentials: "same-origin" }
  }

  groupName () {
    let filename = this._path.substring(this._path.lastIndexOf('/') + 1)
    return filename
  }

  fetchData (path, options = {}) {
    this._path = path

    if (this._isValid && options.cache !== 'reload') {
      return Promise.resolve(false)
    }

    // http://html5doctor.com/go-offline-with-application-cache/
    return fetch(new Request(this._path, options), this._fetchOptions).then((response) => {
      if (response.type === 'opaque' || response.status === 404 || response.status === 410) {
        return Promise.reject()
      }

      this._rawData = {
        cache: [],
        fallback: [],
        network: []
      }

      return response.text().then((result) => {
        return new Promise((resolve, reject) => {
          let hash = md5(result)
          if (this._hash && hash.toString() === this._hash.toString()) {
            console.log('noupdate: ' + hash)
            return resolve(false)
          }
          this._hash = hash
          console.log(`update: ${hash} (was: ${this._hash})`)

          let lines = result.split(/\r|\n/)
          let header = 'cache' // default.

          let firstLine = lines.shift()
          if (firstLine !== 'CACHE MANIFEST') {
            return reject()
          }

          for (let line of lines) {
            line = line.replace(/#.*$/, '').trim()

            if (line === '') {
              continue
            }

            let res = line.match(/^([A-Z]*):/)
            if (res) {
              header = res[1].toLowerCase()
              continue
            }

            if (!this._rawData[header]) {
              this._rawData[header] = []
            }
            this._rawData[header].push(line)
          }

          this.cache = ['jakecache.js']
          // Ignore different protocol
          for (let pathname of this._rawData.cache) {
            let path = new URL(pathname, location)
            if (path.protocol === location.protocol) {
              this.cache.push(path)
            }
          }

          this.fallback = []
          for (let entry of this._rawData.fallback) {
            let [pathname, fallbackPath] = entry.split(' ')
            let path = new URL(pathname, location)
            let fallback = new URL(fallbackPath, location)

            // Ignore cross-origin fallbacks
            if (path.origin === fallback.origin) {
              this.fallback.push([path, fallback])
              this.cache.push(fallback)
            }
          }

          this.allowNetworkFallback = false
          this.network = []
          for (let entry of this._rawData.network) {
            if (entry === '*') {
              this.allowNetworkFallback = true
              continue
            }
            let path = new URL(entry, location)
            if (path.protocol === location.protocol) {
              this.network.push(path)
            }
          }

          this._isValid = true
          resolve(true)
        })
      })
    })
  }
}

self.addEventListener('message', function (event) {
  switch (event.data.command) {
    case 'update':
      event.waitUntil(update.call(this, event.data.pathname, event.data.options))
      break
    case 'abort':
      postMessage({ type: 'error', message: 'Not implementable without cancellable promises.' })
      break
    case 'swapCache':
      swapCache()
      break
  }
})

let manifest = new JakeCacheManifest()

const CacheStatus = {
  UNCACHED: 0,
  IDLE: 1,
  CHECKING: 2,
  DOWNLOADING: 3,
  UPDATEREADY: 4,
  OBSOLETE: 5
}

let cacheStatus = CacheStatus.UNCACHED

function postMessage (msg) {
  return self.clients.matchAll().then(clients => {
    return Promise.all(clients.map(client => {
      return client.postMessage(msg)
    }))
  })
}

function swapCache () {
  caches.keys().then(keyList => {
    return Promise.all(keyList.map(key => {
      return caches.delete(key)
    }))
  }).then(() => {
    // FIXME: Add new keys.
  })
}

// 7.9.4
function update (pathname, options = {}) {
  if (!pathname) {
    console.log('No pathname!')
    return Promise.reject()
  }

  // *.2.2
  this.options = options
  this.cacheGroup = pathname

  return caches.keys().then(cacheNames => {
    this.uncached = !cacheNames.length
    console.log('uncached ' + this.uncached)
    return Promise.resolve(this.uncached)
  }).then((uncached) => {
    if (this.options.cache !== 'reload' && !uncached) {
      // We have a cache and we are no doing an update check.
      return Promise.reject()
    }

    // *.2.4 and *.2.6
    if (cacheStatus === CacheStatus.CHECKING) {
      postMessage({ type: 'checking' })
      postMessage({ type: 'abort' })
      return Promise.reject()
    }
    // *.2.4, *.2.5, *.2.6
    if (cacheStatus === CacheStatus.DOWNLOADING) {
      postMessage({ type: 'checking' })
      postMessage({ type: 'downloading' })
      postMessage({ type: 'abort' })
      return Promise.reject()
    }
    return Promise.resolve()
  }).then(() => {
    // *.2.7 and *.2.8
    cacheStatus = CacheStatus.CHECKING
    postMessage({ type: 'checking' })

    // FIXME: *.6: Fetch manifest, mark obsolete if fails.
    return manifest.fetchData(this.cacheGroup, this.options).catch(err => {
      cacheStatus = CacheStatus.OBSOLETE
      postMessage({ type: 'obsolete' })
      // FIXME: *.7: Error for each existing entry.
      cacheStatus = CacheStatus.IDLE
      postMessage({ type: 'idle' })
      return Promise.reject(err)
    })
  }).then(modified => {
    this.modified = modified
    // *.2: If cache group already has an application cache in it, then
    // this is an upgrade attempt. Otherwise, this is a cache attempt.
    return caches.keys().then(cacheNames => {
      return Promise.resolve(!!cacheNames.length)
    })
  }).then(upgrade => {
    this.upgrade = upgrade
    if (this.upgrade && !this.modified) {
      cacheStatus = CacheStatus.IDLE
      postMessage({ type: 'noupdate' })
      return Promise.reject()
    }

    // Appcache is no-cors by default.
    this.requests = manifest.cache.map(url => {
      return new Request(url, { mode: 'no-cors' })
    })

    cacheStatus = CacheStatus.DOWNLOADING
    postMessage({ type: 'downloading' })

    this.loaded = 0
    this.total = this.requests.length

    return Promise.all(this.requests.map(request => {
      // Manual fetch to emulate appcache behavior.
      return fetch(request, manifest._fetchOptions).then(response => {
        cacheStatus = CacheStatus.PROGRESS
        postMessage({
          type: 'progress',
          lengthComputable: true,
          loaded: ++(this.loaded),
          total: this.total
        })

        // section 5.6.4 of http://www.w3.org/TR/2011/WD-html5-20110525/offline.html

        // Redirects are fatal.
        if (response.url !== request.url) {
          throw Error()
        }

        // FIXME: should we update this.total below?

        if (response.type !== 'opaque') {
          // If the error was a 404 or 410 HTTP response or equivalent
          // Skip this resource. It is dropped from the cache.
          if (response.status < 200 || response.status >= 300) {
            return undefined
          }

          // HTTP caching rules, such as Cache-Control: no-store, are ignored.
          if ((response.headers.get('cache-control') || '').match(/no-store/i)) {
            return undefined
          }
        }

        return response
      })
    }))
  }).then(responses => {
    this.responses = responses.filter(response => response)
    if (this.upgrade) {
      cacheStatus = CacheStatus.UPDATEREADY
      postMessage({ type: 'updateready' })
      return Promise.reject()
    } else {
      return Promise.resolve(this.responses)
    }
  }).then(responses => {
    console.log('Adding to cache ' + manifest.groupName())
    return caches.open(manifest.groupName()).then(cache => {
      return Promise.all(responses.map((response, index) => {
        return cache.put(self.requests[index], response)
      }))
    }).then(_ => {
      cacheStatus = CacheStatus.CACHED
      postMessage({ type: 'cached' })
    })
  }).catch(err => {
    if (err) {
      postMessage({ type: 'error' }, err)
      console.log(err)
    }
  })
}

self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', function (event) {
  if (cacheStatus === CacheStatus.UNCACHED) {
    return fetch(event.request)
  }

  let url = new URL(event.request.url)

  // Ignore non-GET and different schemes.
  if (event.request.method !== 'GET' || url.scheme !== location.scheme) {
    return
  }

  // FIXME: Get data from IndexedDB instead.
  event.respondWith(manifest.fetchData('test.manifest').then(_ => {
    // Process network-only.
    if (manifest.network.filter(entry => entry.href === url.href).length) {
      return fetch(event.request)
    }

    return caches.match(event.request).then(response => {
      // Cache always wins.
      if (response) {
        return response
      }

      // Fallbacks consult network, and falls back on failure.
      for (let [path, fallback] of manifest.fallback) {
        if (url.href.indexOf(path) === 0) {
          return fetch(event.request).then(response => {
            // Same origin only.
            if (new URL(response.url).origin !== location.origin) {
              throw Error()
            }

            if (response.type !== 'opaque') {
              if (response.status < 200 || response.status >= 300) {
                throw Error()
              }
            }
          }).catch(_ => {
            return cache.match(fallback)
          })
        }
      }

      if (manifest.allowNetworkFallback) {
        return fetch(event.request)
      }

      return response // failure.
    })
  }))
})
