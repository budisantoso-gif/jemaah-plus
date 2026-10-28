// JEMAAH+ service worker v9
// Strategi: network-first dengan batas waktu 3 detik, lalu cadangan dari cache.
// Online  -> selalu ambil versi terbaru (dan simpan ke cache).
// Offline -> pakai versi tersimpan, sehingga aplikasi tetap jalan di dalam masjid / tanpa sinyal.
var CACHE_NAME = 'jemaah-plus-v9';
var FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './img/ajyad.jpg',
  './img/jabalomar.jpg',
  './img/jarwal.jpg',
  './img/jabalkabah.jpg',
  './img/misfalah.jpg',
  './img/mahbas.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; })
        .map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function networkFirst(request){
  return new Promise(function(resolve){
    var selesai = false;
    var timer = setTimeout(function(){
      caches.match(request).then(function(hit){
        if(hit && !selesai){ selesai = true; resolve(hit); }
      });
    }, 3000);
    fetch(request).then(function(resp){
      clearTimeout(timer);
      if(resp && resp.ok){
        var salinan = resp.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(request, salinan); });
      }
      if(!selesai){ selesai = true; resolve(resp); }
    }).catch(function(){
      clearTimeout(timer);
      if(selesai) return;
      caches.match(request).then(function(hit){
        selesai = true;
        resolve(hit || caches.match('./index.html'));
      });
    });
  });
}

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  if(new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});
