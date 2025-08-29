// Service Worker for Mic Finder PWA
const CACHE_NAME = 'mic-finder-v1.11';
const STATIC_CACHE = 'mic-finder-static-v1.11';
const DYNAMIC_CACHE = 'mic-finder-dynamic-v1.11';

// Core assets that should always be cached
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/mobile.css',
  '/css/sidebar.css',
  '/css/map.css',
  '/css/minimized.css',
  '/js/app.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/state.js',
  '/js/map.js',
  '/js/filters.js',
  '/js/ui.js',
  '/js/favorites.js',
  '/js/accessibility.js',
  '/js/micDataLoader.js',
  '/manifest.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js'
];

// Firebase and fonts that can be cached dynamically
const DYNAMIC_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /^https:\/\/www\.gstatic\.com\/firebasejs/,
  /^https:\/\/.*\.firebaseapp\.com/,
  /^https:\/\/.*\.cloudfunctions\.net/
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache core application assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching core assets...');
        return cache.addAll(CORE_ASSETS.map(url => new Request(url, {
          credentials: 'same-origin'
        })));
      }),
      
      // Cache external dependencies
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('[SW] Caching external assets...');
        return Promise.allSettled(
          EXTERNAL_ASSETS.map(url => 
            cache.add(new Request(url, { mode: 'cors' }))
              .catch(err => console.warn(`[SW] Failed to cache ${url}:`, err))
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (CORE_ASSETS.some(asset => request.url.includes(asset))) {
    // Core assets: Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (request.url.includes('coordinates_fixed.csv')) {
    // Data files: Network First with cache fallback
    event.respondWith(networkFirst(request));
  } else if (DYNAMIC_PATTERNS.some(pattern => pattern.test(request.url))) {
    // External resources: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else if (request.url.includes('firestore') || request.url.includes('firebase')) {
    // Firebase requests: Network Only (for real-time data)
    event.respondWith(networkOnly(request));
  } else if (request.destination === 'image') {
    // Images: Cache First with fallback
    event.respondWith(cacheFirst(request));
  } else {
    // Everything else: Network First
    event.respondWith(networkFirst(request));
  }
});

// Cache First strategy - for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Cache first failed:', error);
    return caches.match('/index.html'); // Fallback to main page
  }
}

// Network First strategy - for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

// Stale While Revalidate strategy - for external resources
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.warn('[SW] Stale while revalidate fetch failed:', error);
    return cachedResponse; // Return cached version if network fails
  });
  
  return cachedResponse || fetchPromise;
}

// Network Only strategy - for real-time data
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.warn('[SW] Network only failed:', error);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Sync favorites when back online
async function syncFavorites() {
  try {
    // Get pending favorites from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'SYNC_FAVORITES',
        data: { success: true }
      });
    }
  } catch (error) {
    console.error('[SW] Error syncing favorites:', error);
  }
}

// Push notification handler (for future use)
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New comedy mics available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Mic Finder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open the app
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache());
  }
});

// Manually update cache
async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CORE_ASSETS);
    console.log('[SW] Cache updated successfully');
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}

console.log('MOBILE DEBUG: Script loaded');