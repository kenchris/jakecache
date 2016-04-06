# JakeCache

🎂 Declarative manifest-driven app cache top of ServiceWorker.

[![Build status](https://travis-ci.org/kenchris/jakecache.svg?branch=master)](https://travis-ci.org/kenchris/jakecache)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

![](http://i.imgur.com/njqdZ5L.png?1)

## Why?

Buiding offline-first applications has been the ubiquius dream since the early days of the web. Google started by introducing Google Gears, and later followed the web community by building [Application Cache](https://www.w3.org/TR/2011/WD-html5-20110525/offline.html).

Application Cache was a great step forward, but had several fundemental flaws that were made famous by [Jake Archibald](https://twitter.com/jaffathecake)'s epic [Application Cache is a Douchebag](http://alistapart.com/article/application-cache-is-a-douchebag) article and [talk](https://www.youtube.com/watch?v=cR-TP6jOSQM). So Jake, [Alex Russel](https://twitter.com/slightlylate) and many others, have been busy working on the next generation of application caching API's which today are know as the [Service Worker Specification](https://github.com/slightlyoff/ServiceWorker).

Service Worker is great, but if you ever had a look at it's API(s) you realize that they are complicated imperative JavaScript API's. These API's tend to scary many web developers who perfer a nice forgiving declarative approach. 

So in order to **fix** the **too** complicated Service Worker API, we are super excited to introduce **JakeCache**. A declarative manifest-driven application cache for web applications implemented on top of ServiceWorker.

*Sarcasm may occur in this project*

😂

### Polyfil 

JakeCache serves the additional purpose of being as compatible with the HTML5 Application Cache (aka AppCache) as we could make it and may serve as a polyfill in browsers removing such support. 

Patches are welcome!

## Installation

```
npm install jakecache
```

## Get started

1. Create a new JakeCache Manifest, `app.jakecache` and save it in your root:
```
CACHE MANIFEST
# 2010-06-18:v2

# Explicitly cached 'master entries'.
CACHE:
/test.html

# Resources that require the user to be online.
NETWORK:
*
```

1. Include ``jakecache.js`` on your page, maybe via ```<script src="jakecache.js"></script>```
2. Add ```<html manifest="app.jakecache">``` to your HTML.
3. That's it! Your website is now Jake-enabled!

## License

See [LICENSE.md](https://github.com/kenchris/jakecache/blob/master/LICENSE.md)

### About this project
This is a project by [Kenneth Christiansen](https://twitter.com/kennethrohde) & [Kenneth Auchenberg](https://twitter.com/auchenberg) and a result of too much 🍺 and ☕.
