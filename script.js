const CATEGORIES = ["Alkohol", "Rauchen", "Screentime", "Glücksspiel"];
const ENTRY_KEY = "addictionranks.entries";
const SESSION_KEY = "addictionranks.session";
const USERS_KEY = "addictionranks.users";

const form = document.querySelector("#entry-form");
const categorySelect = document.querySelector("#addiction");
const leaderboardsRoot = document.querySelector("#leaderboards");
const photoTemplate = document.querySelector("#photo-entry-template");

const generateCodeBtn = document.querySelector("#generate-code");
const generatedCodeText = document.querySelector("#generated-code");
const activateCodeForm = document.querySelector("#activate-code-form");
const logoutBtn = document.querySelector("#logout");
const loggedOutBox = document.querySelector("#auth-logged-out");
const loggedInBox = document.querySelector("#auth-logged-in");

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function loadJsonArray(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadEntries() {
  return loadJsonArray(ENTRY_KEY);
}

function saveEntries(entries) {
  localStorage.setItem(ENTRY_KEY, JSON.stringify(entries));
}

function loadUsers() {
  return loadJsonArray(USERS_KEY);
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUserByCode(code) {
  return loadUsers().find((user) => user.code === code) || null;
}

function upsertUser(userInput) {
  const users = loadUsers();
  const index = users.findIndex((user) => user.code === userInput.code);
  const nextUser = {
    code: userInput.code,
    name: userInput.name,
    about: userInput.about || "",
    photo: userInput.photo || users[index]?.photo || "",
  };

  if (index === -1) {
    users.push(nextUser);
  } else {
    users[index] = nextUser;
  }

  saveUsers(users);
  return nextUser;
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

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function scoreOf(entry) {
  return Object.values(entry.votes || {}).reduce((sum, val) => sum + Number(val || 0), 0);
}

function sortByScore(entries) {
  return [...entries].sort((a, b) => scoreOf(b) - scoreOf(a));
}

function fillCategorySelect(selectElement) {
  selectElement.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = "Bitte wählen";
  selectElement.appendChild(first);

  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  });
}

function profileUrl(code) {
  return `profile.html?code=${encodeURIComponent(code)}`;
}

function renderAuth() {
  const session = getSession();

  if (!session) {
    loggedOutBox.hidden = false;
    loggedInBox.hidden = true;
    return;
  }

  loggedOutBox.hidden = true;
  loggedInBox.hidden = false;
  document.querySelector("#session-code").textContent = session.code;
  document.querySelector("#session-name").textContent = session.name;
  document.querySelector("#session-about").textContent = session.about || "-";
  document.querySelector("#my-profile-link").href = profileUrl(session.code);
}

function vote(entryId, value) {
  const session = getSession();
  if (!session) {
    alert("Bitte zuerst einloggen.");
    return;
  }

  const entries = loadEntries();
  const updated = entries.map((entry) => {
    if (entry.id !== entryId) return entry;

    const votes = entry.votes || {};
    if (votes[session.code] !== undefined) {
      alert("Du hast hier bereits gevotet.");
      return entry;
    }

    return { ...entry, votes: { ...votes, [session.code]: value } };
  });

  saveEntries(updated);
  render(updated);
}

function renderCategorySection(entries, category) {
  const section = document.createElement("section");
  section.className = "category-block";

  const title = document.createElement("h3");
  title.textContent = category;
  section.appendChild(title);

  const photosTitle = document.createElement("h4");
  photosTitle.textContent = "Foto-Leaderboard";
  section.appendChild(photosTitle);

  const photoList = document.createElement("div");
  photoList.className = "leaderboard";
  const categoryEntries = sortByScore(entries.filter((entry) => entry.category === category));

  if (categoryEntries.length === 0) {
    photoList.innerHTML = '<p class="empty">Keine Fotos in dieser Kategorie.</p>';
  } else {
    categoryEntries.forEach((entry) => {
      const node = photoTemplate.content.firstElementChild.cloneNode(true);
      const session = getSession();
      const alreadyVoted = entry.votes?.[session?.code] !== undefined;

      node.querySelector(".entry-photo").src = entry.photo;
      node.querySelector(".entry-name").textContent = `${entry.username} (${entry.category})`;

      const profileP = node.querySelector(".entry-profile");
      const link = document.createElement("a");
      link.href = profileUrl(entry.ownerCode);
      link.textContent = entry.ownerName;
      profileP.textContent = "Profil: ";
      profileP.appendChild(link);
      if (entry.ownerAbout) profileP.append(` - ${entry.ownerAbout}`);

      node.querySelector(".entry-score").textContent = `Score: ${scoreOf(entry)}`;
      node.querySelector(".vote-info").textContent = alreadyVoted
        ? "Du hast bereits gevotet."
        : "Noch kein Vote von dir.";

      node.querySelector(".vote-up").addEventListener("click", () => vote(entry.id, 1));
      node.querySelector(".vote-down").addEventListener("click", () => vote(entry.id, -1));
      photoList.appendChild(node);
    });
  }

  section.appendChild(photoList);

  const usersTitle = document.createElement("h4");
  usersTitle.textContent = "User-Leaderboard";
  section.appendChild(usersTitle);

  const userBoard = document.createElement("div");
  userBoard.className = "simple-list";

  const userMap = new Map();
  categoryEntries.forEach((entry) => {
    const current = userMap.get(entry.ownerCode) || {
      code: entry.ownerCode,
      name: entry.ownerName,
      about: entry.ownerAbout || "",
      score: 0,
      posts: 0,
    };
    current.score += scoreOf(entry);
    current.posts += 1;
    userMap.set(entry.ownerCode, current);
  });

  const userRows = [...userMap.values()].sort((a, b) => b.score - a.score);
  if (userRows.length === 0) {
    userBoard.innerHTML = '<p class="empty">Noch keine User in dieser Kategorie.</p>';
  } else {
    userRows.forEach((row, index) => {
      const p = document.createElement("p");
      const link = document.createElement("a");
      link.href = profileUrl(row.code);
      link.textContent = row.name;
      p.textContent = `${index + 1}. `;
      p.appendChild(link);
      p.append(` (${row.about || "kein Profiltext"}) - Score ${row.score}, Posts ${row.posts}`);
      userBoard.appendChild(p);
    });
  }

  section.appendChild(userBoard);
  return section;
}

function render(entries) {
  leaderboardsRoot.innerHTML = "";
  CATEGORIES.forEach((category) => leaderboardsRoot.appendChild(renderCategorySection(entries, category)));
}

generateCodeBtn.addEventListener("click", () => {
  const code = randomCode();
  generatedCodeText.textContent = `Dein neuer Code: ${code}`;
  document.querySelector("#login-code").value = code;
});

activateCodeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = document.querySelector("#login-code").value.trim().toUpperCase();
  const name = document.querySelector("#profile-name").value.trim();
  const about = document.querySelector("#profile-about").value.trim();
  if (!code || !name) return;

  const existing = getUserByCode(code);
  const user = upsertUser({ code, name: name || existing?.name || "User", about });
  setSession({ code: user.code, name: user.name, about: user.about });

  renderAuth();
  render(loadEntries());
  activateCodeForm.reset();
  generatedCodeText.textContent = "";
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  renderAuth();
  render(loadEntries());
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = getSession();
  if (!session) return alert("Bitte zuerst einloggen.");

  const username = document.querySelector("#username").value.trim();
  const category = categorySelect.value;
  const file = document.querySelector("#photo").files[0];
  if (!username || !category || !file) return;

  const photo = await fileToDataUrl(file);
  const entries = loadEntries();
  entries.push({
    id: crypto.randomUUID(),
    username,
    category,
    ownerCode: session.code,
    ownerName: session.name,
    ownerAbout: session.about,
    photo,
    votes: {},
  });

  saveEntries(entries);
  render(entries);
  form.reset();
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

fillCategorySelect(categorySelect);
renderAuth();
render(loadEntries());
