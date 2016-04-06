# JakeCache

Declarative manifest-driven app cache top of ServiceWorker.

![](http://i.imgur.com/njqdZ5L.png?1)

Buiding offline-first applications has been the ubiquius dream since the early days of the web. Google started by introducing Google Gears, and later followed the web community by building [Application Cache](https://www.w3.org/TR/2011/WD-html5-20110525/offline.html).

Application Cache was a great step forward, but had several fundemental flaws that were made famous by [Jake Archibald](https://twitter.com/jaffathecake)'s epic [Application Cache is a Douchebag](http://alistapart.com/article/application-cache-is-a-douchebag) article and [talk](https://www.youtube.com/watch?v=cR-TP6jOSQM). So Jake, [Alex Russel](https://twitter.com/slightlylate) and many others, have been busy working on the next generation of application caching API's which today are know as the [Service Worker Specification](https://github.com/slightlyoff/ServiceWorker).

Service Worker is great, but if you ever had a look at it's API(s) you realize that they are complicated imperative JavaScript API's. These API's tend to scary many web developers who perfer a nice forgiving declarative approach. So in order to fix the *too* complicated Service Worker API, we are super excited to introduce **JakeCache**, a declarative manifest-driven application cache for web applications implemented on top of ServiceWorker.

*Sarcasm may occur*

## Get started

1. Create a new JakeCache Manifest, `app.jakecache` and save it in your root:
```
JAKECACHE MANIFEST
# 2010-06-18:v2

# Explicitly cached 'master entries'.
CACHE:
/test.html

# Resources that require the user to be online.
NETWORK:
*
```

2. Include ```<html manifest="app.jakecache">``` in your HTML.
3. That's it!


...










