// Service worker JEMAAH+
// Strategi: cache-first. Setelah kunjungan pertama, semua file inti
// disimpan di HP dan dipakai langsung tanpa perlu internet lagi.
// Ketika ada versi baru, naikkan CACHE_NAME supaya cache lama dibuang
// dan file baru diunduh ulang.

var CACHE_NAME = 'jemaah-plus-v2';
var FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached){ return cached; }
      return fetch(event.request).then(function(response){
        // Simpan salinan baru ke cache untuk dipakai offline nanti
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(function(){
        // Kalau offline dan file belum pernah di-cache, tampilkan halaman utama sebagai fallback
        return caches.match('./index.html');
      });
    })
  );
});
