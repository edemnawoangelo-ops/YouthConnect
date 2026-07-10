const CACHE_NAME = 'youthconnect-cache-v5';

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

// Installation : on met en cache les fichiers essentiels.
// { cache: 'reload' } force le téléchargement réel depuis le réseau,
// en ignorant le cache HTTP du navigateur, pour ne jamais stocker une version périmée.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                FICHIERS_A_METTRE_EN_CACHE.map((url) =>
                    fetch(url, { cache: 'reload' })
                        .then((reponse) => cache.put(url, reponse))
                        .catch((e) => console.error('Échec mise en cache de', url, e))
                )
            );
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

// Récupération : on va d'abord chercher la dernière version en ligne (réseau),
// et on ne se rabat sur le cache que si l'appareil est hors-ligne.
// Ça garantit que chaque appareil reçoit toujours la version la plus à jour de l'app.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((reponseReseau) => {
                const copie = reponseReseau.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
                return reponseReseau;
            })
            .catch(() => caches.match(event.request))
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