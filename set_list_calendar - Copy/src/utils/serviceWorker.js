/**
 * Service Worker Registration and Management
 * Handles offline support, caching, and background sync
 */

const isDevelopment = import.meta.env.MODE === 'development';
const SW_URL = '/sw.js';

// Check if service worker is supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Register service worker
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.log('🚫 Service Worker not supported');
    return null;
  }

  try {
    console.log('🔧 Registering Service Worker...');
    
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      console.log('🔄 Service Worker update found');
      handleServiceWorkerUpdate(registration);
    });

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

// Handle service worker updates
const handleServiceWorkerUpdate = (registration) => {
  const newWorker = registration.installing;
  
  if (!newWorker) return;

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New service worker available
      console.log('🆕 New Service Worker available');
      
      // Show update notification to user
      showUpdateNotification(() => {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  });
};

// Show update notification to user
const showUpdateNotification = (onUpdate) => {
  // This could be integrated with your notification system
  if (isDevelopment) {
    console.log('📢 Update available - would show notification in production');
    return;
  }
  
  // Simple browser notification for now
  if (confirm('A new version of the app is available. Update now?')) {
    onUpdate();
  }
};

// Handle messages from service worker
const handleServiceWorkerMessage = (event) => {
  console.log('📩 Message from Service Worker:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('💾 Cache updated for:', event.data.url);
        break;
      case 'OFFLINE_READY':
        console.log('📱 App ready for offline use');
        showOfflineReadyNotification();
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
};

// Show offline ready notification
const showOfflineReadyNotification = () => {
  if (isDevelopment) {
    console.log('📱 App cached and ready for offline use');
  }
  // Could integrate with your toast/notification system
};

// Check if app is running offline
export const isOffline = () => {
  return !navigator.onLine;
};

// Listen for online/offline status changes
export const setupOfflineDetection = (onOnline, onOffline) => {
  const handleOnline = () => {
    console.log('🌐 App is online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('📱 App is offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Background sync functions
export const requestBackgroundSync = async (tag) => {
  if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
    console.log('🚫 Background Sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log('🔄 Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('❌ Background sync registration failed:', error);
    return false;
  }
};

// Cache management
export const sendMessageToServiceWorker = (message) => {
  if (!navigator.serviceWorker.controller) {
    console.log('🚫 No active service worker');
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
};

// Cache a joke for offline use
export const cacheJoke = (joke) => {
  sendMessageToServiceWorker({
    type: 'CACHE_JOKE',
    joke
  });
};

// Cache a setlist for offline use
export const cacheSetlist = (setlist) => {
  sendMessageToServiceWorker({
    type: 'CACHE_SETLIST',
    setlist
  });
};

// Push notification setup
export const setupPushNotifications = async () => {
  if (!('Notification' in window) || !('PushManager' in window)) {
    console.log('🚫 Push notifications not supported');
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('🚫 Notification permission denied');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });

    console.log('🔔 Push notifications enabled');
    return subscription;
  } catch (error) {
    console.error('❌ Push notification setup failed:', error);
    return null;
  }
};

// Unregister service worker (for development/debugging)
export const unregisterServiceWorker = async () => {
  if (!isServiceWorkerSupported()) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('🗑️ Service Worker unregistered');
    }
  } catch (error) {
    console.error('❌ Failed to unregister Service Worker:', error);
  }
};

// Service Worker status
export const getServiceWorkerStatus = async () => {
  if (!isServiceWorkerSupported()) {
    return { supported: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      waiting: !!registration?.waiting,
      installing: !!registration?.installing,
      controller: !!navigator.serviceWorker.controller
    };
  } catch (error) {
    return { supported: true, error: error.message };
  }
};