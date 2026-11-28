/**
 * Service Worker на ДГ „Пролет“ (v4).
 * - Неизменяемите хеширани ресурси (/_next/static/, /fonts/) — Cache-First.
 * - Бранд картинки и манифест — Stale-While-Revalidate (винаги актуални без ръчно чистене).
 * - Частните учителски страници и API заявките НИКОГА не се кешират (сигурност на споделен компютър).
 * - Без интернет показва запазена публична страница или /offline.html.
 */

const CACHE_NAME = "detski-pwa-v4";

const PRECACHE_ASSETS = ["/offline.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

/** Само публичните страници (без лични/учителски данни) могат да се кешират за офлайн преглед. */
function isPublicCacheablePage(pathname) {
  return (
    pathname === "/grupi" ||
    pathname.startsWith("/grupi/") ||
    pathname === "/vitrina" ||
    pathname.startsWith("/vitrina/") ||
    pathname === "/privacy" ||
    pathname === "/terms"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" }))));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) console.warn("[SW] Some precache assets failed:", failed.length);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || !url.protocol.startsWith("http") || url.origin !== self.location.origin) return;

  // API (вход, библиотека, облак, генериране) и анализи — само през мрежата
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_vercel/")) return;

  // Неизменяеми ресурси с хеш в името и локални шрифтове: Cache-First
  const isImmutableAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/");
  if (isImmutableAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Нехеширани статични файлове (/brand/*, икони, манифест): Stale-While-Revalidate
  const isMutableStatic = /\.(png|jpg|jpeg|svg|webp|ico|json)$/.test(url.pathname);
  if (isMutableStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkPromise;
      }),
    );
    return;
  }

  // Страници: Network-First; кешират се само публичните страници без лични данни
  if (request.mode === "navigate") {
    const canCache = isPublicCacheablePage(url.pathname);
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cc = response.headers.get("cache-control") || "";
          if (canCache && response && response.status === 200 && !cc.includes("private") && !cc.includes("no-store")) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          if (canCache) {
            const cachedPage = await caches.match(request);
            if (cachedPage) return cachedPage;
          }
          const offlineFallback = await caches.match("/offline.html");
          if (offlineFallback) return offlineFallback;
          return new Response("Няма връзка с интернет.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }),
    );
  }
});
