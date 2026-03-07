const CATEGORIES = ["Alkohol", "Rauchen", "Screentime", "Glücksspiel"];
const FORUM_KEY = "addictionranks.forum.posts";
const SESSION_KEY = "addictionranks.session";

const form = document.querySelector("#forum-form");
const list = document.querySelector("#forum-list");
const categorySelect = document.querySelector("#forum-category");

function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadPosts() {
  const raw = localStorage.getItem(FORUM_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(FORUM_KEY, JSON.stringify(posts));
}

function fillCategories() {
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Bitte wählen";
  categorySelect.appendChild(empty);

  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function render() {
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

      const h3 = document.createElement("h3");
      h3.textContent = `${post.title} (${post.category})`;

      const meta = document.createElement("p");
      meta.className = "hint";
      meta.textContent = `von ${post.authorName} [${post.authorCode}]`;

      const body = document.createElement("p");
      body.textContent = post.body;

      card.appendChild(h3);
      card.appendChild(meta);
      card.appendChild(body);

      list.appendChild(card);
    });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = getSession();

  if (!session) {
    alert("Bitte zuerst auf der Hauptseite einloggen.");
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
  render();
});

fillCategories();
render();
