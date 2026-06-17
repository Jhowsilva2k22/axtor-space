// Axtor Space — service worker (PWA)
// Estrategia:
//  - Navegacao (HTML): NetworkFirst -> cache da rota -> casca do app -> offline
//  - Assets com hash (/assets/*): CacheFirst (imutaveis; deploy gera nome novo)
//  - Imagens: StaleWhileRevalidate (storage/proxy incluso) -> mata flicker e segura 4G
//  - Supabase (REST/RPC/functions) e websockets: PASSAM DIRETO, nunca cacheados
//
// Para forcar limpeza total de cache num deploy critico: incrementar VERSION.

const VERSION = "v1";
const STATIC_CACHE = `axtor-static-${VERSION}`;
const IMAGE_CACHE = `axtor-img-${VERSION}`;
const PAGE_CACHE = `axtor-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const APP_SHELL = "/"; // index.html (a SPA boota a partir daqui)
const KEEP = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

self.addEventListener("install", (event) => {
  // Pre-cacheia a casca do app e a tela offline ja no install,
  // pra navegacao offline funcionar mesmo no 1o acesso sem controle previo.
  event.waitUntil(
    caches.open(PAGE_CACHE).then((c) =>
      c.addAll([APP_SHELL, OFFLINE_URL]).catch(() => c.add(OFFLINE_URL)),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin && url.pathname.startsWith("/assets/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // POST/PUT etc: sempre rede

  const url = new URL(req.url);

  // 1) Navegacao (HTML): NetworkFirst -> cache da rota -> casca -> offline
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(PAGE_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(PAGE_CACHE);
          const cached =
            (await cache.match(req)) ||
            (await cache.match(APP_SHELL)) ||
            (await cache.match(OFFLINE_URL));
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // 2) Assets com hash (imutaveis): CacheFirst
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      })(),
    );
    return;
  }

  // 3) Imagens (inclui storage/proxy cross-origin): StaleWhileRevalidate
  if (req.destination === "image") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque"))
              cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        return cached || (await network) || Response.error();
      })(),
    );
    return;
  }

  // 4) Resto (Supabase API, websockets, etc.): sem respondWith -> rede normal.
});
