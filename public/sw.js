/**
 * Service Worker for BPMETER PWA
 * 
 * Provides offline caching of app shell and basic resources.
 */

const CACHE_NAME = 'bpmeter-v1';
const OFFLINE_URL = '/';

// Files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/audio-processor.js',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache successful responses
        if (fetchResponse && fetchResponse.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            // Don't cache API calls or worklet files during runtime
            if (!event.request.url.includes('/api/') && 
                !event.request.url.includes('audio-processor.js')) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // If both cache and network fail, show offline page
      if (event.request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
    })
  );
});

// Background sync (optional - for future features)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync', event.tag);
});

// Push notifications (optional - for future features)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
});

