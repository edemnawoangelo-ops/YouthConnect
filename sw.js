const CACHE_NAME = 'mon-site-cache-v1';

// Liste des fichiers à mettre en cache pour un fonctionnement hors-ligne basique
const FICHIERS_A_METTRE_EN_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/style.css',
    '/script.js',
    '/icon-192.png',
    '/icon-512.png'
];

// Installation : on met en cache les fichiers essentiels
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FICHIERS_A_METTRE_EN_CACHE);
        })
    );
    self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((noms) => {
            return Promise.all(
                noms
                    .filter((nom) => nom !== CACHE_NAME)
                    .map((nom) => caches.delete(nom))
            );
        })
    );
    self.clients.claim();
});

// Récupération : on sert depuis le cache si dispo, sinon on va sur le réseau
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((reponseEnCache) => {
            return reponseEnCache || fetch(event.request);
        })
    );
});