/* Txova — service worker (funciona offline depois do primeiro carregamento) */
const VERSION = 'txova-ad90031f89';
const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "favicon.svg",
  "assets/app.js",
  "assets/data.js",
  "assets/fonts/plus-jakarta-sans-latin-400-normal.woff2",
  "assets/fonts/plus-jakarta-sans-latin-600-normal.woff2",
  "assets/fonts/plus-jakarta-sans-latin-700-normal.woff2",
  "assets/fonts/plus-jakarta-sans-latin-800-normal.woff2",
  "assets/icons.js",
  "assets/styles.css",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-full.svg",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "icons/icon-maskable.svg",
  "icons/logo.svg"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('txova-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: devolve a app (index.html) da cache e atualiza em segundo plano.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match('index.html');
        const network = fetch(req).then((res) => { if (res.ok) cache.put('index.html', res.clone()); return res; }).catch(() => null);
        return cached || (await network) || new Response('Sem ligação', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      })
    );
    return;
  }

  // Restantes recursos: cache primeiro, rede como alternativa (e guarda o resultado).
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      } catch (e) {
        return new Response('', { status: 504 });
      }
    })
  );
});
