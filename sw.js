const CACHE = 'grinch-v2';   // меняй, только если поменялся список файлов ниже

const PRECACHE = [
  './', 'index.html', 'room.html',
  'style.css', 'style1.css', 'app.js', 'room.js',
  'answers.txt', 'traitor.txt', 'manifest.json',
  'Illustration.webp', 'lock.webp', 'lamp.webp',
  'door-closed.webp', 'door-open.webp',
  'chest.webp', 'envelope.webp', 'letter.webp', 'seal.webp',
  'ball.webp', 'ball(192192).webp', 'фон.webp',
  'door-creak.mp3', 'fonts/DOSPilgi.ttf', 'letter.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.all(PRECACHE.map(url =>
        cache.add(new Request(url, { cache: 'reload' }))
             .catch(err => console.warn('SW: не закэшировано', url, err))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const fresh = req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || /\.(html|js|css|txt|json)$/i.test(url.pathname);

  event.respondWith(fresh ? networkFirst(req) : cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    if (req.mode === 'navigate') return cache.match('index.html');
    throw e;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) {
    return req.headers.has('range') ? rangeResponse(req, cached) : cached;
  }
  const res = await fetch(req);
  if (res.ok && res.status === 200) cache.put(req, res.clone());
  return res;
}

async function rangeResponse(req, res) {
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range'));
  const start = m && m[1] ? parseInt(m[1], 10) : 0;
  const end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1)
    }
  });
}