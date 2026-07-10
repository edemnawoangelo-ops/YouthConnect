const CACHE_NAME = 'youthconnect-cache-v4';

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

// Réception d'une notification push envoyée par notre serveur (api/send-push.js)
self.addEventListener('push', (event) => {
    let data = { title: 'YouthConnect', body: 'Nouvelle activité sur YouthConnect', url: '/' };
    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch (e) {
        console.error('Erreur lecture payload push:', e);
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icon-192.png',
            badge: data.badge || '/icon-192.png',
            data: { url: data.url || '/' },
        })
    );
});

// Clic sur une notification : on ouvre (ou on met au premier plan) l'onglet YouthConnect
// et on l'amène sur la bonne page de l'app (notifications, ou directement la question).
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const cible = event.notification.data?.url || '/?openNotifications=1';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
            for (const client of clientsList) {
                if ('focus' in client) {
                    // L'onglet est déjà ouvert : on le met au premier plan et on lui indique
                    // (via postMessage) où naviguer, sans recharger toute la page.
                    client.postMessage({ type: 'NAVIGATE', url: cible });
                    return client.focus();
                }
            }
            if (self.clients.openWindow) return self.clients.openWindow(cible);
        })
    );
});