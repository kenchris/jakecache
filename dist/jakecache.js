'use strict';

const _eventHandlers = Symbol('eventHandlers')

let CustomEvent = window.CustomEvent
let DOMException = window.DOMException
let ErrorEvent = window.ErrorEvent
let ProgressEvent = window.ProgressEvent

class PolyfilledEventTarget {
  constructor (names) {
    this[_eventHandlers] = {}

    names.map(name => {
      this[_eventHandlers][name] = { handler: null, listeners: [] }
      Object.defineProperty(this, 'on' + name, {
        get: function () {
          return this[_eventHandlers][name]['handler']
        },
        set: function (fn) {
          if (fn === null || fn instanceof Function) {
            this[_eventHandlers][name]['handler'] = fn
          }
        },
        enumerable: false
      })
    })
  }

  dispatchEvent (event) {
    if (this[_eventHandlers][event.type]) {
      let handlers = this[_eventHandlers][event.type]
      let mainFn = handlers['handler']
      if (mainFn) {
        mainFn(event)
      }
      for (let fn of handlers['listeners']) {
        fn(event)
      }
    }
  }

  addEventListener (name, fn) {
    if (this[_eventHandlers][name]) {
      let store = this[_eventHandlers][name]['listeners']
      let index = store.indexOf(fn)
      if (index === -1) {
        store.push(fn)
      }
    }
  }

  removeEventListener (name, fn) {
    if (this[_eventHandlers][name]) {
      let store = this[_eventHandlers][name]['listeners']
      let index = store.indexOf(fn)
      if (index > 0) {
        store.splice(index, 1)
      }
    }
  }
}

const _status = Symbol('status')

class JakeCache extends PolyfilledEventTarget {
  constructor () {
    super(['abort', 'cached', 'checking',
           'downloading', 'error', 'obsolete',
           'progress', 'updateready', 'noupdate'])

    if (window.jakeCache) {
      return window.jakeCache
    }
    window.jakeCache = this
    
    if (('serviceWorker' in navigator) === false) {
      return
    }

    let onload = () => {
      if (document.readyState !== 'complete') {
        return
      }

      let html = document.querySelector('html')
      this.pathname = html.getAttribute('manifest')

      if (this.pathname && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('jakecache-sw.js').then(registration => {
          console.log(`JakeCache installed for ${registration.scope}`)

          if (registration.active) {
            // Check whether we have a cache, or cache it (no reload enforced).
            console.log('cache check')
            registration.active.postMessage({
              command: 'update',
              pathname: this.pathname
            })
          }
        }).catch(err => {
          console.log(`JakeCache installation failed: ${err}`)
        })
      }
    }

    if (document.readyState === 'complete') {
      onload()
    } else {
      document.onreadystatechange = onload
    }

    this[_status] = this.UNCACHED

    navigator.serviceWorker.addEventListener('message', event => {
      switch (event.data.type) {
        case 'abort':
          this.dispatchEvent(new CustomEvent('abort'))
          break
        case 'idle':
          this[_status] = this.IDLE
          break
        case 'checking':
          this[_status] = this.CHECKING
          this.dispatchEvent(new CustomEvent('checking'))
          break
        case 'cached':
          this[_status] = this.IDLE
          this.dispatchEvent(new CustomEvent('cached'))
          break
        case 'downloading':
          this[_status] = this.DOWNLOADING
          this.dispatchEvent(new CustomEvent('downloading'))
          break
        case 'updateready':
          this[_status] = this.UPDATEREADY
          this.dispatchEvent(new CustomEvent('updateready'))
          break
        case 'noupdate':
          this[_status] = this.IDLE
          this.dispatchEvent(new CustomEvent('noupdate'))
          break
        case 'progress':
          this.dispatchEvent(new ProgressEvent('progress', event.data))
          break
        case 'obsolete':
          this[_status] = this.OBSOLETE
          this.dispatchEvent(new CustomEvent('obsolete'))
          break
        case 'error':
          this.dispatchEvent(new ErrorEvent('error', event.data))
          break
      }
    })
  }

  get UNCACHED () { return 0 }
  get IDLE () { return 1 }
  get CHECKING () { return 2 }
  get DOWNLOADING () { return 3 }
  get UPDATEREADY () { return 4 }
  get OBSOLETE () { return 5 }

  get status () {
    return this[_status]
  }

  update () {
    if (false) {}

    navigator.serviceWorker.controller.postMessage({
      command: 'update',
      pathname: this.pathname,
      options: {
        cache: 'reload'
      }
    })
  }

  abort () {
    if (this.status === this.DOWNLOADING) {
      navigator.serviceWorker.controller.postMessage({
        command: 'abort'
      })
    }
  }

  swapCache () {
    if (this.status !== this.UPDATEREADY) {
      throw new DOMException(DOMException.INVALID_STATE_ERR,
        'there is no newer application cache to swap to.')
    }
    navigator.serviceWorker.controller.postMessage({
      command: 'swapCache'
    })
  }
}

new JakeCache()