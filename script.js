/* ═══════════════════════════════════════════════════════════════
   YouthConnect – script.js
   Firebase Firestore pour posts/commentaires (synchronisation multi-appareils)
   LocalStorage uniquement pour la session utilisateur
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   FIREBASE CONFIG — Remplace par tes propres valeurs Firebase
   https://console.firebase.google.com → Ton projet → Paramètres → Config web
───────────────────────────────────────────────────────────────*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, orderBy,
  onSnapshot, doc, deleteDoc, updateDoc, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg7yT-LOy8kwzOBGEVkl1ipxvcWFUWIGQ",
  authDomain: "youth-connect-2.firebaseapp.com",
  projectId: "youth-connect-2",
  storageBucket: "youth-connect-2.firebasestorage.app",
  messagingSenderId: "26735360538",
  appId: "1:26735360538:web:9197b8cad3c821b2476fa3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

/* ─────────────────────────────────────────────────────────────
   MODÉRATION : liste des emails administrateurs
   Ajoute ici l'email (celui utilisé à l'inscription sur YouthConnect)
   de chaque personne qui doit avoir accès au panneau de modération.
───────────────────────────────────────────────────────────────*/
const ADMIN_EMAILS = ["edemnawokoffiangelo@gmail.com"];

function isAdmin(user) {
  return !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());
}

/* ─────────────────────────────────────────────────────────────
   1. DONNÉES : CATÉGORIES
───────────────────────────────────────────────────────────────*/

const CATEGORIES = [
  { name: "Études", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576446/Etude_tkfk2y.jpg" },
  { name: "Informatique", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576445/Informatique_yrswg4.jpg" },
  { name: "Développement Web", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576445/D%C3%A9veloppement_Web_zzsmqv.jpg" },
  { name: "Entrepreneuriat", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Entrepreneuriat_fu5qm9.jpg" },
  { name: "Emploi", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Emploi_gyjxoh.jpg" },
  { name: "Marketing Digital", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Marketing_Digital_typd7m.jpg" },
  { name: "Intelligence Artificielle", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Intelligence_Artificielle_jlghjj.jpg" },
  { name: "Motivation", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576446/Motivation_e0xrsc.jpg" },
  { name: "Bourses d'études", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Bourses_d_%C3%A9tudes_s064hl.jpg" },
  { name: "Vie Étudiante", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Vie_%C3%89tudiante_h6of2i.jpg" },
];

/* Publications de démonstration (chargées une seule fois dans Firestore si vide) */
const DEMO_POSTS = [
  { title: "Comment débuter le développement web en 2026 ?", body: "Bonjour à tous ! Je suis lycéen et je veux apprendre le développement web mais je ne sais pas par où commencer. Faut-il commencer par HTML/CSS, puis JavaScript ? Ou existe-t-il une meilleure approche ? Merci d'avance pour vos conseils.", category: "Développement Web", author: "Kofi Mensah", authorId: "demo_user" },
  { title: "Quelles sont les meilleures bourses pour étudier en Europe ?", body: "Je suis en terminale et je cherche des bourses pour poursuivre mes études en ingénierie en Europe. Est-ce que quelqu'un a déjà postulé à des programmes comme Erasmus+ ou les bourses Eiffel ? Comment avez-vous préparé votre dossier ?", category: "Bourses d'études", author: "Amina Traoré", authorId: "demo_user" },
  { title: "L'IA va-t-elle remplacer les développeurs web ?", body: "Avec l'essor de ChatGPT, Copilot et d'autres outils IA, beaucoup disent que les développeurs ne seront plus nécessaires dans 5 ans. Qu'en pensez-vous ? Doit-on quand même apprendre à coder ou se concentrer sur d'autres compétences ?", category: "Intelligence Artificielle", author: "Ibrahima Diallo", authorId: "demo_user" },
  { title: "Comment rester motivé quand on apprend seul ?", body: "J'apprends la programmation de façon autodidacte depuis 6 mois, mais il m'arrive souvent de procrastiner ou de douter de moi-même. Quels sont vos conseils pour maintenir la motivation et avancer malgré les obstacles ?", category: "Motivation", author: "Fatou Sow", authorId: "demo_user" },
  { title: "Trouver un stage en informatique sans expérience : conseils ?", body: "Je suis en deuxième année de BTS Informatique et je dois trouver un stage de 3 mois. Le problème, c'est que la plupart des offres demandent de l'expérience. Comment avez-vous décroché votre premier stage ? Faut-il créer des projets personnels ?", category: "Emploi", author: "Kwame Asante", authorId: "demo_user" },
];

/* ─────────────────────────────────────────────────────────────
   2. ÉTAT GLOBAL
───────────────────────────────────────────────────────────────*/

let state = {
  currentUser: null,
  currentPage: "home",
  currentPostId: null,
  categoryFilter: "",
  posts: [],   // cache local mis à jour par onSnapshot
  comments: [],   // cache local mis à jour par onSnapshot
  notifications: [],   // notifications de l'utilisateur connecté
  reports: [],   // signalements (admin uniquement)
};

let unsubPosts = null;
let unsubComments = null;
let unsubNotifications = null;
let unsubReports = null;

/* ─────────────────────────────────────────────────────────────
   3. INITIALISATION
───────────────────────────────────────────────────────────────*/

document.addEventListener("DOMContentLoaded", async () => {
  loadSession();
  renderNavCategories();
  renderHomeCategories();
  showPage("home");
  setupNavScroll();
  setupBurgerMenu();
  setupModalClose();
  setupNotifDropdownClose();

  // Écoute temps réel des posts et commentaires
  listenPosts();
  listenComments();

  // Si une session est active, démarrer les écoutes personnelles
  if (state.currentUser) {
    listenNotifications();
    if (isAdmin(state.currentUser)) listenReports();
  }
  updateAdminUI();
});

/* ─────────────────────────────────────────────────────────────
   4. FIREBASE : ÉCOUTE EN TEMPS RÉEL
───────────────────────────────────────────────────────────────*/

function listenPosts() {
  const q = query(collection(db, "posts"), orderBy("date", "desc"));
  unsubPosts = onSnapshot(q, (snapshot) => {
    state.posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderHomePosts();
    renderStats();
    renderHomeCategories();
    if (state.currentPage === "forum") renderForumPosts();
    if (state.currentPage === "categories") renderFullCategories();
    if (state.currentPage === "dashboard") renderDashboard();
  }, (err) => console.error("Erreur écoute posts:", err));
}

function listenComments() {
  const q = query(collection(db, "comments"), orderBy("date", "asc"));
  unsubComments = onSnapshot(q, (snapshot) => {
    state.comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (state.currentPage === "post-detail") openPostDetail(state.currentPostId);
    if (state.currentPage === "dashboard") renderDashboard();
  }, (err) => console.error("Erreur écoute commentaires:", err));
}

function listenNotifications() {
  if (!state.currentUser) return;
  if (unsubNotifications) unsubNotifications();

  const q = query(collection(db, "notifications"), where("userId", "==", state.currentUser.id));
  unsubNotifications = onSnapshot(q, (snapshot) => {
    state.notifications = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => toMillis(b.date) - toMillis(a.date));
    renderNotifBell();
  }, (err) => console.error("Erreur écoute notifications:", err));
}

function listenReports() {
  if (unsubReports) unsubReports();

  const q = query(collection(db, "reports"), orderBy("date", "desc"));
  unsubReports = onSnapshot(q, (snapshot) => {
    state.reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    if (state.currentPage === "moderation") renderModeration();
    renderModBadge();
  }, (err) => console.error("Erreur écoute signalements:", err));
}

function toMillis(dateVal) {
  if (!dateVal) return 0;
  if (typeof dateVal.toMillis === "function") return dateVal.toMillis();
  const d = new Date(dateVal);
  return isNaN(d) ? 0 : d.getTime();
}

/* ─────────────────────────────────────────────────────────────
   5. FIREBASE : ÉCRITURE
───────────────────────────────────────────────────────────────*/

async function addPostToFirestore(postData) {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      date: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Erreur ajout post:", e);
    showNotification("Erreur lors de la publication. Réessaie.", "error");
    return null;
  }
}

async function addCommentToFirestore(commentData) {
  try {
    await addDoc(collection(db, "comments"), {
      ...commentData,
      date: serverTimestamp(),
    });
  } catch (e) {
    console.error("Erreur ajout commentaire:", e);
    showNotification("Erreur lors de la publication. Réessaie.", "error");
  }
}

/* Upload d'une image (réponse) vers Firebase Storage → renvoie l'URL publique */
async function uploadCommentImage(file) {
  try {
    const path = `comment-images/${uid()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.error("Erreur upload image:", e);
    showNotification("L'image n'a pas pu être envoyée (réessaie sans image).", "error");
    return null;
  }
}

/* Crée une notification en base pour un utilisateur donné */
async function createNotification(userId, type, postId, postTitle, fromName) {
  if (!userId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      userId, type, postId, postTitle, fromName,
      read: false,
      date: serverTimestamp(),
    });
  } catch (e) {
    console.error("Erreur création notification:", e);
  }
}

/* Enregistre un signalement (post ou commentaire) pour modération */
async function addReportToFirestore(reportData) {
  try {
    await addDoc(collection(db, "reports"), {
      ...reportData,
      status: "pending",
      date: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error("Erreur ajout signalement:", e);
    showNotification("Erreur lors de l'envoi du signalement.", "error");
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────
   6. SESSION UTILISATEUR (LocalStorage — pas besoin de synchro)
───────────────────────────────────────────────────────────────*/

function getUsers() { return JSON.parse(localStorage.getItem("yc_users") || "[]"); }
function saveUsers(d) { localStorage.setItem("yc_users", JSON.stringify(d)); }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadSession() {
  const raw = localStorage.getItem("yc_session");
  if (raw) {
    try {
      state.currentUser = JSON.parse(raw);
      updateNavForUser();
    } catch {
      localStorage.removeItem("yc_session");
    }
  }
}

function updateNavForUser() {
  const guestEl = document.getElementById("guest-actions");
  const userEl = document.getElementById("user-actions");
  const welcomeBtn = document.getElementById("welcome-btn");
  const guestMobile = document.getElementById("guest-actions-mobile");
  const userMobile = document.getElementById("user-actions-mobile");
  const welcomeMobile = document.getElementById("welcome-btn-mobile");

  if (state.currentUser) {
    guestEl.classList.add("hidden");
    userEl.classList.remove("hidden");
    welcomeBtn.textContent = `👤 ${state.currentUser.name.split(" ")[0]}`;
    if (guestMobile) guestMobile.classList.add("hidden");
    if (userMobile) userMobile.classList.remove("hidden");
    if (welcomeMobile) welcomeMobile.textContent = `👤 ${state.currentUser.name.split(" ")[0]}`;
  } else {
    guestEl.classList.remove("hidden");
    userEl.classList.add("hidden");
    if (guestMobile) guestMobile.classList.remove("hidden");
    if (userMobile) userMobile.classList.add("hidden");
  }
}

/* ─────────────────────────────────────────────────────────────
   7. NAVIGATION ENTRE PAGES
───────────────────────────────────────────────────────────────*/

function showPage(pageId) {
  closeMobileMenu();

  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
    p.classList.add("hidden");
  });

  const target = document.getElementById("page-" + pageId);
  if (!target) return;
  target.classList.remove("hidden");
  target.classList.add("active");

  state.currentPage = pageId;

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "forum") renderForumPosts();
  if (pageId === "categories") renderFullCategories();
  if (pageId === "dashboard") renderDashboard();
  if (pageId === "home") { renderHomePosts(); renderStats(); }
  if (pageId === "moderation") renderModeration();
}

function filterAndGo(category) {
  state.categoryFilter = category;
  showPage("forum");
  const sel = document.getElementById("category-filter");
  if (sel) sel.value = category;
  renderForumPosts();
}

/* ─────────────────────────────────────────────────────────────
   8. NAVBAR : SCROLL & BURGER
───────────────────────────────────────────────────────────────*/

function setupNavScroll() {
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 10);
  });
}

function setupBurgerMenu() {
  const btn = document.getElementById("burger-btn");
  const links = document.getElementById("nav-links");
  const actions = document.getElementById("nav-actions");

  btn.addEventListener("click", () => {
    const open = btn.classList.toggle("open");
    links.classList.toggle("open", open);
    if (actions) actions.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  });
}

function closeMobileMenu() {
  const btn = document.getElementById("burger-btn");
  const links = document.getElementById("nav-links");
  const actions = document.getElementById("nav-actions");

  if (btn) btn.classList.remove("open");
  if (links) links.classList.remove("open");
  if (actions) actions.classList.remove("open");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

/* ─────────────────────────────────────────────────────────────
   9. MODALS
───────────────────────────────────────────────────────────────*/

function setupModalClose() {
  const overlay = document.getElementById("modal-overlay");
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function openModal(type) {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");

  overlay.classList.remove("hidden");

  if (type === "login") box.innerHTML = buildLoginForm();
  if (type === "register") box.innerHTML = buildRegisterForm();
  if (type === "new-post") box.innerHTML = buildNewPostForm();

  setTimeout(() => {
    const first = box.querySelector("input");
    if (first) first.focus();
  }, 50);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
  document.getElementById("modal-box").innerHTML = "";
}

function openNewPostModal() {
  if (!state.currentUser) {
    showNotification("Connecte-toi pour poster une question.", "info");
    openModal("login");
    return;
  }
  openModal("new-post");
}

/* ─────────────────────────────────────────────────────────────
   10. TEMPLATES HTML DES MODALS
───────────────────────────────────────────────────────────────*/

function buildLoginForm() {
  return `
    <div class="modal-header">
      <h2 class="modal-title">Connexion</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
    </div>
    <form onsubmit="handleLogin(event)" novalidate>
      <div class="form-group">
        <label for="login-email">Adresse email</label>
        <input type="email" id="login-email" class="form-input" placeholder="toi@exemple.com" required autocomplete="email" />
      </div>
      <div class="form-group">
        <label for="login-password">Mot de passe</label>
        <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password" />
      </div>
      <p class="form-error" id="login-error"></p>
      <button type="submit" class="btn btn-primary btn-full">Se connecter</button>
    </form>
    <div class="modal-footer">
      Pas encore de compte ?
      <button class="link-btn" onclick="openModal('register')">S'inscrire gratuitement</button>
    </div>`;
}

function buildRegisterForm() {
  return `
    <div class="modal-header">
      <h2 class="modal-title">Créer un compte</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
    </div>
    <form onsubmit="handleRegister(event)" novalidate>
      <div class="form-group">
        <label for="reg-name">Nom complet</label>
        <input type="text" id="reg-name" class="form-input" placeholder="Prénom Nom" required autocomplete="name" />
        <p class="form-error" id="err-name"></p>
      </div>
      <div class="form-group">
        <label for="reg-email">Adresse email</label>
        <input type="email" id="reg-email" class="form-input" placeholder="toi@exemple.com" required autocomplete="email" />
        <p class="form-error" id="err-email"></p>
      </div>
      <div class="form-group">
        <label for="reg-password">Mot de passe</label>
        <input type="password" id="reg-password" class="form-input" placeholder="8 caractères minimum" required autocomplete="new-password" />
        <p class="form-error" id="err-password"></p>
      </div>
      <div class="form-group">
        <label for="reg-confirm">Confirmer le mot de passe</label>
        <input type="password" id="reg-confirm" class="form-input" placeholder="Répète ton mot de passe" required autocomplete="new-password" />
        <p class="form-error" id="err-confirm"></p>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Créer mon compte</button>
    </form>
    <div class="modal-footer">
      Déjà un compte ?
      <button class="link-btn" onclick="openModal('login')">Se connecter</button>
    </div>`;
}

function buildNewPostForm() {
  const options = CATEGORIES.map(c =>
    `<option value="${c.name}">${c.name}</option>`
  ).join("");

  return `
    <div class="modal-header">
      <h2 class="modal-title">Nouvelle question</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
    </div>
    <form onsubmit="handleNewPost(event)" novalidate>
      <div class="form-group">
        <label for="post-title">Titre de la question</label>
        <input type="text" id="post-title" class="form-input" placeholder="Formule ta question clairement…" required maxlength="120" />
        <p class="form-error" id="err-post-title"></p>
      </div>
      <div class="form-group">
        <label for="post-category">Catégorie</label>
        <select id="post-category" class="form-input select-filter" required>
          <option value="">-- Choisir une catégorie --</option>
          ${options}
        </select>
        <p class="form-error" id="err-post-cat"></p>
      </div>
      <div class="form-group">
        <label for="post-body">Description détaillée</label>
        <textarea id="post-body" class="form-input form-textarea" rows="5" placeholder="Explique ta situation, ce que tu as déjà essayé, ce que tu cherches…" required></textarea>
        <p class="form-error" id="err-post-body"></p>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Publier la question</button>
    </form>`;
}

/* ─────────────────────────────────────────────────────────────
   11. AUTHENTIFICATION (LocalStorage)
───────────────────────────────────────────────────────────────*/

function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;

  clearErrors(["err-name", "err-email", "err-password", "err-confirm"]);

  let valid = true;

  if (name.length < 3) {
    showError("err-name", "Le nom doit contenir au moins 3 caractères.");
    valid = false;
  }
  if (!isValidEmail(email)) {
    showError("err-email", "Adresse email invalide.");
    valid = false;
  }
  if (password.length < 8) {
    showError("err-password", "Le mot de passe doit faire au moins 8 caractères.");
    valid = false;
  }
  if (password !== confirm) {
    showError("err-confirm", "Les mots de passe ne correspondent pas.");
    valid = false;
  }

  if (!valid) return;

  const users = getUsers();

  if (users.find(u => u.email === email)) {
    showError("err-email", "Cette adresse email est déjà utilisée.");
    return;
  }

  const newUser = {
    id: uid(),
    name,
    email,
    password,
    joinedAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  loginUser(newUser);
  closeModal();
  showNotification(`Bienvenue ${newUser.name.split(" ")[0]} ! 🎉 Ton compte a été créé.`, "success");
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");

  errEl.style.display = "none";

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    errEl.textContent = "Email ou mot de passe incorrect.";
    errEl.style.display = "block";
    return;
  }

  loginUser(user);
  closeModal();
  showNotification(`Content de te revoir, ${user.name.split(" ")[0]} ! 👋`, "success");
}

function loginUser(user) {
  state.currentUser = user;
  localStorage.setItem("yc_session", JSON.stringify(user));
  updateNavForUser();
  listenNotifications();
  updateAdminUI();
  if (isAdmin(user)) listenReports();
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem("yc_session");
  updateNavForUser();
  showPage("home");
  showNotification("Tu as été déconnecté(e).", "info");

  if (unsubNotifications) { unsubNotifications(); unsubNotifications = null; }
  if (unsubReports) { unsubReports(); unsubReports = null; }
  state.notifications = [];
  state.reports = [];
  renderNotifBell();
  updateAdminUI();
  closeNotifDropdown();
}

/* ─────────────────────────────────────────────────────────────
   12. FORUM : CRÉATION & AFFICHAGE DES PUBLICATIONS
───────────────────────────────────────────────────────────────*/

async function handleNewPost(event) {
  event.preventDefault();

  const title = document.getElementById("post-title").value.trim();
  const category = document.getElementById("post-category").value;
  const body = document.getElementById("post-body").value.trim();

  clearErrors(["err-post-title", "err-post-cat", "err-post-body"]);
  let valid = true;

  if (title.length < 10) {
    showError("err-post-title", "Le titre doit faire au moins 10 caractères.");
    valid = false;
  }
  if (!category) {
    showError("err-post-cat", "Choisis une catégorie.");
    valid = false;
  }
  if (body.length < 30) {
    showError("err-post-body", "La description doit faire au moins 30 caractères.");
    valid = false;
  }
  if (!valid) return;

  const postData = {
    title,
    body,
    category,
    author: state.currentUser.name,
    authorId: state.currentUser.id,
  };

  const btn = event.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Publication…";

  const id = await addPostToFirestore(postData);

  if (id) {
    closeModal();
    showNotification("Ta question a été publiée ! 🙌", "success");
  } else {
    btn.disabled = false;
    btn.textContent = "Publier la question";
  }
}

function renderForumPosts() {
  const container = document.getElementById("forum-posts-list");
  const emptyEl = document.getElementById("forum-empty");

  if (!container) return;

  // Peupler le filtre catégorie
  const sel = document.getElementById("category-filter");
  if (sel && sel.options.length <= 1) {
    CATEGORIES.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  }
  if (sel && state.categoryFilter) sel.value = state.categoryFilter;

  let posts = [...state.posts];

  const query = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  if (query) {
    posts = posts.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.body.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query)
    );
  }

  const cat = document.getElementById("category-filter")?.value || state.categoryFilter;
  if (cat) posts = posts.filter(p => p.category === cat);

  if (posts.length === 0) {
    container.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }

  container.classList.remove("hidden");
  emptyEl.classList.add("hidden");
  container.innerHTML = posts.map(p => buildPostCard(p)).join("");
}

function renderHomePosts() {
  const container = document.getElementById("home-posts-list");
  if (!container) return;

  const posts = state.posts.slice(0, 4);
  container.innerHTML = posts.map(p => buildPostCard(p)).join("");
}

function buildPostCard(post) {
  const comments = state.comments.filter(c => c.postId === post.id);
  const excerpt = post.body.length > 130 ? post.body.slice(0, 130) + "…" : post.body;
  const cat = CATEGORIES.find(c => c.name === post.category);
  const imgTag = cat
    ? `<img src="${cat.image}" alt="${escapeHtml(cat.name)}" width="18" height="18" style="vertical-align:middle;margin-right:4px;border-radius:50px;" />`
    : "📋";

  return `
    <article class="post-card" onclick="openPostDetail('${post.id}')" tabindex="0" role="button"
             aria-label="Lire la question : ${escapeHtml(post.title)}"
             onkeydown="if(event.key==='Enter') openPostDetail('${post.id}')">
      <div class="post-card-header">
        <span class="post-badge">${imgTag} ${escapeHtml(post.category)}</span>
      </div>
      <div class="post-title">${escapeHtml(post.title)}</div>
      <div class="post-excerpt">${escapeHtml(excerpt)}</div>
      <div class="post-footer">
        <span class="post-author">👤 ${escapeHtml(post.author)}</span>
        <span>📅 ${formatDate(post.date)}</span>
        <span class="post-comments">💬 ${comments.length} réponse${comments.length !== 1 ? "s" : ""}</span>
      </div>
    </article>`;
}

/* ─────────────────────────────────────────────────────────────
   13. RECHERCHE ET FILTRES
───────────────────────────────────────────────────────────────*/

function searchPosts() { renderForumPosts(); }
function filterPosts() {
  state.categoryFilter = document.getElementById("category-filter")?.value || "";
  renderForumPosts();
}

/* ─────────────────────────────────────────────────────────────
   14. DÉTAIL D'UNE QUESTION + COMMENTAIRES
───────────────────────────────────────────────────────────────*/

function openPostDetail(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (!post) return;

  state.currentPostId = postId;

  const container = document.getElementById("post-detail-content");
  const comments = state.comments.filter(c => c.postId === postId);
  const cat = CATEGORIES.find(c => c.name === post.category);
  const imgTag = cat
    ? `<img src="${cat.image}" alt="${escapeHtml(cat.name)}" width="18" height="18" style="vertical-align:middle;border-radius:50px;">`
    : "📋";

  const commentHTML = comments.length > 0
    ? comments.map(c => buildCommentCard(c)).join("")
    : `<p class="text-muted" style="padding:16px 0">Aucune réponse pour l'instant. Sois le premier à répondre !</p>`;

  const addCommentHTML = state.currentUser
    ? `
      <div class="add-comment-box">
        <h3>Ajouter une réponse</h3>
        <form onsubmit="handleAddComment(event)" novalidate>
          <div class="form-group">
            <textarea id="comment-body" class="form-input form-textarea" rows="4"
              placeholder="Partage ton expérience ou tes conseils…" required></textarea>
            <p class="form-error" id="err-comment"></p>
          </div>
          <div class="form-group">
            <label for="comment-image" class="image-upload-label">
              🖼️ Ajouter une image (facultatif)
              <input type="file" id="comment-image" accept="image/*" onchange="previewCommentImage(event)" hidden />
            </label>
            <div id="comment-image-preview-wrap" class="comment-image-preview-wrap hidden">
              <img id="comment-image-preview" class="comment-image-preview" alt="Aperçu de l'image" />
              <button type="button" class="image-remove-btn" onclick="removeCommentImagePreview()">✕ Retirer l'image</button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Publier la réponse</button>
        </form>
      </div>`
    : `<div class="add-comment-box" style="text-align:center">
        <p style="margin-bottom:16px;color:var(--gray-600)">Connecte-toi pour répondre à cette question.</p>
        <button class="btn btn-primary" onclick="openModal('login')">Se connecter</button>
       </div>`;

  const adminDeleteBtn = isAdmin(state.currentUser)
    ? `<button class="btn btn-outline-danger btn-sm" onclick="deletePost('${post.id}')">🗑️ Supprimer (admin)</button>`
    : "";

  const reportBtn = state.currentUser
    ? `<button class="report-link" onclick="openReportModal('post','${post.id}','${post.id}')">🚩 Signaler cette question</button>`
    : "";

  container.innerHTML = `
    <button class="post-detail-back" onclick="showPage('forum')">← Retour au forum</button>
    <div class="post-detail-card">
      <span class="post-detail-badge">${imgTag} ${escapeHtml(post.category)}</span>
      <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
      <p class="post-detail-body">${escapeHtml(post.body)}</p>
      <div class="post-detail-meta">
        <span>👤 ${escapeHtml(post.author)}</span>
        <span>📅 ${formatDate(post.date)}</span>
        <span>💬 ${comments.length} réponse${comments.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="post-detail-actions">
        ${reportBtn}
        ${adminDeleteBtn}
      </div>
    </div>

    <h2 class="comments-section-title">Réponses (${comments.length})</h2>
    <div id="comments-list">${commentHTML}</div>
    <div style="margin-top:24px">${addCommentHTML}</div>`;

  showPage("post-detail");
}

function previewCommentImage(event) {
  const file = event.target.files?.[0];
  const wrap = document.getElementById("comment-image-preview-wrap");
  const img = document.getElementById("comment-image-preview");
  if (!file) { wrap.classList.add("hidden"); return; }

  if (!file.type.startsWith("image/")) {
    showNotification("Merci de choisir un fichier image.", "error");
    event.target.value = "";
    wrap.classList.add("hidden");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
    wrap.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function removeCommentImagePreview() {
  const fileInput = document.getElementById("comment-image");
  const wrap = document.getElementById("comment-image-preview-wrap");
  if (fileInput) fileInput.value = "";
  if (wrap) wrap.classList.add("hidden");
}

function buildCommentCard(comment) {
  const imageHTML = comment.imageUrl
    ? `<img src="${comment.imageUrl}" alt="Image jointe à la réponse" class="comment-image"
         onclick="openImageLightbox('${comment.imageUrl}')" />`
    : "";

  const actions = [];
  if (state.currentUser) {
    actions.push(`<button class="report-link" onclick="openReportModal('comment','${comment.id}','${comment.postId}')">🚩 Signaler</button>`);
  }
  if (isAdmin(state.currentUser)) {
    actions.push(`<button class="report-link report-link-danger" onclick="deleteComment('${comment.id}')">🗑️ Supprimer (admin)</button>`);
  }

  return `
    <div class="comment-card">
      <div class="comment-header">
        <span class="comment-author">👤 ${escapeHtml(comment.author)}</span>
        <span class="comment-date">${formatDate(comment.date)}</span>
      </div>
      <p class="comment-body">${escapeHtml(comment.body)}</p>
      ${imageHTML}
      ${actions.length ? `<div class="comment-actions">${actions.join("")}</div>` : ""}
    </div>`;
}

function openImageLightbox(url) {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");
  overlay.classList.remove("hidden");
  box.classList.add("modal-box-lightbox");
  box.innerHTML = `
    <button class="modal-close" onclick="closeModal(); document.getElementById('modal-box').classList.remove('modal-box-lightbox');" aria-label="Fermer">✕</button>
    <img src="${url}" alt="Image en grand format" class="lightbox-image" />`;
}

async function handleAddComment(event) {
  event.preventDefault();

  if (!state.currentUser) {
    openModal("login");
    return;
  }

  const body = document.getElementById("comment-body")?.value.trim();
  const errEl = document.getElementById("err-comment");
  const fileInput = document.getElementById("comment-image");
  const file = fileInput?.files?.[0] || null;

  if (!body || body.length < 10) {
    if (errEl) {
      errEl.textContent = "La réponse doit faire au moins 10 caractères.";
      errEl.classList.add("visible");
    }
    return;
  }
  if (file && file.size > 5 * 1024 * 1024) {
    if (errEl) {
      errEl.textContent = "L'image ne doit pas dépasser 5 Mo.";
      errEl.classList.add("visible");
    }
    return;
  }
  if (errEl) errEl.classList.remove("visible");

  const btn = event.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = file ? "Envoi de l'image…" : "Publication…";

  let imageUrl = null;
  if (file) {
    imageUrl = await uploadCommentImage(file);
  }

  btn.textContent = "Publication…";

  const post = state.posts.find(p => p.id === state.currentPostId);

  const commentData = {
    postId: state.currentPostId,
    author: state.currentUser.name,
    authorId: state.currentUser.id,
    body,
  };
  if (imageUrl) commentData.imageUrl = imageUrl;

  await addCommentToFirestore(commentData);

  // Notifie l'auteur de la question (sauf s'il répond à sa propre question)
  if (post && post.authorId !== state.currentUser.id) {
    createNotification(post.authorId, "reply", post.id, post.title, state.currentUser.name);
  }

  showNotification("Réponse publiée ! 🎉", "success");
  // onSnapshot mettra automatiquement à jour l'affichage
  btn.disabled = false;
  btn.textContent = "Publier la réponse";
  removeCommentImagePreview();
}

/* ─────────────────────────────────────────────────────────────
   15. CATÉGORIES
───────────────────────────────────────────────────────────────*/

function renderHomeCategories() {
  const grid = document.getElementById("home-categories-grid");
  if (!grid) return;

  grid.innerHTML = CATEGORIES.slice(0, 8).map(c => {
    const count = state.posts.filter(p => p.category === c.name).length;
    return buildCategoryCard(c, count);
  }).join("");
}

function renderFullCategories() {
  const grid = document.getElementById("full-categories-grid");
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(c => {
    const count = state.posts.filter(p => p.category === c.name).length;
    return buildCategoryCard(c, count);
  }).join("");
}

function buildCategoryCard(cat, count) {
  return `
    <div class="category-card" onclick="filterAndGo('${escapeHtml(cat.name)}')"
         tabindex="0" role="button" aria-label="Voir les questions sur ${cat.name}"
         onkeydown="if(event.key==='Enter') filterAndGo('${escapeHtml(cat.name)}')">
      <div class="cat-emoji">
        <img src="${cat.image}" alt="${escapeHtml(cat.name)}" width="32" height="32" style="border-radius:50px;" />
      </div>
      <div class="cat-name">${escapeHtml(cat.name)}</div>
      <div class="cat-count">${count} question${count !== 1 ? "s" : ""}</div>
    </div>`;
}

function renderNavCategories() { }

/* ─────────────────────────────────────────────────────────────
   16. STATISTIQUES
───────────────────────────────────────────────────────────────*/

function renderStats() {
  const users = getUsers().length + 100;
  const posts = state.posts.length + 40;
  const comments = state.comments.length + 93;

  animateCount("stat-members", users);
  animateCount("stat-questions", posts);
  animateCount("stat-answers", comments);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.round(target * easeOut(progress));
    el.textContent = value.toLocaleString("fr-FR");
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ─────────────────────────────────────────────────────────────
   17. TABLEAU DE BORD
───────────────────────────────────────────────────────────────*/

function renderDashboard() {
  if (!state.currentUser) {
    showPage("home");
    openModal("login");
    return;
  }

  const user = state.currentUser;
  const posts = state.posts.filter(p => p.authorId === user.id);
  const comments = state.comments.filter(c => c.authorId === user.id);

  document.getElementById("dashboard-greeting").textContent =
    `Bonjour, ${user.name.split(" ")[0]} 👋`;

  document.getElementById("dash-avatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("dash-name").textContent = user.name;
  document.getElementById("dash-email").textContent = user.email;
  document.getElementById("dash-since").textContent =
    `Membre depuis le ${formatDate(user.joinedAt)}`;
  document.getElementById("dash-posts-count").textContent = posts.length;
  document.getElementById("dash-comments-count").textContent = comments.length;

  const postsContainer = document.getElementById("dash-posts-list");
  const postsEmpty = document.getElementById("dash-posts-empty");

  if (posts.length === 0) {
    postsContainer.classList.add("hidden");
    postsEmpty.classList.remove("hidden");
  } else {
    postsContainer.classList.remove("hidden");
    postsEmpty.classList.add("hidden");
    postsContainer.innerHTML = posts.map(p => buildPostCard(p)).join("");
  }

  const commentsContainer = document.getElementById("dash-comments-list");
  const commentsEmpty = document.getElementById("dash-comments-empty");

  if (comments.length === 0) {
    commentsContainer.classList.add("hidden");
    commentsEmpty.classList.remove("hidden");
  } else {
    commentsContainer.classList.remove("hidden");
    commentsEmpty.classList.add("hidden");

    const recent = comments.slice(-8).reverse();

    commentsContainer.innerHTML = recent.map(c => {
      const post = state.posts.find(p => p.id === c.postId);
      const postTitle = post ? post.title : "Question supprimée";
      return `
        <div class="comment-card" style="cursor:pointer" onclick="openPostDetail('${c.postId}')"
             title="Voir la question">
          <div class="comment-header">
            <span class="comment-author">→ ${escapeHtml(postTitle).slice(0, 60)}${postTitle.length > 60 ? "…" : ""}</span>
            <span class="comment-date">${formatDate(c.date)}</span>
          </div>
          <p class="comment-body">${escapeHtml(c.body)}</p>
        </div>`;
    }).join("");
  }
}

/* ─────────────────────────────────────────────────────────────
   18. NOTIFICATIONS
───────────────────────────────────────────────────────────────*/

function showNotification(message, type = "info", duration = 3500) {
  const container = document.getElementById("notification-container");
  const notif = document.createElement("div");

  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  notif.className = `notif ${type}`;
  notif.innerHTML = `<span>${icons[type] || "ℹ️"}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("fade-out");
    notif.addEventListener("animationend", () => notif.remove(), { once: true });
  }, duration);
}

/* ─────────────────────────────────────────────────────────────
   18b. CLOCHE DE NOTIFICATIONS (réponses à mes questions)
───────────────────────────────────────────────────────────────*/

function renderNotifBell() {
  const unread = state.notifications.filter(n => !n.read).length;

  [document.getElementById("notif-badge"), document.getElementById("notif-badge-mobile")].forEach(el => {
    if (!el) return;
    if (unread > 0) {
      el.textContent = unread > 9 ? "9+" : String(unread);
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });

  const list = document.getElementById("notif-dropdown-list");
  if (list) {
    list.innerHTML = state.notifications.length
      ? state.notifications.slice(0, 20).map(n => `
          <div class="notif-item ${n.read ? "" : "unread"}" onclick="openNotification('${n.id}','${n.postId}')">
            <p>💬 <strong>${escapeHtml(n.fromName || "Quelqu'un")}</strong> a répondu à
              « ${escapeHtml((n.postTitle || "").slice(0, 50))}${(n.postTitle || "").length > 50 ? "…" : ""} »</p>
            <span class="notif-item-date">${formatDate(n.date)}</span>
          </div>`).join("")
      : `<div class="notif-empty">Pas encore de notification.</div>`;
  }
}

function toggleNotifDropdown(event) {
  event?.stopPropagation();
  if (!state.currentUser) { openModal("login"); return; }
  const dropdown = document.getElementById("notif-dropdown");
  if (dropdown) dropdown.classList.toggle("hidden");
}

function closeNotifDropdown() {
  const dropdown = document.getElementById("notif-dropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function setupNotifDropdownClose() {
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("notif-dropdown");
    const bell = document.getElementById("notif-bell-btn");
    if (!dropdown || dropdown.classList.contains("hidden")) return;
    if (!dropdown.contains(e.target) && e.target !== bell && !bell?.contains(e.target)) {
      closeNotifDropdown();
    }
  });
}

async function openNotification(notifId, postId) {
  closeNotifDropdown();
  const notif = state.notifications.find(n => n.id === notifId);
  if (notif && !notif.read) {
    try { await updateDoc(doc(db, "notifications", notifId), { read: true }); }
    catch (e) { console.error("Erreur maj notification:", e); }
  }
  openPostDetail(postId);
}

async function markAllNotificationsRead() {
  const unread = state.notifications.filter(n => !n.read);
  if (unread.length === 0) return;
  try {
    await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
  } catch (e) {
    console.error("Erreur maj notifications:", e);
  }
}

/* ─────────────────────────────────────────────────────────────
   18c. MODÉRATION (signalements, suppression, panneau admin)
───────────────────────────────────────────────────────────────*/

function updateAdminUI() {
  const admin = isAdmin(state.currentUser);
  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !admin);
  });
  renderModBadge();
}

function renderModBadge() {
  if (!isAdmin(state.currentUser)) return;
  const pending = state.reports.filter(r => r.status === "pending").length;
  [document.getElementById("mod-badge")].forEach(el => {
    if (!el) return;
    if (pending > 0) {
      el.textContent = pending > 9 ? "9+" : String(pending);
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });
}

function openReportModal(type, targetId, postId) {
  if (!state.currentUser) { openModal("login"); return; }
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");
  overlay.classList.remove("hidden");
  box.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Signaler ${type === "post" ? "cette question" : "cette réponse"}</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
    </div>
    <form onsubmit="submitReport(event,'${type}','${targetId}','${postId}')" novalidate>
      <div class="form-group">
        <label for="report-reason">Pourquoi signales-tu ce contenu ?</label>
        <textarea id="report-reason" class="form-input form-textarea" rows="4"
          placeholder="Contenu inapproprié, spam, harcèlement…" required></textarea>
        <p class="form-error" id="err-report"></p>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Envoyer le signalement</button>
    </form>`;
}

async function submitReport(event, type, targetId, postId) {
  event.preventDefault();
  const reason = document.getElementById("report-reason")?.value.trim();
  const errEl = document.getElementById("err-report");

  if (!reason || reason.length < 5) {
    if (errEl) { errEl.textContent = "Merci de préciser la raison (5 caractères min)."; errEl.classList.add("visible"); }
    return;
  }

  const post = state.posts.find(p => p.id === postId);

  const ok = await addReportToFirestore({
    type, targetId, postId,
    postTitle: post ? post.title : "",
    reporterId: state.currentUser.id,
    reporterName: state.currentUser.name,
    reason,
  });

  if (ok) {
    closeModal();
    showNotification("Signalement envoyé, merci de contribuer à la sécurité de la communauté. 🙏", "success");
  }
}

async function deletePost(postId) {
  if (!isAdmin(state.currentUser)) return;
  if (!confirm("Supprimer définitivement cette question et toutes ses réponses ?")) return;

  try {
    await deleteDoc(doc(db, "posts", postId));
    const relatedComments = state.comments.filter(c => c.postId === postId);
    await Promise.all(relatedComments.map(c => deleteDoc(doc(db, "comments", c.id))));
    showNotification("Question supprimée.", "success");
    showPage("forum");
  } catch (e) {
    console.error("Erreur suppression post:", e);
    showNotification("Erreur lors de la suppression.", "error");
  }
}

async function deleteComment(commentId) {
  if (!isAdmin(state.currentUser)) return;
  if (!confirm("Supprimer définitivement cette réponse ?")) return;

  try {
    await deleteDoc(doc(db, "comments", commentId));
    showNotification("Réponse supprimée.", "success");
    if (state.currentPage === "post-detail") openPostDetail(state.currentPostId);
  } catch (e) {
    console.error("Erreur suppression commentaire:", e);
    showNotification("Erreur lors de la suppression.", "error");
  }
}

async function resolveReport(reportId, action) {
  if (!isAdmin(state.currentUser)) return;
  const report = state.reports.find(r => r.id === reportId);
  if (!report) return;

  try {
    if (action === "delete") {
      if (report.type === "post") {
        await deleteDoc(doc(db, "posts", report.targetId));
        const relatedComments = state.comments.filter(c => c.postId === report.targetId);
        await Promise.all(relatedComments.map(c => deleteDoc(doc(db, "comments", c.id))));
      } else {
        await deleteDoc(doc(db, "comments", report.targetId));
      }
      await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
      showNotification("Contenu supprimé, signalement traité.", "success");
    } else {
      await updateDoc(doc(db, "reports", reportId), { status: "dismissed" });
      showNotification("Signalement rejeté.", "info");
    }
  } catch (e) {
    console.error("Erreur traitement signalement:", e);
    showNotification("Erreur lors du traitement du signalement.", "error");
  }
}

function renderModeration() {
  if (!isAdmin(state.currentUser)) { showPage("home"); return; }

  const container = document.getElementById("moderation-list");
  const emptyEl = document.getElementById("moderation-empty");
  if (!container) return;

  const pending = state.reports.filter(r => r.status === "pending");

  if (pending.length === 0) {
    container.classList.add("hidden");
    emptyEl.classList.remove("hidden");
    return;
  }

  container.classList.remove("hidden");
  emptyEl.classList.add("hidden");

  container.innerHTML = pending.map(r => {
    let contentPreview = "Contenu introuvable (déjà supprimé).";
    if (r.type === "post") {
      const p = state.posts.find(p => p.id === r.targetId);
      if (p) contentPreview = `<strong>${escapeHtml(p.title)}</strong><br>${escapeHtml(p.body.slice(0, 200))}${p.body.length > 200 ? "…" : ""}`;
    } else {
      const c = state.comments.find(c => c.id === r.targetId);
      if (c) contentPreview = escapeHtml(c.body.slice(0, 200)) + (c.body.length > 200 ? "…" : "");
    }

    return `
      <div class="report-card">
        <div class="report-card-header">
          <span class="post-badge">${r.type === "post" ? "❓ Question" : "💬 Réponse"}</span>
          <span class="comment-date">${formatDate(r.date)}</span>
        </div>
        <p class="report-reason"><strong>Raison :</strong> ${escapeHtml(r.reason)}</p>
        <p class="report-reporter">Signalé par ${escapeHtml(r.reporterName)}</p>
        <div class="report-content-preview">${contentPreview}</div>
        <div class="report-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="openPostDetail('${r.postId}')">👁️ Voir le contexte</button>
          <button class="btn btn-outline-danger btn-sm" onclick="resolveReport('${r.id}','delete')">🗑️ Supprimer le contenu</button>
          <button class="btn btn-ghost btn-sm" onclick="resolveReport('${r.id}','dismiss')">✕ Rejeter le signalement</button>
        </div>
      </div>`;
  }).join("");
}

/* ─────────────────────────────────────────────────────────────
   19. UTILITAIRES
───────────────────────────────────────────────────────────────*/

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
}

function clearErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = "";
      el.classList.remove("visible");
    }
  });
}

function formatDate(isoString) {
  if (!isoString) return "–";
  // Firebase serverTimestamp peut être un objet Timestamp
  let d;
  if (isoString && typeof isoString.toDate === "function") {
    d = isoString.toDate();
  } else {
    d = new Date(isoString);
  }
  if (isNaN(d)) return "–";

  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `Il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 86400 * 30) return `Il y a ${Math.floor(diff / (86400 * 7))} sem.`;

  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ─────────────────────────────────────────────────────────────
   20. EXPOSITION GLOBALE DES FONCTIONS (nécessaire avec type="module")
   Les attributs onclick="..." dans le HTML ne peuvent pas accéder
   aux fonctions d'un module ES, il faut les attacher à window.
───────────────────────────────────────────────────────────────*/
window.showPage = showPage;
window.filterAndGo = filterAndGo;
window.openModal = openModal;
window.closeModal = closeModal;
window.openNewPostModal = openNewPostModal;
window.openPostDetail = openPostDetail;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleNewPost = handleNewPost;
window.handleAddComment = handleAddComment;
window.searchPosts = searchPosts;
window.filterPosts = filterPosts;
window.logout = logout;
window.previewCommentImage = previewCommentImage;
window.removeCommentImagePreview = removeCommentImagePreview;
window.openImageLightbox = openImageLightbox;
window.toggleNotifDropdown = toggleNotifDropdown;
window.openNotification = openNotification;
window.markAllNotificationsRead = markAllNotificationsRead;
window.openReportModal = openReportModal;
window.submitReport = submitReport;
window.deletePost = deletePost;
window.deleteComment = deleteComment;
window.resolveReport = resolveReport;

(function () {
  let deferredPrompt; // stocke l'événement d'installation (si le navigateur le propose)
  const installBtn = document.getElementById('install-btn');
  const installToast = document.getElementById('install-toast');

  if (!installBtn) {
    console.warn('Bouton #install-btn introuvable : le snippet install-button.html a-t-il bien été ajouté ?');
    return;
  }

  const dejaInstallee = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true; // iOS Safari

  // Le bouton flottant reste visible en permanence tant que l'app n'est pas installée
  if (!dejaInstallee) {
    installBtn.style.display = 'flex';
  }

  // Le navigateur signale que l'installation automatique est possible (Chrome/Edge/Brave/Android)
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // empêche la mini-infobar automatique de Chrome
    deferredPrompt = event;
  });

  // Clic sur le bouton flottant
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Cas standard : le navigateur gère l'installation nativement
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Résultat de l'installation : ${outcome}`);
      deferredPrompt = null;
    } else {
      // Cas Safari/iOS ou navigateur sans prompt natif : on montre comment faire manuellement
      showInstallInstructions();
    }
  });

  function showInstallInstructions() {
    const ua = navigator.userAgent || navigator.vendor || "";
    const estIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const estSafariDesktop = /^((?!chrome|android).)*safari/i.test(ua) && !estIOS;

    let etapes;
    if (estIOS) {
      etapes = `
        <ol class="install-steps">
          <li>Appuie sur l'icône <strong>Partager</strong> <span aria-hidden="true">⬆️</span> en bas de Safari</li>
          <li>Fais défiler et choisis <strong>« Sur l'écran d'accueil »</strong></li>
          <li>Appuie sur <strong>Ajouter</strong> en haut à droite</li>
        </ol>`;
    } else if (estSafariDesktop) {
      etapes = `
        <ol class="install-steps">
          <li>Clique sur le menu <strong>Fichier</strong> dans la barre de menu</li>
          <li>Choisis <strong>« Ajouter au Dock »</strong></li>
        </ol>`;
    } else {
      etapes = `
        <ol class="install-steps">
          <li>Ouvre le menu de ton navigateur (généralement en haut à droite, ⋮ ou ☰)</li>
          <li>Choisis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong></li>
        </ol>
        <p class="install-note">Pour l'installation en un clic, utilise Chrome, Edge ou Brave.</p>`;
    }

    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    if (!overlay || !box) return;
    overlay.classList.remove('hidden');
    box.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">📲 Installer YouthConnect</h2>
        <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
      </div>
      <p style="margin-bottom:14px;color:var(--gray-700)">Ton navigateur ne propose pas l'installation automatique, mais tu peux ajouter YouthConnect à ton écran d'accueil en quelques secondes :</p>
      ${etapes}`;
  }

  // Détecte que l'installation a réellement été effectuée
  window.addEventListener('appinstalled', () => {
    installBtn.style.display = 'none';
    if (installToast) {
      installToast.style.display = 'block';
      setTimeout(() => { installToast.style.display = 'none'; }, 4000);
    }
  });

  // Enregistrement du service worker (obligatoire pour la PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service worker enregistré :', reg.scope))
        .catch((err) => console.error('Échec du service worker :', err));
    });
  }
})();