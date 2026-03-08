const profileView = document.querySelector("#profile-view");
const profileList = document.querySelector("#profile-list");
const editHint = document.querySelector("#edit-hint");
const profileForm = document.querySelector("#profile-form");
const profileLoginForm = document.querySelector("#profile-login-form");

function viewedCode() {
  const urlCode = new URLSearchParams(window.location.search).get("code");
  const session = Session.get();
  return (urlCode || session?.code || "").toUpperCase();
}

function syncUserReferences(user) {
  const nextEntries = Storage.loadArray(APP.keys.entries).map((entry) =>
    entry.ownerCode === user.code ? { ...entry, ownerName: user.name } : entry,
  );
  Storage.save(APP.keys.entries, nextEntries);

  const nextPosts = Storage.loadArray(APP.keys.forum).map((post) => {
    const changedPost = post.authorCode === user.code ? { ...post, authorName: user.name } : post;
    const nextComments = (changedPost.comments || []).map((comment) =>
      comment.authorCode === user.code ? { ...comment, authorName: user.name } : comment,
    );
    return { ...changedPost, comments: nextComments };
  });
  Storage.save(APP.keys.forum, nextPosts);
}

function renderDirectory() {
  profileList.innerHTML = "";
  const users = Users.all().sort((a, b) => a.name.localeCompare(b.name));
  if (!users.length) {
    profileList.innerHTML = '<p class="empty">Noch keine Profile.</p>';
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("div");
    row.className = "owner-row";

    const avatar = document.createElement("img");
    avatar.className = "avatar-sm";
    avatar.src = user.photo || placeholderSvg(user.name || "User");
    avatar.alt = `Avatar von ${user.name}`;

    const link = document.createElement("a");
    link.href = profileUrl(user.code);
    link.textContent = `${user.name} [${user.code}]`;

    row.append(avatar, link);
    profileList.appendChild(row);
  });
}

function renderProfile() {
  const code = viewedCode();
  const user = Users.byCode(code);
  const session = Session.get();
  const own = Boolean(user && session && session.code === user.code);

  if (!user) {
    profileView.innerHTML = '<p class="empty">Profil nicht gefunden. Nutze oben den Profil Login.</p>';
    editHint.textContent = "Kein Profil geladen.";
    [...profileForm.elements].forEach((el) => (el.disabled = true));
    return;
  }

  profileView.innerHTML = `
    <article class="profile-card">
      <img class="profile-photo" src="${user.photo || placeholderSvg(user.name || "User")}" alt="Profilbild von ${user.name}" />
      <h3>${user.name}</h3>
      <p class="mono">Code: ${user.code}</p>
      <p>${user.about || "Kein Text gesetzt."}</p>
    </article>
  `;

  [...profileForm.elements].forEach((el) => (el.disabled = !own));
  if (!own) {
    editHint.textContent = "Nur im eigenen Profil editierbar.";
    return;
  }

  editHint.textContent = "Du bearbeitest dein eigenes Profil.";
  document.querySelector("#edit-name").value = user.name;
  document.querySelector("#edit-about").value = user.about || "";
}

profileLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = document.querySelector("#profile-code").value.trim().toUpperCase();
  const name = document.querySelector("#profile-name").value.trim();
  if (!code || !name) return;

  const existing = Users.byCode(code);
  const user = Users.upsert({
    code,
    name,
    about: existing?.about || "",
    photo: existing?.photo || "",
  });

  Session.set({ code: user.code, name: user.name, about: user.about });
  window.location.search = `?code=${encodeURIComponent(user.code)}`;
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = Session.get();
  const code = viewedCode();
  if (!session || session.code !== code) return alert("Nur eigenes Profil editierbar.");

  const existing = Users.byCode(code);
  if (!existing) return;

  const name = document.querySelector("#edit-name").value.trim();
  const about = document.querySelector("#edit-about").value.trim();
  const file = document.querySelector("#edit-photo").files[0];
  const photo = file ? await fileToDataUrl(file) : existing.photo;

  const user = Users.upsert({
    code,
    name: name || existing.name,
    about,
    photo,
  });

  syncUserReferences(user);
  Session.set({ code: user.code, name: user.name, about: user.about });

  event.target.reset();
  renderProfile();
  renderDirectory();
});

renderProfile();
renderDirectory();
