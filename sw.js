
const CACHE_NAME = 'deep-shift-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                // We attempt to cache the shell. 
                // Note: External CDN resources (opaque responses) are handled in runtime caching.
                return cache.addAll(URLS_TO_CACHE).catch(err => {
                    console.warn('Failed to cache core assets on install', err);
                });
            })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    // Start a background fetch to update the cache (Stale-while-revalidate)
                    // This ensures the user gets the latest version next time
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                         if (networkResponse && networkResponse.status === 200) {
                             const responseToCache = networkResponse.clone();
                             caches.open(CACHE_NAME).then((cache) => {
                                 cache.put(event.request, responseToCache);
                             });
                         }
                         return networkResponse;
                    }).catch(() => {
                        // Network failed, do nothing (we already returned cache)
                    });
                    
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || (response.status !== 200 && response.type !== 'opaque')) {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
