/* ═══════════════════════════════════════════════════════════════
   YouthConnect – script.js
   Fonctionnalités : Auth, Forum, Commentaires, Dashboard,
   Recherche, Filtres, LocalStorage, Notifications, Navigation
═══════════════════════════════════════════════════════════════ */

function submitContact(event) {
  event.preventDefault();

  const btn = document.getElementById('submit-btn');
  const successMsg = document.getElementById('success-msg');
  const errorMsg = document.getElementById('error-msg');

  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  btn.textContent = '⏳ Envoi en cours...';
  btn.disabled = true;

  const templateParams = {
    from_name:  document.getElementById('contact-name').value,
    from_email: document.getElementById('contact-email').value,
    subject:    document.getElementById('contact-subject').value,
    message:    document.getElementById('contact-message').value,
  };

  emailjs.send('VOTRE_SERVICE_ID', 'VOTRE_TEMPLATE_ID', templateParams)
    .then(() => {
      successMsg.style.display = 'block';
      document.getElementById('contact-form').reset();
      btn.textContent = 'Envoyer le message';
      btn.disabled = false;
      setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
    })
    .catch((error) => {
      console.error('EmailJS error:', error);
      errorMsg.style.display = 'block';
      btn.textContent = 'Envoyer le message';
      btn.disabled = false;
    });
}

/* ─────────────────────────────────────────────────────────────
   1. DONNÉES : CATÉGORIES & DONNÉES DE DÉMONSTRATION
───────────────────────────────────────────────────────────────*/

const CATEGORIES = [
  { name: "Études",                    image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576446/Etude_tkfk2y.jpg" },
  { name: "Informatique",              image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576445/Informatique_yrswg4.jpg" },
  { name: "Développement Web",         image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576445/D%C3%A9veloppement_Web_zzsmqv.jpg" },
  { name: "Entrepreneuriat",           image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Entrepreneuriat_fu5qm9.jpg" },
  { name: "Emploi",                    image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Emploi_gyjxoh.jpg" },
  { name: "Marketing Digital",         image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Marketing_Digital_typd7m.jpg" },
  { name: "Intelligence Artificielle", image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Intelligence_Artificielle_jlghjj.jpg" },
  { name: "Motivation",                image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576446/Motivation_e0xrsc.jpg" },
  { name: "Bourses d'études",          image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Bourses_d_%C3%A9tudes_s064hl.jpg" },
  { name: "Vie Étudiante",             image: "https://res.cloudinary.com/dyo3r3lph/image/upload/v1782576444/Vie_%C3%89tudiante_h6of2i.jpg" },
];

/** Publications de démonstration pré-chargées */
const DEMO_POSTS = [
  {
    id: "demo_1",
    title: "Comment débuter le développement web en 2026 ?",
    body: "Bonjour à tous ! Je suis lycéen et je veux apprendre le développement web mais je ne sais pas par où commencer. Faut-il commencer par HTML/CSS, puis JavaScript ? Ou existe-t-il une meilleure approche ? Merci d'avance pour vos conseils.",
    category: "Développement Web",
    author: "Kofi Mensah",
    authorId: "demo_user",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo_2",
    title: "Quelles sont les meilleures bourses pour étudier en Europe ?",
    body: "Je suis en terminale et je cherche des bourses pour poursuivre mes études en ingénierie en Europe. Est-ce que quelqu'un a déjà postulé à des programmes comme Erasmus+ ou les bourses Eiffel ? Comment avez-vous préparé votre dossier ?",
    category: "Bourses d'études",
    author: "Amina Traoré",
    authorId: "demo_user",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo_3",
    title: "L'IA va-t-elle remplacer les développeurs web ?",
    body: "Avec l'essor de ChatGPT, Copilot et d'autres outils IA, beaucoup disent que les développeurs ne seront plus nécessaires dans 5 ans. Qu'en pensez-vous ? Doit-on quand même apprendre à coder ou se concentrer sur d'autres compétences ?",
    category: "Intelligence Artificielle",
    author: "Ibrahima Diallo",
    authorId: "demo_user",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "demo_4",
    title: "Comment rester motivé quand on apprend seul ?",
    body: "J'apprends la programmation de façon autodidacte depuis 6 mois, mais il m'arrive souvent de procrastiner ou de douter de moi-même. Quels sont vos conseils pour maintenir la motivation et avancer malgré les obstacles ?",
    category: "Motivation",
    author: "Fatou Sow",
    authorId: "demo_user",
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "demo_5",
    title: "Trouver un stage en informatique sans expérience : conseils ?",
    body: "Je suis en deuxième année de BTS Informatique et je dois trouver un stage de 3 mois. Le problème, c'est que la plupart des offres demandent de l'expérience. Comment avez-vous décroché votre premier stage ? Faut-il créer des projets personnels ?",
    category: "Emploi",
    author: "Kwame Asante",
    authorId: "demo_user",
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

/** Commentaires de démonstration */
const DEMO_COMMENTS = [
  { id: "dc_1", postId: "demo_1", author: "Nia Johnson",   authorId: "demo_user", body: "Commence absolument par HTML et CSS, puis JavaScript. The Odin Project est une ressource gratuite et excellente pour apprendre dans le bon ordre !", date: new Date(Date.now() - 86400000).toISOString() },
  { id: "dc_2", postId: "demo_1", author: "Oumar Bah",     authorId: "demo_user", body: "Je recommande aussi freeCodeCamp ! Gratuit, structuré et avec des certifications reconnues. J'ai commencé il y a 1 an et je fais maintenant des projets freelance.", date: new Date(Date.now() - 3600000 * 18).toISOString() },
  { id: "dc_3", postId: "demo_2", author: "Léa Dubois",    authorId: "demo_user", body: "J'ai obtenu une bourse Eiffel l'an dernier ! Le plus important c'est d'avoir un excellent dossier académique et une lettre de motivation très personnalisée. N'hésite pas à me contacter.", date: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "dc_4", postId: "demo_3", author: "Seun Adeyemi",  authorId: "demo_user", body: "L'IA est un outil, pas un remplaçant. Apprendre à coder te donne la logique pour utiliser ces outils de façon efficace. Les dev qui savent utiliser l'IA seront très demandés.", date: new Date(Date.now() - 3600000 * 6).toISOString() },
  { id: "dc_5", postId: "demo_4", author: "Mariam Coulibaly", authorId: "demo_user", body: "Ce qui m'aide beaucoup : fixer de petits objectifs quotidiens et les noter. Une heure de code par jour, c'est mieux que 8h le week-end. Et rejoindre une communauté comme ici aide énormément !", date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "dc_6", postId: "demo_5", author: "Romain Kéïta",  authorId: "demo_user", body: "Crée des projets sur GitHub, même simples ! Un portfolio avec 3-4 projets bien documentés vaut n'importe quelle expérience sur un CV de débutant. J'ai décroché mon stage comme ça.", date: new Date(Date.now() - 86400000 * 5).toISOString() },
];

/* ─────────────────────────────────────────────────────────────
   2. INITIALISATION & ÉTAT GLOBAL
───────────────────────────────────────────────────────────────*/

let state = {
  currentUser:    null,
  currentPage:    "home",
  currentPostId:  null,
  searchQuery:    "",
  categoryFilter: "",
};

document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  loadSession();
  renderNavCategories();
  renderHomeCategories();
  renderStats();
  renderHomePosts();
  showPage("home");
  setupNavScroll();
  setupBurgerMenu();
  setupModalClose();
});

/* ─────────────────────────────────────────────────────────────
   3. LOCALSTORAGE : HELPERS
───────────────────────────────────────────────────────────────*/

function initStorage() {
  if (!localStorage.getItem("yc_posts")) {
    localStorage.setItem("yc_posts", JSON.stringify(DEMO_POSTS));
  }
  if (!localStorage.getItem("yc_comments")) {
    localStorage.setItem("yc_comments", JSON.stringify(DEMO_COMMENTS));
  }
  if (!localStorage.getItem("yc_users")) {
    localStorage.setItem("yc_users", JSON.stringify([]));
  }
}

function getUsers()    { return JSON.parse(localStorage.getItem("yc_users")    || "[]"); }
function getPosts()    { return JSON.parse(localStorage.getItem("yc_posts")    || "[]"); }
function getComments() { return JSON.parse(localStorage.getItem("yc_comments") || "[]"); }

function saveUsers(data)    { localStorage.setItem("yc_users",    JSON.stringify(data)); }
function savePosts(data)    { localStorage.setItem("yc_posts",    JSON.stringify(data)); }
function saveComments(data) { localStorage.setItem("yc_comments", JSON.stringify(data)); }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─────────────────────────────────────────────────────────────
   4. SESSION UTILISATEUR
───────────────────────────────────────────────────────────────*/

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
  const guestEl    = document.getElementById("guest-actions");
  const userEl     = document.getElementById("user-actions");
  const welcomeBtn = document.getElementById("welcome-btn");
  const guestMobile   = document.getElementById("guest-actions-mobile");
  const userMobile    = document.getElementById("user-actions-mobile");
  const welcomeMobile = document.getElementById("welcome-btn-mobile");

  if (state.currentUser) {
    guestEl.classList.add("hidden");
    userEl.classList.remove("hidden");
    welcomeBtn.textContent = `👤 ${state.currentUser.name.split(" ")[0]}`;
    if (guestMobile)   guestMobile.classList.add("hidden");
    if (userMobile)    userMobile.classList.remove("hidden");
    if (welcomeMobile) welcomeMobile.textContent = `👤 ${state.currentUser.name.split(" ")[0]}`;
  } else {
    guestEl.classList.remove("hidden");
    userEl.classList.add("hidden");
    if (guestMobile) guestMobile.classList.remove("hidden");
    if (userMobile)  userMobile.classList.add("hidden");
  }
}

/* ─────────────────────────────────────────────────────────────
   5. NAVIGATION ENTRE PAGES
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

  if (pageId === "forum")       renderForumPosts();
  if (pageId === "categories")  renderFullCategories();
  if (pageId === "dashboard")   renderDashboard();
  if (pageId === "home")        { renderHomePosts(); renderStats(); }
}

function filterAndGo(category) {
  state.categoryFilter = category;
  showPage("forum");
  const sel = document.getElementById("category-filter");
  if (sel) sel.value = category;
  renderForumPosts();
}

/* ─────────────────────────────────────────────────────────────
   6. NAVBAR : SCROLL & BURGER
───────────────────────────────────────────────────────────────*/

function setupNavScroll() {
  window.addEventListener("scroll", () => {
    document.getElementById("navbar").classList.toggle("scrolled", window.scrollY > 10);
  });
}

function setupBurgerMenu() {
  const btn     = document.getElementById("burger-btn");
  const links   = document.getElementById("nav-links");
  const actions = document.getElementById("nav-actions");

  btn.addEventListener("click", () => {
    const open = btn.classList.toggle("open");
    links.classList.toggle("open", open);
    if (actions) actions.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  });
}

function closeMobileMenu() {
  const btn     = document.getElementById("burger-btn");
  const links   = document.getElementById("nav-links");
  const actions = document.getElementById("nav-actions");

  if (btn)     btn.classList.remove("open");
  if (links)   links.classList.remove("open");
  if (actions) actions.classList.remove("open");
  if (btn)     btn.setAttribute("aria-expanded", "false");
}

/* ─────────────────────────────────────────────────────────────
   7. MODALS : OUVERTURE / FERMETURE
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
  const box     = document.getElementById("modal-box");

  overlay.classList.remove("hidden");

  if (type === "login")     box.innerHTML = buildLoginForm();
  if (type === "register")  box.innerHTML = buildRegisterForm();
  if (type === "new-post")  box.innerHTML = buildNewPostForm();

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
   8. TEMPLATES HTML DES MODALS
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
        <label for="reg-name">Nom complet *</label>
        <input type="text" id="reg-name" class="form-input" placeholder="Prénom Nom" required autocomplete="name" />
        <p class="form-error" id="err-name"></p>
      </div>
      <div class="form-group">
        <label for="reg-email">Adresse email *</label>
        <input type="email" id="reg-email" class="form-input" placeholder="toi@exemple.com" required autocomplete="email" />
        <p class="form-error" id="err-email"></p>
      </div>
      <div class="form-group">
        <label for="reg-password">Mot de passe *</label>
        <input type="password" id="reg-password" class="form-input" placeholder="8 caractères minimum" required autocomplete="new-password" />
        <p class="form-error" id="err-password"></p>
      </div>
      <div class="form-group">
        <label for="reg-confirm">Confirmer le mot de passe *</label>
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
  // ✅ Plus d'emoji dans le <option>, juste le nom
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
        <label for="post-title">Titre de la question *</label>
        <input type="text" id="post-title" class="form-input" placeholder="Formule ta question clairement…" required maxlength="120" />
        <p class="form-error" id="err-post-title"></p>
      </div>
      <div class="form-group">
        <label for="post-category">Catégorie *</label>
        <select id="post-category" class="form-input select-filter" required>
          <option value="">-- Choisir une catégorie --</option>
          ${options}
        </select>
        <p class="form-error" id="err-post-cat"></p>
      </div>
      <div class="form-group">
        <label for="post-body">Description détaillée *</label>
        <textarea id="post-body" class="form-input form-textarea" rows="5" placeholder="Explique ta situation, ce que tu as déjà essayé, ce que tu cherches…" required></textarea>
        <p class="form-error" id="err-post-body"></p>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Publier la question</button>
    </form>`;
}

/* ─────────────────────────────────────────────────────────────
   9. AUTHENTIFICATION : INSCRIPTION & CONNEXION
───────────────────────────────────────────────────────────────*/

function handleRegister(event) {
  event.preventDefault();

  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;

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
    id:        uid(),
    name,
    email,
    password,
    joinedAt:  new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  loginUser(newUser);
  closeModal();
  showNotification(`Bienvenue ${newUser.name.split(" ")[0]} ! 🎉 Ton compte a été créé.`, "success");
}

function handleLogin(event) {
  event.preventDefault();

  const email    = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errEl    = document.getElementById("login-error");

  errEl.style.display = "none";

  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);

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
}

function logout() {
  state.currentUser = null;
  localStorage.removeItem("yc_session");
  updateNavForUser();
  showPage("home");
  showNotification("Tu as été déconnecté(e).", "info");
}

/* ─────────────────────────────────────────────────────────────
   10. FORUM : CRÉATION & AFFICHAGE DES PUBLICATIONS
───────────────────────────────────────────────────────────────*/

function handleNewPost(event) {
  event.preventDefault();

  const title    = document.getElementById("post-title").value.trim();
  const category = document.getElementById("post-category").value;
  const body     = document.getElementById("post-body").value.trim();

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

  const post = {
    id:       uid(),
    title,
    body,
    category,
    author:   state.currentUser.name,
    authorId: state.currentUser.id,
    date:     new Date().toISOString(),
  };

  const posts = getPosts();
  posts.unshift(post);
  savePosts(posts);

  closeModal();
  showNotification("Ta question a été publiée ! 🙌", "success");

  renderForumPosts();
  renderStats();
  renderHomePosts();
}

function renderForumPosts() {
  const container = document.getElementById("forum-posts-list");
  const emptyEl   = document.getElementById("forum-empty");

  if (!container) return;

  // ✅ Plus d'emoji dans le <option> du filtre
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

  let posts = getPosts();

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

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

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

  const posts = getPosts()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  container.innerHTML = posts.map(p => buildPostCard(p)).join("");
}

/** Construit le HTML d'une carte de publication */
function buildPostCard(post) {
  const comments = getComments().filter(c => c.postId === post.id);
  const excerpt  = post.body.length > 130 ? post.body.slice(0, 130) + "…" : post.body;
  const cat      = CATEGORIES.find(c => c.name === post.category);
  // ✅ Utilise l'image au lieu de l'emoji
  const imgTag   = cat
    ? `<img src="${cat.image}" alt="${escapeHtml(cat.name)}" width="18" height="18" border-radius="50px" style="vertical-align:middle;margin-right:4px;" />`
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
   11. RECHERCHE ET FILTRES
───────────────────────────────────────────────────────────────*/

function searchPosts() {
  renderForumPosts();
}

function filterPosts() {
  state.categoryFilter = document.getElementById("category-filter")?.value || "";
  renderForumPosts();
}

/* ─────────────────────────────────────────────────────────────
   12. DÉTAIL D'UNE QUESTION + COMMENTAIRES
───────────────────────────────────────────────────────────────*/

function openPostDetail(postId) {
  const posts = getPosts();
  const post  = posts.find(p => p.id === postId);
  if (!post) return;

  state.currentPostId = postId;

  const container = document.getElementById("post-detail-content");
  const comments  = getComments().filter(c => c.postId === postId);
  const cat       = CATEGORIES.find(c => c.name === post.category);
  // ✅ Utilise l'image au lieu de l'emoji
  const imgTag    = cat
    ? `<img src="${cat.image}" alt="${escapeHtml(cat.name)}" width="18" height="18" style="vertical-align:middle; border-radius:50px;">`
    : "📋";

  const commentHTML = comments.length > 0
    ? comments.sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(c => buildCommentCard(c)).join("")
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
          <button type="submit" class="btn btn-primary">Publier la réponse</button>
        </form>
      </div>`
    : `<div class="add-comment-box" style="text-align:center">
        <p style="margin-bottom:16px;color:var(--gray-600)">Connecte-toi pour répondre à cette question.</p>
        <button class="btn btn-primary" onclick="openModal('login')">Se connecter</button>
       </div>`;

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
    </div>

    <h2 class="comments-section-title">Réponses (${comments.length})</h2>
    <div id="comments-list">${commentHTML}</div>
    <div style="margin-top:24px">${addCommentHTML}</div>`;

  showPage("post-detail");
}

function buildCommentCard(comment) {
  return `
    <div class="comment-card">
      <div class="comment-header">
        <span class="comment-author">👤 ${escapeHtml(comment.author)}</span>
        <span class="comment-date">${formatDate(comment.date)}</span>
      </div>
      <p class="comment-body">${escapeHtml(comment.body)}</p>
    </div>`;
}

function handleAddComment(event) {
  event.preventDefault();

  if (!state.currentUser) {
    openModal("login");
    return;
  }

  const body  = document.getElementById("comment-body")?.value.trim();
  const errEl = document.getElementById("err-comment");

  if (!body || body.length < 10) {
    if (errEl) {
      errEl.textContent = "La réponse doit faire au moins 10 caractères.";
      errEl.classList.add("visible");
    }
    return;
  }
  if (errEl) errEl.classList.remove("visible");

  const comment = {
    id:       uid(),
    postId:   state.currentPostId,
    author:   state.currentUser.name,
    authorId: state.currentUser.id,
    body,
    date:     new Date().toISOString(),
  };

  const comments = getComments();
  comments.push(comment);
  saveComments(comments);

  showNotification("Réponse publiée ! 🎉", "success");
  openPostDetail(state.currentPostId);
}

/* ─────────────────────────────────────────────────────────────
   13. CATÉGORIES
───────────────────────────────────────────────────────────────*/

function renderHomeCategories() {
  const grid = document.getElementById("home-categories-grid");
  if (!grid) return;

  const posts = getPosts();
  grid.innerHTML = CATEGORIES.slice(0, 8).map(c => {
    const count = posts.filter(p => p.category === c.name).length;
    return buildCategoryCard(c, count);
  }).join("");
}

function renderFullCategories() {
  const grid = document.getElementById("full-categories-grid");
  if (!grid) return;

  const posts = getPosts();
  grid.innerHTML = CATEGORIES.map(c => {
    const count = posts.filter(p => p.category === c.name).length;
    return buildCategoryCard(c, count);
  }).join("");
}

/** ✅ Construit la carte d'une catégorie avec image */
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

function renderNavCategories() {
  // Déjà géré dans renderForumPosts
}

/* ─────────────────────────────────────────────────────────────
   14. STATISTIQUES
───────────────────────────────────────────────────────────────*/

function renderStats() {
  const users    = getUsers().length + 100;
  const posts    = getPosts().length + 40;
  const comments = getComments().length + 93;

  animateCount("stat-members",   users);
  animateCount("stat-questions", posts);
  animateCount("stat-answers",   comments);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  const duration = 1200;
  const start    = performance.now();
  const from     = 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.round(from + (target - from) * easeOut(progress));
    el.textContent = value.toLocaleString("fr-FR");
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ─────────────────────────────────────────────────────────────
   15. TABLEAU DE BORD UTILISATEUR
───────────────────────────────────────────────────────────────*/

function renderDashboard() {
  if (!state.currentUser) {
    showPage("home");
    openModal("login");
    return;
  }

  const user     = state.currentUser;
  const posts    = getPosts().filter(p => p.authorId === user.id);
  const comments = getComments().filter(c => c.authorId === user.id);

  document.getElementById("dashboard-greeting").textContent =
    `Bonjour, ${user.name.split(" ")[0]} 👋`;

  document.getElementById("dash-avatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("dash-name").textContent   = user.name;
  document.getElementById("dash-email").textContent  = user.email;
  document.getElementById("dash-since").textContent  =
    `Membre depuis le ${formatDate(user.joinedAt)}`;
  document.getElementById("dash-posts-count").textContent    = posts.length;
  document.getElementById("dash-comments-count").textContent = comments.length;

  const postsContainer = document.getElementById("dash-posts-list");
  const postsEmpty     = document.getElementById("dash-posts-empty");

  if (posts.length === 0) {
    postsContainer.classList.add("hidden");
    postsEmpty.classList.remove("hidden");
  } else {
    postsContainer.classList.remove("hidden");
    postsEmpty.classList.add("hidden");
    const sorted = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    postsContainer.innerHTML = sorted.map(p => buildPostCard(p)).join("");
  }

  const commentsContainer = document.getElementById("dash-comments-list");
  const commentsEmpty     = document.getElementById("dash-comments-empty");

  if (comments.length === 0) {
    commentsContainer.classList.add("hidden");
    commentsEmpty.classList.remove("hidden");
  } else {
    commentsContainer.classList.remove("hidden");
    commentsEmpty.classList.add("hidden");

    const recent = comments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    const allPosts = getPosts();
    commentsContainer.innerHTML = recent.map(c => {
      const post = allPosts.find(p => p.id === c.postId);
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
   16. CONTACT
───────────────────────────────────────────────────────────────*/

function submitContact(event) {
  event.preventDefault();
  const name = document.getElementById("contact-name").value.trim();

  showNotification(`Merci ${name} ! Ton message a bien été envoyé. On te répond sous 48h. ✉️`, "success");

  document.getElementById("contact-form").reset();
}

/* ─────────────────────────────────────────────────────────────
   17. NOTIFICATIONS VISUELLES
───────────────────────────────────────────────────────────────*/

function showNotification(message, type = "info", duration = 3500) {
  const container = document.getElementById("notification-container");
  const notif     = document.createElement("div");

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
   18. UTILITAIRES
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
  const d    = new Date(isoString);
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)          return "À l'instant";
  if (diff < 3600)        return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)       return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7)   return `Il y a ${Math.floor(diff / 86400)} j`;
  if (diff < 86400 * 30)  return `Il y a ${Math.floor(diff / (86400 * 7))} sem.`;

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