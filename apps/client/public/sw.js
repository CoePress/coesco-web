/**
 * Service Worker for Performance Data Caching and Offline Support
 * Handles caching of performance calculations and provides offline functionality
 */

const CACHE_NAME = 'coesco-performance-v1';
const PERFORMANCE_CACHE = 'performance-calculations-v1';
const STATIC_CACHE = 'static-assets-v1';

// Cache strategies
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// URLs to cache
const STATIC_ASSETS = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json'
];

const PERFORMANCE_API_PATTERNS = [
    /\/api\/performance\//,
    /\/api\/performance-sheets\//,
    /\/api\/rfq\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');

    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(PERFORMANCE_CACHE),
            caches.open(CACHE_NAME)
        ]).then(() => {
            console.log('[SW] Static assets cached');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME &&
                        cacheName !== PERFORMANCE_CACHE &&
                        cacheName !== STATIC_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Service worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle performance API requests
    if (PERFORMANCE_API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
        event.respondWith(handlePerformanceRequest(request));
        return;
    }

    // Handle static assets
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image') {
        event.respondWith(handleStaticAssets(request));
        return;
    }

    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
        return;
    }

    // Default: network first
    event.respondWith(
        fetch(request).catch(() => {
            return caches.match(request);
        })
    );
});

// Handle performance API requests with cache-first strategy for calculations
async function handlePerformanceRequest(request) {
    const url = new URL(request.url);
    const cache = await caches.open(PERFORMANCE_CACHE);

    // For GET requests, try cache first for calculations
    if (request.method === 'GET' && url.pathname.includes('/calculate')) {
        try {
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
                console.log('[SW] Serving cached performance calculation:', url.pathname);

                // Update cache in background
                fetch(request).then(response => {
                    if (response.ok) {
                        cache.put(request, response.clone());
                    }
                }).catch(() => {
                    // Ignore network errors for background updates
                });

                return cachedResponse;
            }
        } catch (error) {
            console.warn('[SW] Cache lookup failed:', error);
        }
    }

    // Network first for other requests
    try {
        const response = await fetch(request);

        // Cache successful GET responses
        if (response.ok && request.method === 'GET') {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.warn('[SW] Network request failed:', error);

        // Try to serve from cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline response for performance calculations
        if (url.pathname.includes('/calculate')) {
            return new Response(JSON.stringify({
                error: 'Offline - calculation not available',
                offline: true,
                cached: false
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        throw error;
    }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
    const cache = await caches.open(STATIC_CACHE);

    try {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
    } catch (error) {
        console.warn('[SW] Static cache lookup failed:', error);
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('[SW] Static asset fetch failed:', error);
        throw error;
    }
}

// Handle navigation requests
async function handleNavigation(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.warn('[SW] Navigation request failed:', error);

        // Serve cached index.html for offline navigation
        const cache = await caches.open(STATIC_CACHE);
        const cachedIndex = await cache.match('/');

        if (cachedIndex) {
            return cachedIndex;
        }

        throw error;
    }
}

// Background sync for performance data
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync event:', event.tag);

    if (event.tag === 'performance-sync') {
        event.waitUntil(syncPerformanceData());
    }
});

async function syncPerformanceData() {
    try {
        // Get pending calculations from IndexedDB
        const pendingCalculations = await getPendingCalculations();

        for (const calculation of pendingCalculations) {
            try {
                const response = await fetch(calculation.url, {
                    method: calculation.method,
                    headers: calculation.headers,
                    body: calculation.body
                });

                if (response.ok) {
                    // Remove from pending calculations
                    await removePendingCalculation(calculation.id);

                    // Cache the result
                    const cache = await caches.open(PERFORMANCE_CACHE);
                    await cache.put(calculation.url, response.clone());

                    console.log('[SW] Synced pending calculation:', calculation.id);
                }
            } catch (error) {
                console.warn('[SW] Failed to sync calculation:', calculation.id, error);
            }
        }
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// IndexedDB helpers for pending calculations
async function getPendingCalculations() {
    // Implementation would depend on your IndexedDB structure
    return [];
}

async function removePendingCalculation(id) {
    // Implementation would depend on your IndexedDB structure
    console.log('[SW] Would remove pending calculation:', id);
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'CACHE_PERFORMANCE_DATA':
            handleCachePerformanceData(payload);
            break;
        case 'CLEAR_CACHE':
            handleClearCache(payload);
            break;
        case 'GET_CACHE_STATUS':
            handleGetCacheStatus(event);
            break;
        default:
            console.warn('[SW] Unknown message type:', type);
    }
});

async function handleCachePerformanceData(data) {
    try {
        const cache = await caches.open(PERFORMANCE_CACHE);
        const response = new Response(JSON.stringify(data.response), {
            headers: { 'Content-Type': 'application/json' }
        });

        await cache.put(data.url, response);
        console.log('[SW] Cached performance data:', data.url);
    } catch (error) {
        console.error('[SW] Failed to cache performance data:', error);
    }
}

async function handleClearCache(cacheType) {
    try {
        if (cacheType === 'performance' || cacheType === 'all') {
            await caches.delete(PERFORMANCE_CACHE);
            await caches.open(PERFORMANCE_CACHE);
            console.log('[SW] Cleared performance cache');
        }

        if (cacheType === 'static' || cacheType === 'all') {
            await caches.delete(STATIC_CACHE);
            await caches.open(STATIC_CACHE);
            console.log('[SW] Cleared static cache');
        }
    } catch (error) {
        console.error('[SW] Failed to clear cache:', error);
    }
}

async function handleGetCacheStatus(event) {
    try {
        const performanceCache = await caches.open(PERFORMANCE_CACHE);
        const staticCache = await caches.open(STATIC_CACHE);

        const performanceCacheKeys = await performanceCache.keys();
        const staticCacheKeys = await staticCache.keys();

        const status = {
            performance: {
                size: performanceCacheKeys.length,
                keys: performanceCacheKeys.map(req => req.url)
            },
            static: {
                size: staticCacheKeys.length,
                keys: staticCacheKeys.map(req => req.url)
            }
        };

        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
        event.ports[0].postMessage({ type: 'ERROR', payload: error.message });
    }
}
