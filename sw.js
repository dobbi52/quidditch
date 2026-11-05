// 창공배 퀴디치 오프라인 실행. 게임 파일을 고치면 아래 숫자를 올리지 않아도 index.html은 먼저 인터넷에서 받아 옵니다.
var CACHE = 'quidditch-v1';
var SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
var CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(SHELL).then(function () {
      return Promise.all(CDN.map(function (u) { return fetch(u, { mode: 'cors' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function isStatic(url) {
  return url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || (url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0);
}
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    // 게임 본문과 설정은 인터넷을 먼저 보고, 안 되면 저장본을 씁니다.
    var fresh = e.request.mode === 'navigate' || /(index\.html|firebase-config\.js)$/.test(url.pathname) || url.pathname.slice(-1) === '/';
    if (fresh) {
      e.respondWith(fetch(e.request).then(function (r) {
        if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request.mode === 'navigate' ? './index.html' : e.request, copy); }); }
        return r;
      }).catch(function () { return caches.match(e.request.mode === 'navigate' ? './index.html' : e.request); }));
      return;
    }
    e.respondWith(caches.match(e.request).then(function (hit) { return hit || fetch(e.request); }));
    return;
  }
  if (isStatic(url)) {
    e.respondWith(caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (r) {
        if (r.ok || r.type === 'opaque') { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
        return r;
      });
    }));
  }
});
