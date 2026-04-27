// @ts-nocheck
// public/sw.js
//
// Service Worker Djeli — stratégies de cache pour PWA offline.
//
// Stratégies :
//   1. App Shell (Cache First) : HTML shell, CSS, JS, fonts, icons, manifest.
//      Installé au premier chargement, mis à jour à chaque nouvelle version.
//
//   2. API (Network First, fallback cache) : /api/progress, /api/parent/link.
//      On tente le réseau d'abord, on sert le cache si pas de réseau.
//      Les POST sont empilés dans IndexedDB par sync-queue.ts.
//
//   3. Rive assets (Cache First) : fichiers .riv volumineux, changent rarement.
//
//   4. Offline fallback : si tout échoue, on sert /offline.html.
//
// Pourquoi un fichier .js dans public/ plutôt qu'un module TS compilé ?
// Next.js ne bundle pas les Service Workers. Le SW doit être un fichier
// statique à la racine (scope = "/"). C'est la convention standard.

const CACHE_VERSION = 'djeli-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Shell minimal : pages et assets critiques pour le premier rendu
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ============================================================================
// INSTALL — précache du shell
// ============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ============================================================================
// ACTIVATE — nettoyage des anciens caches
// ============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== STATIC_CACHE &&
              key !== DYNAMIC_CACHE &&
              key !== API_CACHE
          )
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ============================================================================
// FETCH — routage par stratégie
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET (POST, PUT, DELETE gérés par sync-queue)
  if (request.method !== 'GET') return;

  // Ignorer les requêtes cross-origin (Supabase, Gemini, Twilio)
  if (url.origin !== self.location.origin) return;

  // Stratégie 1 : API routes → Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Stratégie 2 : Assets Rive → Cache First
  if (url.pathname.endsWith('.riv')) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Stratégie 3 : Assets statiques (JS/CSS/images/fonts) → Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Stratégie 4 : Pages HTML → Network First avec fallback offline
  event.respondWith(networkFirstWithOfflineFallback(request));
});

// ============================================================================
// SYNC — traitement de la file d'attente offline
// ============================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'djeli-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// ============================================================================
// Stratégies de cache
// ============================================================================

async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Pas de connexion.', code: 'OFFLINE' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback : page /offline
    const offlinePage = await caches.match('/offline');
    if (offlinePage) return offlinePage;

    return new Response('<h1>Pas de connexion</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ============================================================================
// Helpers
// ============================================================================

function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp|avif|gif)$/.test(pathname);
}

/**
 * Traite la file de sync IndexedDB depuis le SW.
 * Version simplifiée — la logique complète est dans sync-queue.ts
 * mais le SW n'a pas accès aux imports TS, donc on duplique le minimum.
 */
async function processSyncQueue() {
  const dbName = 'djeli-offline';
  const storeName = 'syncQueue';

  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open(dbName, 1);
    openReq.onerror = () => reject(openReq.error);
    openReq.onsuccess = () => {
      const db = openReq.result;
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const getAll = store.getAll();

      getAll.onsuccess = async () => {
        const items = getAll.result || [];
        for (const item of items) {
          try {
            const res = await fetch(item.endpoint, {
              method: item.method,
              headers: { 'Content-Type': 'application/json' },
              body: item.body,
            });
            if (res.ok) {
              const delTx = db.transaction(storeName, 'readwrite');
              delTx.objectStore(storeName).delete(item.id);
            }
          } catch {
            // Réseau toujours indisponible — on réessaiera
          }
        }
        resolve();
      };
      getAll.onerror = () => reject(getAll.error);
    };
  });
}
