/**
 * Service Worker for Collaborative Setlist Builder
 * Provides offline support, caching, and background sync
 */

const CACHE_NAME = 'setlist-builder-v2.0.0';
const STATIC_CACHE = 'setlist-static-v2.0.0';
const DYNAMIC_CACHE = 'setlist-dynamic-v2.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/react-demo.html',
  '/src/main.jsx',
  '/src/styles/global.css',
  '/vite.svg',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Network-first resources (always try network, fallback to cache)
const NETWORK_FIRST = [
  '/src/',
  'https://fonts.googleapis.com',
  'https://cdnjs.cloudflare.com'
];

// Cache-first resources (check cache first, then network)
const CACHE_FIRST = [
  '/vite.svg',
  '.woff2',
  '.woff',
  '.ttf',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.gif',
  '.ico'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('✅ Service Worker installed');
      return self.skipWaiting(); // Activate immediately
    }).catch((error) => {
      console.error('❌ Service Worker install failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different caching strategies
  if (shouldUseNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (shouldUseCacheFirst(request.url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📱 Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/react-demo.html');
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch:', request.url, error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch((error) => {
    console.log('📱 Network request failed:', request.url);
    return null;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network
  return fetchPromise;
}

// Helper functions
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function shouldUseCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// Background sync for offline joke/setlist creation
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-jokes') {
    event.waitUntil(syncPendingJokes());
  } else if (event.tag === 'sync-setlists') {
    event.waitUntil(syncPendingSetlists());
  }
});

// Sync pending jokes when back online
async function syncPendingJokes() {
  try {
    const pendingJokes = await getPendingJokes();
    
    for (const joke of pendingJokes) {
      await syncJokeToServer(joke);
    }
    
    await clearPendingJokes();
    console.log('✅ Synced pending jokes');
  } catch (error) {
    console.error('❌ Failed to sync jokes:', error);
  }
}

// Sync pending setlists when back online
async function syncPendingSetlists() {
  try {
    const pendingSetlists = await getPendingSetlists();
    
    for (const setlist of pendingSetlists) {
      await syncSetlistToServer(setlist);
    }
    
    await clearPendingSetlists();
    console.log('✅ Synced pending setlists');
  } catch (error) {
    console.error('❌ Failed to sync setlists:', error);
  }
}

// IndexedDB helpers for offline storage
async function getPendingJokes() {
  // This would integrate with your IndexedDB implementation
  return [];
}

async function getPendingSetlists() {
  // This would integrate with your IndexedDB implementation
  return [];
}

async function syncJokeToServer(joke) {
  // This would sync with your Firebase backend
  console.log('📤 Syncing joke:', joke.id);
}

async function syncSetlistToServer(setlist) {
  // This would sync with your Firebase backend
  console.log('📤 Syncing setlist:', setlist.id);
}

async function clearPendingJokes() {
  // Clear synced jokes from IndexedDB
}

async function clearPendingSetlists() {
  // Clear synced setlists from IndexedDB  
}

// Push notifications for collaboration
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event.data?.text());
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Setlist Builder';
  const options = {
    body: data.body || 'New activity in your setlist',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/vite.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('react-demo.html') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/react-demo.html');
        }
      })
    );
  }
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  console.log('📩 Service Worker message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CACHE_JOKE':
        cacheJoke(event.data.joke);
        break;
      case 'CACHE_SETLIST':
        cacheSetlist(event.data.setlist);
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

async function cacheJoke(joke) {
  // Cache joke data for offline access
  console.log('💾 Caching joke:', joke.id);
}

async function cacheSetlist(setlist) {
  // Cache setlist data for offline access
  console.log('💾 Caching setlist:', setlist.id);
}