const CACHE_VERSION = "2026-03-21T22:09:55.020Z";
const STATIC_CACHE = `memento-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `memento-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Precache the offline page on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle PWA share target POST — forward to server for processing
  if (request.method === "POST" && url.pathname === "/api/articles/share") {
    event.respondWith(fetch(request));
    return;
  }

  // Skip non-GET requests (server actions, form submissions)
  if (request.method !== "GET") return;

  // Skip Supabase API calls (auth-sensitive, RLS-dependent)
  if (url.hostname.includes("supabase")) return;

  // Skip browser-extension and chrome-extension requests
  if (!url.protocol.startsWith("http")) return;

  // Cache-first for Next.js static assets (content-hashed, immutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Network-first for navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Stale-while-revalidate for other GET requests (RSC payloads, images, etc.)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
