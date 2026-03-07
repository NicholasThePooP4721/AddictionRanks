const STORAGE_KEY = "addictionranks.entries";

const form = document.querySelector("#entry-form");
const leaderboard = document.querySelector("#leaderboard");
const template = document.querySelector("#entry-template");

function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => b.score - a.score);
}

function render(entries) {
  leaderboard.innerHTML = "";

  if (entries.length === 0) {
    leaderboard.innerHTML = '<p class="empty">Noch keine Einträge vorhanden.</p>';
    return;
  }

  sortEntries(entries).forEach((entry) => {
    const node = template.content.firstElementChild.cloneNode(true);

    node.querySelector(".entry-photo").src = entry.photo;
    node.querySelector(".entry-name").textContent = entry.username;
    node.querySelector(".entry-addiction").textContent = `Sucht: ${entry.addiction}`;
    node.querySelector(".entry-score").textContent = `Score: ${entry.score}`;

    node.querySelector(".vote-up").addEventListener("click", () => {
      updateScore(entry.id, 1);
    });

    node.querySelector(".vote-down").addEventListener("click", () => {
      updateScore(entry.id, -1);
    });

    leaderboard.appendChild(node);
  });
}

function updateScore(id, delta) {
  const entries = loadEntries();
  const nextEntries = entries.map((entry) =>
    entry.id === id ? { ...entry, score: entry.score + delta } : entry,
  );
  saveEntries(nextEntries);
  render(nextEntries);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#username").value.trim();
  const addiction = document.querySelector("#addiction").value;
  const file = document.querySelector("#photo").files[0];

  if (!username || !addiction || !file) return;

  const photo = await fileToDataUrl(file);
  const entries = loadEntries();

  entries.push({
    id: crypto.randomUUID(),
    username,
    addiction,
    photo,
    score: 0,
  });

  saveEntries(entries);
  render(entries);
  form.reset();
});

render(loadEntries());
