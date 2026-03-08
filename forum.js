const CATEGORIES = ["Alkohol", "Rauchen", "Screentime", "Glücksspiel"];
const FORUM_KEY = "addictionranks.forum.posts";
const SESSION_KEY = "addictionranks.session";
const USERS_KEY = "addictionranks.users";

const form = document.querySelector("#forum-form");
const list = document.querySelector("#forum-list");
const categorySelect = document.querySelector("#forum-category");
const loginForm = document.querySelector("#forum-login-form");
const authState = document.querySelector("#forum-auth-state");

function loadArray(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function upsertUser(code, name) {
  const users = loadArray(USERS_KEY);
  const idx = users.findIndex((user) => user.code === code);

  if (idx === -1) users.push({ code, name, about: "", photo: "" });
  else users[idx] = { ...users[idx], name };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function fillCategories() {
  categorySelect.innerHTML = '<option value="">Bitte wählen</option>';
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function loadPosts() {
  return loadArray(FORUM_KEY);
}

function savePosts(posts) {
  localStorage.setItem(FORUM_KEY, JSON.stringify(posts));
}

function profileUrl(code) {
  return `profile.html?code=${encodeURIComponent(code)}`;
}

function renderAuthState() {
  const session = getSession();
  if (!session) {
    authState.innerHTML = '<p class="empty">Nicht eingeloggt.</p>';
    return;
  }

  authState.innerHTML = "";
  const p = document.createElement("p");
  p.innerHTML = `Eingeloggt als <strong>${session.name}</strong> [${session.code}] - <a href="${profileUrl(session.code)}">Profil</a>`;
  authState.appendChild(p);
}

function renderPosts() {
  list.innerHTML = "";
  const posts = loadPosts();

  if (posts.length === 0) {
    list.innerHTML = '<p class="empty">Noch keine Beiträge.</p>';
    return;
  }

  posts
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((post) => {
      const card = document.createElement("article");
      card.className = "forum-post";

      const title = document.createElement("h3");
      title.textContent = `${post.title} (${post.category})`;

      const meta = document.createElement("p");
      meta.className = "hint";
      const link = document.createElement("a");
      link.href = profileUrl(post.authorCode);
      link.textContent = post.authorName;
      meta.textContent = "von ";
      meta.appendChild(link);
      meta.append(` [${post.authorCode}]`);

      const body = document.createElement("p");
      body.textContent = post.body;

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(body);
      list.appendChild(card);
    });
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = document.querySelector("#forum-login-code").value.trim().toUpperCase();
  const name = document.querySelector("#forum-login-name").value.trim();
  if (!code || !name) return;

  upsertUser(code, name);
  setSession({ code, name, about: "" });
  renderAuthState();
  loginForm.reset();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = getSession();
  if (!session) {
    alert("Bitte erst oben einloggen.");
    return;
  }

  const category = categorySelect.value;
  const title = document.querySelector("#forum-title").value.trim();
  const body = document.querySelector("#forum-body").value.trim();
  if (!category || !title || !body) return;

  const posts = loadPosts();
  posts.push({
    id: crypto.randomUUID(),
    category,
    title,
    body,
    authorCode: session.code,
    authorName: session.name,
    createdAt: Date.now(),
  });

  savePosts(posts);
  form.reset();
  renderPosts();
});

fillCategories();
renderAuthState();
renderPosts();
