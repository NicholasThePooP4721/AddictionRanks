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
  return code && entry.votes?.[code] === undefined;
}

function loginWithForm(event) {
  event.preventDefault();
  const code = document.querySelector("#login-code").value.trim().toUpperCase();
  const name = document.querySelector("#login-name").value.trim();
  const about = document.querySelector("#login-about").value.trim();
  if (!code || !name) return;

  const user = Users.upsert({ code, name, about });
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

  const user = Users.byCode(session.code);
  authOut.hidden = true;
  authIn.hidden = false;
  document.querySelector("#session-line").textContent = `${session.name} [${session.code}] ${session.about ? "- " + session.about : ""}`;
  document.querySelector("#session-profile-link").href = profileUrl(session.code);
  document.querySelector("#session-avatar").src = user?.photo || placeholderSvg("Avatar");
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

function ownerRow(ownerCode, ownerName) {
  const row = document.createElement("div");
  row.className = "owner-row";

  const user = Users.byCode(ownerCode);
  const avatar = document.createElement("img");
  avatar.className = "avatar-sm";
  avatar.src = user?.photo || placeholderSvg(ownerName || "User");
  avatar.alt = `Avatar von ${ownerName}`;

  const link = document.createElement("a");
  link.href = profileUrl(ownerCode);
  link.textContent = ownerName;

  const text = document.createElement("span");
  text.textContent = "von ";

  row.append(avatar, text, link);
  return row;
}

function buildEntry(entry) {
  const node = entryTemplate.content.firstElementChild.cloneNode(true);
  const session = Session.get();

  node.querySelector(".entry-photo").src = entry.photo;
  node.querySelector(".entry-title").textContent = `${entry.title} (${entry.category})`;

  const owner = node.querySelector(".entry-owner");
  owner.replaceWith(ownerRow(entry.ownerCode, entry.ownerName));

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
    const line = document.createElement("div");
    line.className = "owner-row";

    const avatar = document.createElement("img");
    avatar.className = "avatar-sm";
    avatar.src = Users.byCode(row.code)?.photo || placeholderSvg(row.name || "User");
    avatar.alt = `Avatar von ${row.name}`;

    const link = document.createElement("a");
    link.href = profileUrl(row.code);
    link.textContent = `${idx + 1}. ${row.name}`;

    const meta = document.createElement("span");
    meta.textContent = ` - Score ${row.score}, Posts ${row.posts}`;

    line.append(avatar, link, meta);
    userBox.appendChild(line);
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
