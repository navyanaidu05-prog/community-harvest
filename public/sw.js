const CACHE_NAME = "community-harvest-v1";
const PRECACHE = [
  "/",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallback) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (fallback) {
      const shell = await cache.match(fallback);
      if (shell) return shell;
    }
    return new Response("Offline. Reconnect to continue.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  if (!/\.(?:css|js|mjs|png|jpe?g|svg|webp|ico|webmanifest)$/i.test(url.pathname)) return;

  if (/\.(?:css|js|mjs)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
