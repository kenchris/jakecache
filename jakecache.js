const _eventHandlers = Symbol('eventHandlers');

class PolyfilledEventTarget {
  constructor(names) {
    this[_eventHandlers] = {};
    names.map(name => {
      this[_eventHandlers][name] = { handler: null, listeners: [] }
      Object.defineProperty(this, "on" + name, {
        get: function() {
          return this[_eventHandlers][name]["handler"];
        },
        set: function(fn) {
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
      if (index == -1) {
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
};

const _status = Symbol('status');
const _messageChannel = Symbol('messageChannel');

class JakeCache extends PolyfilledEventTarget {
  constructor() {
    super(["abort", "cached", "checking",
           "downloading", "error", "obsolete",
           "progress", "updateready", "noupdate"]);

    if (window.jakeCache)
      return window.jakeCache;
    window.jakeCache = this;

    this[_status] = this.UNCACHED;

    navigator.serviceWorker.addEventListener('message', event => {
      switch(event.data.type) {
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
          break;
        case "downloading":
          this[_status] = this.DOWNLOADING;
          this.dispatchEvent(new CustomEvent("downloading"));
          break;
        case "updateready":
          this[_status] = this.UPDATEREADY;
          this.dispatchEvent(new CustomEvent("updateready"));
          break;
        case "noupdate":
          this[_status] = this.IDLE;
          this.dispatchEvent(new CustomEvent("noupdate"));
          break;
        case "progress":
          this.dispatchEvent(new ProgressEvent("progress", event.data));
          break;
        case "obsolete":
          this[_status] = this.OBSOLETE;
          this.dispatchEvent(new CustomEvent("obsolete"));
          break;
        case "error":
         this.dispatchEvent(new ErrorEvent("error", event.data));
         break;
      }
    });
  }

  get UNCACHED() { return 0; }
  get IDLE() { return 1; }
  get CHECKING() { return 2; }
  get DOWNLOADING() { return 3; }
  get UPDATEREADY() { return 4; }
  get OBSOLETE() { return 5; }

  get status() {
    return this[_status];
  }

  update() {
    if (false) { //this.status == this.UNCACHED || this.status == this.OBSOLETE) {
      // If there is no such application cache, or if its
      // application cache group is marked as obsolete, then throw
      throw new DOMException(DOMException.INVALID_STATE_ERR,
        "there is no application cache to update.");
    }

    navigator.serviceWorker.controller.postMessage(
      { command: 'update' });
  }

  abort() {
    if (this.status == this.DOWNLOADING) {
      navigator.serviceWorker.controller.postMessage(
        { command: 'abort' });
    }
  }

  swapCache() {
    if (this.status != this.UPDATEREADY) {
      throw new DOMException(DOMException.INVALID_STATE_ERR,
        "there is no newer application cache to swap to.");
    }
    navigator.serviceWorker.controller.postMessage(
      { command: 'swapCache' });
  }
}

new JakeCache();