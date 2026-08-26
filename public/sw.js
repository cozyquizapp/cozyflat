const CACHE = "cozyflat-shell-v6";
const SHELL = ["/", "/manifest.webmanifest", "/app-icon.png", "/staubi.png", "/avatar-johannes.png", "/avatar-sonja.png"];

self.addEventListener("install", (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  await self.skipWaiting();
})()));

self.addEventListener("activate", (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING" && self.skipWaiting) {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (url.pathname.startsWith("/garden/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === "navigate" ? caches.match("/") : Response.error()))));
});
