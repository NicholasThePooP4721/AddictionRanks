const forumList = document.querySelector("#forum-list");

function posts() {
  return Storage.loadArray(APP.keys.forum);
}

function savePosts(next) {
  Storage.save(APP.keys.forum, next);
}

function renderAuthState() {
  const session = Session.get();
  const el = document.querySelector("#forum-auth-state");
  el.textContent = session ? `Eingeloggt als ${session.name} [${session.code}]` : "Nicht eingeloggt";
}

function loginForum(event) {
  event.preventDefault();
  const code = document.querySelector("#forum-code").value.trim().toUpperCase();
  const name = document.querySelector("#forum-name").value.trim();
  if (!code || !name) return;

  const existing = Users.byCode(code);
  const user = Users.upsert({
    code,
    name,
    about: existing?.about || "",
    photo: existing?.photo || "",
  });

  Session.set({ code: user.code, name: user.name, about: user.about });
  event.target.reset();
  renderAuthState();
}

function postCard(post) {
  const card = document.createElement("article");
  card.className = "forum-post";

  const title = document.createElement("h3");
  title.textContent = `${post.title} (${post.category})`;

  const author = document.createElement("div");
  author.className = "owner-row";

  const user = Users.byCode(post.authorCode);
  const avatar = document.createElement("img");
  avatar.className = "avatar-sm";
  avatar.src = user?.photo || placeholderSvg(post.authorName || "User");
  avatar.alt = `Avatar von ${post.authorName}`;

  const link = document.createElement("a");
  link.href = profileUrl(post.authorCode);
  link.textContent = post.authorName;

  author.append(avatar, document.createTextNode("von "), link);

  const body = document.createElement("p");
  body.textContent = post.body;

  card.append(title, author, body);

  if (post.image) {
    const img = document.createElement("img");
    img.className = "forum-image";
    img.src = post.image;
    img.alt = `Bild zu ${post.title}`;
    card.appendChild(img);
  }

  return card;
}

function renderPosts() {
  forumList.innerHTML = "";
  const data = posts().sort((a, b) => b.createdAt - a.createdAt);
  if (!data.length) {
    forumList.innerHTML = '<p class="empty">Noch keine Posts.</p>';
    return;
  }

  data.forEach((post) => forumList.appendChild(postCard(post)));
}

document.querySelector("#forum-login-form").addEventListener("submit", loginForum);

document.querySelector("#forum-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = Session.get();
  if (!session) return alert("Bitte zuerst einloggen.");

  const category = document.querySelector("#forum-category").value;
  const title = document.querySelector("#forum-title").value.trim();
  const body = document.querySelector("#forum-body").value.trim();
  const file = document.querySelector("#forum-image").files[0];
  if (!category || !title || !body) return;

  const image = file ? await fileToDataUrl(file) : "";
  const next = posts();
  next.push({
    id: crypto.randomUUID(),
    category,
    title,
    body,
    image,
    authorCode: session.code,
    authorName: session.name,
    createdAt: Date.now(),
  });

  savePosts(next);
  event.target.reset();
  renderPosts();
});

fillSelect(document.querySelector("#forum-category"), APP.categories.forum);
renderAuthState();
renderPosts();
