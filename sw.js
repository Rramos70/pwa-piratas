const CACHE_NAME = 'piratas-softball-v1';
const ASSETS = [
  './',
  './index.html',
  './login.html',       // Añadido para garantizar el acceso al login offline
  './styles.css',
  './app.js',
  './manifest.json',
  './logop.png'         // CORREGIDO: Tu logo local en vez de flaticon
];

// 1. EVENTO DE INSTALACIÓN: Guarda en caché los archivos locales obligatorios
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 [Service Worker] Cacheando archivos estáticos de la App');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting()) // Fuerza al SW a activarse de inmediato
  );
});

// 2. EVENTO DE ACTIVACIÓN: Limpia cachés antiguas automáticamente
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ [Service Worker] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. EVENTO FETCH: Intercepta peticiones de forma inteligente
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // FILTRO CRÍTICO: Si la petición va dirigida a Firebase, NO la metas en caché.
  // Esto permite que las asistencias y partidos sigan funcionando en tiempo real.
  if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('firebasedatabase.app')) {
    return; // Deja que el navegador maneje la petición normalmente por red
  }

  // Estrategia para archivos locales: Primero Caché, si no está, busca en Red
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
