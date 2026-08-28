const CACHE_PREFIX = 'clyvora-fetch-'
const CACHE = `${CACHE_PREFIX}0.1.0-experimental.1`
const SHELL = ['/', '/manifest.webmanifest', '/favicon.png']
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))); self.skipWaiting() })
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || event.request.mode !== 'navigate') return
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone()
    if (response.ok) event.waitUntil(caches.open(CACHE).then((cache) => cache.put('/', copy)))
    return response
  }).catch(() => caches.match('/')))
})

