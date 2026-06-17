/**
 * FWC 2026 Service Worker
 *
 * Strategy: stale-while-revalidate for the app shell.
 * - CACHE_VERSION is injected at build time from the bundle hash so the
 *   browser always sees a new SW file on each deploy.
 * - skipWaiting() + clients.claim() ensures the new version activates
 *   immediately, which triggers a reload via the controllerchange listener
 *   in index.html.
 * - /api/scores is never cached here — the Netlify function already applies
 *   Cache-Control: s-maxage=30 and the frontend always cache-busts it..
 */

const CACHE_VERSION = '__CACHE_VERSION__'; // replaced by build.mjs
const CACHE = `fwc2026-${CACHE_VERSION}`;

const PRECACHE = [
  '/',
  '/bundle.js',
  '/src/tokens.css',
  '/public/favicon.svg',
  '/public/world-cup.svg',
];

// ── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    // addAll() aborts the entire install if any single request fails (e.g.
    // /bundle.js doesn't exist in dev). Cache each asset individually so one
    // missing file doesn't prevent the SW from installing.
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  // Activate immediately — don't wait for existing clients to close
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('fwc2026-') && k !== CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept live-data endpoints, non-GET requests, or cross-origin requests
  if (
    request.method !== 'GET'
    || url.origin !== self.location.origin   // cross-origin guard (prevents cache pollution)
    || url.pathname.startsWith('/api/')
  ) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Always fetch in the background to keep the cache warm
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {                      // res.ok is 200-299; status<400 is redundant
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => {
          // Network failed — fall back to cache (offline support)
          return cached ?? Response.error();
        });

      // Return cached immediately if available; update in background
      return cached ?? network;
    })
  );
});
