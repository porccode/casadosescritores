// Minimal Service Worker to silence 404 errors
// This is required because the browser or manifest.json might be requesting a service worker
// even if one isn't explicitly registered in the current codebase.

self.addEventListener('install', () => {
    self.skipWaiting();
    console.log('[SW] Service Worker installed');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
    console.log('[SW] Service Worker activated');
});

// For future push notifications, you can add 'push' event listeners here
