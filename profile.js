const USERS_KEY = "addictionranks.users";
const SESSION_KEY = "addictionranks.session";

const profileHint = document.querySelector("#profile-view-hint");
const profileView = document.querySelector("#profile-view");
const profileForm = document.querySelector("#profile-form");

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
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

function getCodeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
}

function findUser(code) {
  return loadUsers().find((user) => user.code === code) || null;
}

function renderProfile(user, isOwnProfile) {
  profileView.innerHTML = "";

  if (!user) {
    profileView.innerHTML = '<p class="empty">Kein Profil gefunden.</p>';
    return;
  }

  const card = document.createElement("article");
  card.className = "profile-card";

  const photo = document.createElement("img");
  photo.className = "profile-photo";
  photo.alt = `Profilfoto von ${user.name}`;
  photo.src = user.photo || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Crect width='100%25' height='100%25' fill='%23efefef'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23777' font-size='18'%3EKein Profilfoto%3C/text%3E%3C/svg%3E";

  const name = document.createElement("h3");
  name.textContent = user.name;

  const code = document.createElement("p");
  code.textContent = `Code: ${user.code}`;

  const about = document.createElement("p");
  about.textContent = `Über mich: ${user.about || "-"}`;

  card.appendChild(photo);
  card.appendChild(name);
  card.appendChild(code);
  card.appendChild(about);
  profileView.appendChild(card);

  profileHint.textContent = isOwnProfile
    ? "Das ist dein eigenes Profil. Du kannst es unten bearbeiten."
    : "Du siehst ein öffentliches User-Profil.";

  profileForm.querySelector("button").disabled = !isOwnProfile;
  document.querySelector("#edit-name").disabled = !isOwnProfile;
  document.querySelector("#edit-about").disabled = !isOwnProfile;
  document.querySelector("#edit-photo").disabled = !isOwnProfile;

  if (isOwnProfile) {
    document.querySelector("#edit-name").value = user.name;
    document.querySelector("#edit-about").value = user.about || "";
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = getSession();
  const queryCode = getCodeFromQuery() || session?.code;
  if (!session || session.code !== queryCode) {
    alert("Du kannst nur dein eigenes Profil bearbeiten.");
    return;
  }

  const users = loadUsers();
  const idx = users.findIndex((u) => u.code === session.code);
  if (idx === -1) {
    alert("User nicht gefunden.");
    return;
  }

  const nextName = document.querySelector("#edit-name").value.trim();
  const nextAbout = document.querySelector("#edit-about").value.trim();
  const file = document.querySelector("#edit-photo").files[0];

  let nextPhoto = users[idx].photo || "";
  if (file) nextPhoto = await fileToDataUrl(file);

  users[idx] = { ...users[idx], name: nextName || users[idx].name, about: nextAbout, photo: nextPhoto };
  saveUsers(users);
  setSession({ ...session, name: users[idx].name, about: users[idx].about });

  renderProfile(users[idx], true);
  profileForm.reset();
});

(function init() {
  const session = getSession();
  const code = getCodeFromQuery() || session?.code;
  const user = code ? findUser(code) : null;
  const isOwnProfile = Boolean(session && user && session.code === user.code);

  if (!code) profileHint.textContent = "Nicht eingeloggt und kein Code in URL. Öffne z. B. profile.html?code=AB12CD.";
  renderProfile(user, isOwnProfile);
})();
