const CACHE = "cozyflat-static-v14";
const OFFLINE_DOCUMENT = "/__cozyflat-offline";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icon-192.png",
  "/flauschi-cookie-whole-v1.webp",
  "/flauschi-cookie-bite-v1.webp",
  "/flauschi-cookie-half-v1.webp",
  "/flauschi-cookie-crumbs-v1.webp",
  "/flauschi-petting-hand-v1.webp",
  "/flauschi-play-ball-v1.webp",
  "/flauschi-sleep-v1.webp",
  "/flauschi-cheer-v1.webp",
  "/flauschi-idle-v2.webp",
  "/flauschi-blink-v2.webp",
  "/flauschi-bite-open-v2.webp",
  "/flauschi-chew-v2.webp",
  "/flauschi-petted-v2.webp",
  "/flauschi-decor-garland-v1.webp",
  "/flauschi-decor-toy-basket-v1.webp",
  "/flauschi-decor-window-lights-v1.webp",
  "/flauschi-decor-star-pillow-v1.webp",
  "/flauschi-room-morning-v1.webp",
  "/flauschi-room-day-v1.webp",
  "/flauschi-room-evening-v1.webp",
  "/flauschi-room-night-v1.webp",
  "/nest-finds/feather.webp",
  "/nest-finds/sun-button.webp",
  "/nest-finds/seed-letter.webp",
  "/nest-finds/dew-pearl.webp",
  "/nest-finds/yarn-pompom.webp",
  "/nest-finds/tiny-key.webp",
  "/nest-finds/leaf-medallion.webp",
  "/nest-finds/lucky-pebble.webp",
  "/nest-finds/amber-bead.webp",
  "/nest-finds/tea-star.webp",
  "/nest-finds/velvet-ribbon.webp",
  "/nest-finds/golden-leaf.webp",
  "/nest-finds/moon-button.webp",
  "/nest-finds/glow-pebble.webp",
  "/nest-finds/dream-fluff.webp",
  "/nest-finds/star-fragment.webp",
  "/nest-finds/together-acorn.webp",
  "/nest-finds/home-charm.webp",
  "/nest-finds/leaf-heart.webp",
  "/nest-finds/duo-star.webp",
  "/loading-mobile-clean.webp",
  "/avatar-johannes.webp",
  "/avatar-sonja.webp",
];

self.addEventListener("install", (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await Promise.all(STATIC_ASSETS.map(async (asset) => {
    try {
      const response = await fetch(asset, { cache: "reload" });
      if (response.ok) await cache.put(asset, response);
    } catch {
      // A missing optional asset must never prevent an app update.
    }
  }));
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

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        // Home-screen launches must always check the server before using an
        // offline copy. `no-store` also bypasses Safari's HTTP page cache.
        const response = await fetch(event.request, { cache: "no-store" });
        if (response.ok) await cache.put(OFFLINE_DOCUMENT, response.clone());
        return response;
      } catch {
        return (await cache.match(OFFLINE_DOCUMENT)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || Response.error())));
});
