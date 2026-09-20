/* Service Worker minimal untuk PWA Konseling VR.
 * Strategi:
 * - App shell (HTML/JS/CSS) : network-first, fallback cache (biar update
 *   deploy langsung kepakai saat online, tetap bisa dibuka saat offline).
 * - Aset statis (ikon, video, data) : cache-first + update di background.
 * Versi cache: naikkan CACHE_VERSION tiap ada perubahan besar agar klien
 * tidak terjebak di cache lama.
 */
const CACHE_VERSION = "konseling-vr-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .catch(() => {})
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Hanya cache same-origin (API backend tetap network-only).
  if (url.origin !== self.location.origin) return;

  const isShell =
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css");

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      if (isShell) {
        // Network-first untuk shell + build asset berversi.
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          const hit = await cache.match(request, { ignoreSearch: true });
          if (hit) return hit;
          return cache.match("/index.html");
        }
      }
      // Cache-first untuk ikon/video/data.
      const hit = await cache.match(request);
      if (hit) {
        fetch(request)
          .then((fresh) => {
            if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
          })
          .catch(() => {});
        return hit;
      }
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        return Response.error();
      }
    })()
  );
});
