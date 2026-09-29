/** A3 Wallet: cache only explicitly approved public static files.
 * Pages, RSC payloads, APIs, queries and external identity/provider requests
 * always use the network; account data must never become an offline page.
 */
const STATIC_CACHE = "a3-ui-static-v3";
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/brand/a3-wallet-horizontal-light.svg",
  "/brand/a3-login-logo-light-transparent.png",
  "/brand/a3-portal-symbol-gradient-1024.png",
  "/tokens/eth.svg",
  "/tokens/usdt.svg",
  "/tokens/usdc.svg",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== STATIC_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.search ||
    request.mode === "navigate" ||
    !PRECACHE_ASSETS.includes(url.pathname)
  )
    return;
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            event.waitUntil(
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, copy)),
            );
          }
          return response;
        }),
    ),
  );
});
