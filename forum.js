const forumList = document.querySelector("#forum-list");
const adminState = document.querySelector("#admin-state");
const premiumDialog = document.querySelector("#premium-dialog");

let isAdmin = false;

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

function renderAdminState() {
  adminState.textContent = isAdmin ? "Admin aktiv: Du kannst Inhalte löschen." : "Admin nicht eingeloggt.";
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
  renderPosts();
}

function adminLogin(event) {
  event.preventDefault();
  const code = document.querySelector("#admin-code").value.trim();
  const password = document.querySelector("#admin-password").value.trim();

  isAdmin = code === "ADMIN" && password === "AddictionRanks2026!";
  if (!isAdmin) alert("Admin-Zugang falsch.");
  event.target.reset();
  renderAdminState();
  renderPosts();
}

function deletePost(postId) {
  savePosts(posts().filter((post) => post.id !== postId));
  renderPosts();
}

function addComment(postId, body) {
  const session = Session.get();
  if (!session) return alert("Bitte zuerst einloggen.");

  const next = posts().map((post) => {
    if (post.id !== postId) return post;
    const comments = Array.isArray(post.comments) ? post.comments : [];
    return {
      ...post,
      comments: comments.concat({
        id: crypto.randomUUID(),
        body,
        authorCode: session.code,
        authorName: session.name,
        createdAt: Date.now(),
      }),
    };
  });

  savePosts(next);
  renderPosts();
}

function deleteComment(postId, commentId) {
  const next = posts().map((post) => {
    if (post.id !== postId) return post;
    return {
      ...post,
      comments: (post.comments || []).filter((comment) => comment.id !== commentId),
    };
  });

  savePosts(next);
  renderPosts();
}

function buildComment(postId, comment) {
  const row = document.createElement("div");
  row.className = "comment-row";

  const avatar = document.createElement("img");
  avatar.className = "avatar-sm";
  avatar.src = Users.byCode(comment.authorCode)?.photo || placeholderSvg(comment.authorName || "User");
  avatar.alt = `Avatar von ${comment.authorName}`;

  const info = document.createElement("p");
  info.className = "hint";
  info.innerHTML = `<a href="${profileUrl(comment.authorCode)}">${comment.authorName}</a>: ${comment.body}`;

  row.append(avatar, info);

  if (isAdmin) {
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Kommentar löschen";
    del.addEventListener("click", () => deleteComment(postId, comment.id));
    row.appendChild(del);
  }

  return row;
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

  if (isAdmin) {
    const delPost = document.createElement("button");
    delPost.type = "button";
    delPost.textContent = "Post löschen";
    delPost.addEventListener("click", () => deletePost(post.id));
    card.appendChild(delPost);
  }

  const commentsWrap = document.createElement("div");
  commentsWrap.className = "comments";
  commentsWrap.innerHTML = "<h4>Kommentare</h4>";

  const comments = Array.isArray(post.comments) ? post.comments : [];
  if (!comments.length) {
    commentsWrap.innerHTML += '<p class="empty">Noch keine Kommentare.</p>';
  } else {
    comments.forEach((comment) => commentsWrap.appendChild(buildComment(post.id, comment)));
  }

  const commentForm = document.createElement("form");
  commentForm.className = "comment-form";
  commentForm.innerHTML = `
    <label>Kommentar
      <input maxlength="200" required placeholder="Antwort schreiben..." />
    </label>
    <button type="submit">Kommentieren</button>
  `;

  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = commentForm.querySelector("input");
    const value = input.value.trim();
    if (!value) return;
    addComment(post.id, value);
  });

  commentsWrap.appendChild(commentForm);
  card.appendChild(commentsWrap);

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
document.querySelector("#admin-login-form").addEventListener("submit", adminLogin);

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
    comments: [],
    authorCode: session.code,
    authorName: session.name,
    createdAt: Date.now(),
  });

  savePosts(next);
  event.target.reset();
  renderPosts();
});

document.querySelector("#open-premium").addEventListener("click", () => premiumDialog.showModal());
document.querySelector("#close-premium").addEventListener("click", () => premiumDialog.close());

fillSelect(document.querySelector("#forum-category"), APP.categories.forum);
renderAuthState();
renderAdminState();
renderPosts();
