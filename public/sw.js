const CACHE_NAME = 'tiny-pixel-editor-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Handle Web Share Target: POST /share-target with a shared image file
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const imageFile = formData.get('image');

        // Open (or focus) the app client and pass the shared file via postMessage
        const clients = await self.clients.matchAll({ type: 'window' });
        if (clients.length > 0) {
          const arrayBuffer = await imageFile.arrayBuffer();
          clients[0].postMessage({
            type: 'SHARE_TARGET_IMAGE',
            fileName: imageFile.name,
            mimeType: imageFile.type,
            buffer: arrayBuffer,
          }, [arrayBuffer]);
          await clients[0].focus();
        }

        // Redirect back to the app root
        return Response.redirect('/', 303);
      })(),
    );
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchAndUpdate = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetchAndUpdate;
    }),
  );
});
