const entryTemplate = document.querySelector("#entry-template");
const boards = document.querySelector("#boards");

const authOut = document.querySelector("#auth-out");
const authIn = document.querySelector("#auth-in");
const loginForm = document.querySelector("#login-form");

function entries() {
  return Storage.loadArray(APP.keys.entries);
}

function saveEntries(next) {
  Storage.save(APP.keys.entries, next);
}

function score(entry) {
  return Object.values(entry.votes || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

function userCanVote(entry, code) {
  return code && (entry.votes?.[code] === undefined);
}

async function loginWithForm(event) {
  event.preventDefault();
  const code = document.querySelector("#login-code").value.trim().toUpperCase();
  const name = document.querySelector("#login-name").value.trim();
  const about = document.querySelector("#login-about").value.trim();
  const pin = document.querySelector("#login-pin").value.trim();
  if (!code || !name) return;

  const existing = Users.byCode(code);
  if (existing?.pinHash) {
    if (!pin) return alert("PIN benötigt für diesen Code.");
    const incoming = await hashPin(pin);
    if (incoming !== existing.pinHash) return alert("Falsche PIN.");
  }

  const user = await Users.upsert({ code, name, about, pin });
  Session.set({ code: user.code, name: user.name, about: user.about });
  loginForm.reset();
  renderAuth();
  renderBoards();
}

function renderAuth() {
  const session = Session.get();
  if (!session) {
    authOut.hidden = false;
    authIn.hidden = true;
    return;
  }

  authOut.hidden = true;
  authIn.hidden = false;
  document.querySelector("#session-line").textContent = `${session.name} [${session.code}] ${session.about ? "- " + session.about : ""}`;
  document.querySelector("#session-profile-link").href = profileUrl(session.code);
}

function castVote(entryId, value) {
  const session = Session.get();
  if (!session) return alert("Bitte einloggen.");

  const next = entries().map((entry) => {
    if (entry.id !== entryId) return entry;
    if (!userCanVote(entry, session.code)) return entry;
    return { ...entry, votes: { ...(entry.votes || {}), [session.code]: value } };
  });

  saveEntries(next);
  renderBoards();
}

function buildEntry(entry) {
  const node = entryTemplate.content.firstElementChild.cloneNode(true);
  const session = Session.get();

  node.querySelector(".entry-photo").src = entry.photo;
  node.querySelector(".entry-title").textContent = `${entry.title} (${entry.category})`;

  const owner = node.querySelector(".entry-owner");
  owner.textContent = "von ";
  const link = document.createElement("a");
  link.href = profileUrl(entry.ownerCode);
  link.textContent = entry.ownerName;
  owner.appendChild(link);

  node.querySelector(".entry-score").textContent = `Score: ${score(entry)}`;
  node.querySelector(".vote-info").textContent = userCanVote(entry, session?.code)
    ? "Noch nicht gevotet"
    : "Vote schon gesetzt";

  node.querySelector(".vote-up").addEventListener("click", () => castVote(entry.id, 1));
  node.querySelector(".vote-down").addEventListener("click", () => castVote(entry.id, -1));
  return node;
}

function renderCategory(category) {
  const wrap = document.createElement("section");
  wrap.className = "category-block";
  const data = entries()
    .filter((entry) => entry.category === category)
    .sort((a, b) => score(b) - score(a));

  wrap.innerHTML = `<h3>${category}</h3><h4>Foto-Leaderboard</h4>`;
  const photoList = document.createElement("div");
  photoList.className = "leaderboard";

  if (!data.length) {
    photoList.innerHTML = '<p class="empty">Keine Einträge</p>';
  } else {
    data.forEach((entry) => photoList.appendChild(buildEntry(entry)));
  }
  wrap.appendChild(photoList);

  const usersMap = new Map();
  data.forEach((entry) => {
    const row = usersMap.get(entry.ownerCode) || { code: entry.ownerCode, name: entry.ownerName, score: 0, posts: 0 };
    row.score += score(entry);
    row.posts += 1;
    usersMap.set(entry.ownerCode, row);
  });

  const userBox = document.createElement("div");
  userBox.className = "simple-list";
  wrap.appendChild(Object.assign(document.createElement("h4"), { textContent: "User-Leaderboard" }));

  const rows = [...usersMap.values()].sort((a, b) => b.score - a.score);
  if (!rows.length) userBox.innerHTML = '<p class="empty">Keine User</p>';
  rows.forEach((row, idx) => {
    const p = document.createElement("p");
    const link = document.createElement("a");
    link.href = profileUrl(row.code);
    link.textContent = row.name;
    p.textContent = `${idx + 1}. `;
    p.appendChild(link);
    p.append(` - Score ${row.score}, Posts ${row.posts}`);
    userBox.appendChild(p);
  });
  wrap.appendChild(userBox);
  return wrap;
}

function renderBoards() {
  boards.innerHTML = "";
  APP.categories.leaderboard.forEach((category) => boards.appendChild(renderCategory(category)));
}

document.querySelector("#generate-code").addEventListener("click", () => {
  const code = randomCode();
  document.querySelector("#generated-code").textContent = `Code: ${code}`;
  document.querySelector("#login-code").value = code;
});

document.querySelector("#logout").addEventListener("click", () => {
  Session.clear();
  renderAuth();
  renderBoards();
});

loginForm.addEventListener("submit", loginWithForm);

document.querySelector("#entry-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const session = Session.get();
  if (!session) return alert("Bitte einloggen.");

  const title = document.querySelector("#post-name").value.trim();
  const category = document.querySelector("#entry-category").value;
  const file = document.querySelector("#entry-photo").files[0];
  if (!title || !category || !file) return;

  const photo = await fileToDataUrl(file);
  const next = entries();
  next.push({
    id: crypto.randomUUID(),
    title,
    category,
    photo,
    ownerCode: session.code,
    ownerName: session.name,
    votes: {},
  });

  saveEntries(next);
  event.target.reset();
  renderBoards();
});

fillSelect(document.querySelector("#entry-category"), APP.categories.leaderboard);
renderAuth();
renderBoards();
