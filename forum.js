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

async function loginForum(event) {
  event.preventDefault();
  const code = document.querySelector("#forum-code").value.trim().toUpperCase();
  const name = document.querySelector("#forum-name").value.trim();
  const pin = document.querySelector("#forum-pin").value.trim();
  if (!code || !name) return;

  const existing = Users.byCode(code);
  if (existing?.pinHash) {
    if (!pin) return alert("PIN benötigt.");
    if ((await hashPin(pin)) !== existing.pinHash) return alert("Falsche PIN.");
  }

  const user = await Users.upsert({ code, name, about: existing?.about || "", pin });
  Session.set({ code: user.code, name: user.name, about: user.about });
  event.target.reset();
  renderAuthState();
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

    const ownerLink = `<a href="${profileUrl(post.authorCode)}">${post.authorName}</a>`;
    card.innerHTML = `
      <h3>${post.title} <span class="hint">(${post.category})</span></h3>
      <p class="hint">von ${ownerLink}</p>
      <p>${post.body}</p>
    `;

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
