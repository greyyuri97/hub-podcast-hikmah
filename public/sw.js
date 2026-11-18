/* Hub Podcast Hikmah — service worker
 * - App shell: network-first for navigations (fresh deploys), offline fallback to cached index.
 * - Hashed /assets/: cache-first (immutable).
 * - Fonts & YouTube thumbnails: stale-while-revalidate.
 * - Google Apps Script API: never cached here (the app keeps its own localStorage SWR cache).
 */
const VERSION = 'hph-v1';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const swr = async (req) => {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const net = fetch(req)
    .then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; })
    .catch(() => hit);
  return hit || net;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  if (url.origin === location.origin && url.pathname.includes('/assets/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }

  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$|ytimg\.com$/.test(url.hostname)) {
    e.respondWith(swr(req));
  }
});
