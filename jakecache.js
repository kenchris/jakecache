'use strict';



const _eventHandlers = Symbol("eventHandlers");

let CustomEvent = window.CustomEvent;
let DOMException = window.DOMException;
let ErrorEvent = window.ErrorEvent;
let ProgressEvent = window.ProgressEvent;

class PolyfilledEventTarget {
  constructor(names) {
    this[_eventHandlers] = {};

    names.map(name => {
      this[_eventHandlers][name] = { handler: null, listeners: [] };
      Object.defineProperty(this, "on" + name, {
        get: function () {
          return this[_eventHandlers][name]["handler"];
        },
        set: function (fn) {
          if (fn === null || fn instanceof Function) {
            this[_eventHandlers][name]["handler"] = fn;
          }
        },
        enumerable: false
      });
    });
  }

  dispatchEvent(event) {
    if (this[_eventHandlers][event.type]) {
      let handlers = this[_eventHandlers][event.type];
      let mainFn = handlers["handler"];
      if (mainFn) {
        mainFn(event);
      }
      for (let fn of handlers["listeners"]) {
        fn(event);
      }
    }
  }

  addEventListener(name, fn) {
    if (this[_eventHandlers][name]) {
      let store = this[_eventHandlers][name]["listeners"];
      let index = store.indexOf(fn);
      if (index === -1) {
        store.push(fn);
      }
    }
  }

  removeEventListener(name, fn) {
    if (this[_eventHandlers][name]) {
      let store = this[_eventHandlers][name]["listeners"];
      let index = store.indexOf(fn);
      if (index > 0) {
        store.splice(index, 1);
      }
    }
  }
}

const _status = Symbol("status");

class JakeCache extends PolyfilledEventTarget {
  constructor() {
    super([
      "abort",
      "cached",
      "checking",
      "downloading",
      "error",
      "obsolete",
      "progress",
      "updateready",
      "updated",
      "noupdate",
      "sw-not-attached"
    ]);

    if (window.jakeCache) {
      return window.jakeCache;
    }
    window.jakeCache = this;

    if ("serviceWorker" in navigator === false) {
      return;
    }

    const manifestAttr = "manifest";

    let onload = () => {
      if (document.readyState !== "complete") {
        return;
      }

      let html = document.querySelector("html");
      this.pathname = html.getAttribute(manifestAttr);

      if (this.pathname && "serviceWorker" in navigator) {

        var self = this;

        navigator.serviceWorker
          .register("jakecache-sw.js")
          .then(function (reg) {
            if (reg.installing) {
              console.log('JakeCache Service worker installing');
            } else if (reg.waiting) {
              console.log('JakeCache Service worker installed');
            } else if (reg.active) {
              console.log('JakeCache Service worker active');
            }
            return reg;
          })
          .then(navigator.serviceWorker.ready)
          .then(function (registration) {
            console.log('JakeCache service worker registered');
            if (registration.active) {
              registration.active.postMessage({
                command: "update",
                pathname: self.pathname
              });
            }
          })
          .catch(function (error) {
            console.error('JakeCache error when registering service worker', error, arguments)
          });
      }
    };

    function onStateChange(from, registration) {
      return function (e) {
        console.log('JakeCache statechange initial state ', from, 'changed to', e.target.state);
        if (e.target.state === 'activated') {
          // Check whether we have a cache, or cache it (no reload enforced).
          console.log("JakeCache cache check for update");

          let html = document.querySelector("html");
          this.pathname = html.getAttribute(manifestAttr);
          if (navigator.onLine && registration.active) {
            registration.active.postMessage({
              command: "update",
              pathname: this.pathname
            });
          }
        }
      };
    }

    if (document.readyState === "complete") {
      onload();
    } else {
      document.onreadystatechange = onload;
    }

    // force refresh page if no service worker responsed
    const forceReloadPageIfServiceWorkerNotAttachedToPage = false;

    this.checkIfServiceWorkerAttachedToPage = function checkIfServiceWorkerAttachedToPage() {
      console.log('JakeCache checking for Service Fetch');
      fetch(`sw-fetch-test`)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response;
        })
        .then(response => response.json())
        .then((data) => {
          if (data.result !== 'ok') {
            throw Error("Invalid response");
          }
        })
        .catch(err => {
          console.log('JakeCache Service worker not attached !!!');

          if (forceReloadPageIfServiceWorkerNotAttachedToPage) {
            location.reload();
          }
          else {
            this.dispatchEvent(new CustomEvent("sw-not-attached"));
          }
        });
    }

    this[_status] = this.UNCACHED;

    navigator.serviceWorker.addEventListener("message", event => {
      switch (event.data.type) {
        case "abort":
          this.dispatchEvent(new CustomEvent("abort"));
          break;
        case "idle":
          this[_status] = this.IDLE;
          break;
        case "checking":
          this[_status] = this.CHECKING;
          this.dispatchEvent(new CustomEvent("checking"));
          break;
        case "cached":
          this[_status] = this.IDLE;
          this.dispatchEvent(new CustomEvent("cached"));
          this.checkIfServiceWorkerAttachedToPage();
          break;
        case "downloading":
          this[_status] = this.DOWNLOADING;
          this.dispatchEvent(new CustomEvent("downloading"));
          break;
        case "updateready":
          this[_status] = this.UPDATEREADY;
          this.dispatchEvent(new CustomEvent("updateready"));
          break;
        case "updated":
          this[_status] = this.UPDATED;
          this.dispatchEvent(new CustomEvent("updated"));
          break;
        case "noupdate":
          this[_status] = this.IDLE;
          this.dispatchEvent(new CustomEvent("noupdate"));
          console.log('JakeCache noupdate event');
          this.checkIfServiceWorkerAttachedToPage();
          break;
        case "progress":
          let ev = new ProgressEvent("progress", event.data);
          ev.url = event.data.url;
          this.dispatchEvent(ev);
          break;
        case "obsolete":
          this[_status] = this.OBSOLETE;
          this.dispatchEvent(new CustomEvent("obsolete"));
          break;
        case "error":
          this.dispatchEvent(new ErrorEvent("error", event.data));

          // try to update 
          this.update();
          break;
      }
    });
  }

  get UNCACHED() {
    return 0;
  }
  get IDLE() {
    return 1;
  }
  get CHECKING() {
    return 2;
  }
  get DOWNLOADING() {
    return 3;
  }
  get UPDATEREADY() {
    return 4;
  }
  get OBSOLETE() {
    return 5;
  }
  get UPDATED() {
    return 6;
  }
  get status() {
    return this[_status];
  }

  update() {
    if (false) { }

    if (navigator.onLine && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        command: "update",
        pathname: this.pathname,
        options: {
          cache: "reload"
        }
      });
    }
  }

  abort() {
    if (this.status === this.DOWNLOADING) {
      navigator.serviceWorker.controller.postMessage({
        command: "abort"
      });
    }
  }

  swapCache() {
    if (this.status !== this.UPDATEREADY) {
      throw new DOMException(
        DOMException.INVALID_STATE_ERR,
        "there is no newer application cache to swap to."
      );
    }

    navigator.serviceWorker.controller.postMessage({
      command: "swapCache"
    });
  }
}

new JakeCache();