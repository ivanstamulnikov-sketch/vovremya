/* Офлайн-кэш веб-версии. Меняйте VERSION при каждом выпуске. */
const VERSION = 'moi-tsr-0.19.1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(['./', './manifest.webmanifest', './icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // карта: плитки не кэшируем (чужой сервер, большой объём)
  if (url.origin !== self.location.origin) return;
  // страница: сначала сеть (свежая версия), при отсутствии сети — кэш
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put('./', copy)); return r; }).catch(() => caches.match('./')));
    return;
  }
  // остальное (файлы с хэшем в имени, словарь распознавания): кэш, иначе сеть и в кэш
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return r; })),
  );
});
