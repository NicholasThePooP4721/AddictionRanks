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
  el.textContent = session
    ? `Eingeloggt als ${session.name} [${session.code}]`
    : "Nicht eingeloggt";
}

function loginForum(event) {
  event.preventDefault();
  const code = document.querySelector("#forum-code").value.trim().toUpperCase();
  const name = document.querySelector("#forum-name").value.trim();
  if (!code || !name) return;

  const existing = Users.byCode(code);
  const user = Users.upsert({ code, name, about: existing?.about || "", photo: existing?.photo || "" });
  Session.set({ code: user.code, name: user.name, about: user.about });
  event.target.reset();
  renderAuthState();
}

function avatarOf(code) {
  return Users.byCode(code)?.photo || placeholderSvg("Profil");
}

function renderPosts() {
  forumList.innerHTML = "";
  const data = posts().sort((a, b) => b.createdAt - a.createdAt);
  if (!data.length) {
    forumList.innerHTML = '<p class="empty">Noch keine Posts.</p>';
    return;
  }

  data.forEach((post) => {
    const card = document.createElement("article");
    card.className = "forum-post";

    const header = document.createElement("div");
    header.className = "author-row";
    const avatar = document.createElement("img");
    avatar.className = "mini-avatar";
    avatar.src = avatarOf(post.authorCode);
    avatar.alt = `Profilbild von ${post.authorName}`;

    const authorLink = document.createElement("a");
    authorLink.href = profileUrl(post.authorCode);
    authorLink.textContent = post.authorName;

    const meta = document.createElement("p");
    meta.className = "hint";
    meta.textContent = `in ${post.category}`;

    header.append(avatar, authorLink);

    const title = document.createElement("h3");
    title.textContent = post.title;
    const body = document.createElement("p");
    body.textContent = post.body;

    card.append(header, meta, title, body);

    if (post.image) {
      const img = document.createElement("img");
      img.className = "forum-image";
      img.src = post.image;
      img.alt = `Bild zu ${post.title}`;
      card.appendChild(img);
    }

    forumList.appendChild(card);
  });
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
