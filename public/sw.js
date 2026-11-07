/**
 * Service Worker на учителския облак на ДГ „Пролет“ — по модела на МатураПлюс (public/sw.js).
 * Кешира статичните файлове и отворените страници; без интернет показва последната
 * запазена версия на страницата или /offline.html. API заявките винаги отиват към сървъра.
 */

const CACHE_NAME = "detski-pwa-v2";

const PRECACHE_ASSETS = ["/", "/offline.html", "/manifest.json", "/icon-192.svg", "/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // allSettled: инсталацията не пада, ако един ресурс липсва
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

  // API (вход, библиотека, генериране) и анализите — само през мрежата
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_vercel/")) return;

  // Статични файлове на Next.js, шрифтове, картинки: Cache-First
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/.test(url.pathname);

  if (isStaticAsset) {
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

  // Страници: Network-First с кеш и /offline.html без връзка
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const offlineFallback = await caches.match("/offline.html");
          if (offlineFallback) return offlineFallback;
          return new Response("Няма връзка с интернет.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }),
    );
  }
});
