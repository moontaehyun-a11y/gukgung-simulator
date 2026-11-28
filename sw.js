// 국궁 표잡기 v3 오프라인 작동용 서비스 워커
// 새 버전을 올릴 때 VERSION 숫자를 바꾸면 쓰는 사람들 기기에서도 새 파일로 바뀝니다.
const VERSION = 'gukgung3-v75';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(CORE);
    await Promise.all(CDN.map(u => c.add(new Request(u, { mode: 'cors' })).catch(() => {})));   // 3D 라이브러리: 실패해도 설치는 계속
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).hostname.endsWith('open-meteo.com')) return;   // 날씨는 늘 새로 받는다
  if (req.mode === 'navigate') {   // 페이지: 인터넷이 되면 최신, 안 되면 저장본
    e.respondWith((async () => {
      try { const r = await fetch(req); const c = await caches.open(VERSION); c.put('./index.html', r.clone()); return r; }
      catch (err) { return (await caches.match('./index.html')) || (await caches.match('./')); }
    })());
    return;
  }
  e.respondWith((async () => {   // 나머지: 저장본 먼저, 없으면 받아서 저장
    const hit = await caches.match(req); if (hit) return hit;
    try { const r = await fetch(req); if (r.ok || r.type === 'opaque') { const c = await caches.open(VERSION); c.put(req, r.clone()); } return r; }
    catch (err) { return hit || Response.error(); }
  })());
});
