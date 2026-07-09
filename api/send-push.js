// Fonction serverless Vercel : envoie une notification push web
// La clé privée VAPID reste ici, côté serveur — jamais exposée au navigateur.
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:contact@youthconnect.app",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  // CORS basique (utile si jamais appelé depuis un autre domaine, ex. preview Vercel)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: "Clés VAPID non configurées sur le serveur (variables d'environnement Vercel)." });
  }

  const { subscriptions, title, body, url } = req.body || {};

  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return res.status(400).json({ error: "Aucun abonnement push fourni." });
  }
  if (!title || !body) {
    return res.status(400).json({ error: "title et body sont requis." });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || "/",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );

  // On renvoie les abonnements devenus invalides (410/404) pour que le client les supprime de Firestore
  const expired = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const statusCode = r.reason && r.reason.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        expired.push(subscriptions[i].endpoint);
      }
    }
  });

  const sentCount = results.filter((r) => r.status === "fulfilled").length;
  return res.status(200).json({ sent: sentCount, total: subscriptions.length, expired });
};