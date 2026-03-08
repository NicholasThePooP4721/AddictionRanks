const profileView = document.querySelector("#profile-view");
const profilesGrid = document.querySelector("#profiles-grid");
const editHint = document.querySelector("#edit-hint");
const profileForm = document.querySelector("#profile-form");

function viewedCode() {
  const urlCode = new URLSearchParams(window.location.search).get("code");
  const session = Session.get();
  return urlCode || session?.code || "";
}

function renderProfilesGrid() {
  const users = Users.all();
  profilesGrid.innerHTML = "";
  if (!users.length) {
    profilesGrid.innerHTML = '<p class="empty">Noch keine Profile vorhanden.</p>';
    return;
  }

  users.forEach((user) => {
    const card = document.createElement("a");
    card.className = "mini-profile";
    card.href = profileUrl(user.code);
    card.innerHTML = `
      <img class="mini-avatar large" src="${user.photo || placeholderSvg("Profil")}" alt="Profilbild von ${user.name}" />
      <span>${user.name}</span>
    `;
    profilesGrid.appendChild(card);
  });
}

function renderProfile() {
  const code = viewedCode();
  const user = Users.byCode(code);
  const session = Session.get();
  const own = Boolean(user && session && session.code === user.code);

  if (!user) {
    profileView.innerHTML = '<p class="empty">Profil nicht gefunden.</p>';
    editHint.textContent = "Kein Profil geladen.";
    [...profileForm.elements].forEach((el) => (el.disabled = true));
    return;
  }

  profileView.innerHTML = `
    <article class="profile-card">
      <img class="profile-photo" src="${user.photo || placeholderSvg("Profil")}" alt="Profilbild von ${user.name}" />
      <h3>${user.name}</h3>
      <p class="mono">Code: ${user.code}</p>
      <p>${user.about || "Kein Text gesetzt."}</p>
      <p class="hint">Pseudo-Subdomain lokal: /u/${user.code} (in echt per Server-Routing)</p>
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

  const user = Users.upsert({ code, name: name || existing.name, about, photo });
  Session.set({ code: user.code, name: user.name, about: user.about });
  event.target.reset();
  renderProfile();
  renderProfilesGrid();
});

renderProfile();
renderProfilesGrid();
