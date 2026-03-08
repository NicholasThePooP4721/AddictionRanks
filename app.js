const APP = {
  keys: {
    session: "addictionranks.session",
    users: "addictionranks.users",
    entries: "addictionranks.entries",
    forum: "addictionranks.forum.posts",
  },
  categories: {
    leaderboard: ["Alkohol", "Rauchen", "Screentime", "Glücksspiel"],
    forum: ["Off topic", "Videospiele", "Selbsthilfe", "Selbstzerstörung"],
  },
};

const Storage = {
  loadArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function profileUrl(code) {
  return `profile.html?code=${encodeURIComponent(code)}`;
}

function placeholderSvg(label = "Kein Bild") {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23090909'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2333ff66' font-size='16'%3E${encodeURIComponent(label)}%3C/text%3E%3C/svg%3E`;
}

const Users = {
  all() {
    return Storage.loadArray(APP.keys.users);
  },
  byCode(code) {
    return this.all().find((user) => user.code === code) || null;
  },
  saveAll(users) {
    Storage.save(APP.keys.users, users);
  },
  upsert({ code, name, about = "", photo = "" }) {
    const users = this.all();
    const index = users.findIndex((u) => u.code === code);
    const existing = index >= 0 ? users[index] : null;

    const next = {
      code,
      name: name || existing?.name || "User",
      about,
      photo: photo || existing?.photo || "",
    };

    if (index >= 0) users[index] = next;
    else users.push(next);
    this.saveAll(users);
    return next;
  },
};

const Session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(APP.keys.session) || "null");
    } catch {
      return null;
    }
  },
  set(data) {
    Storage.save(APP.keys.session, data);
  },
  clear() {
    localStorage.removeItem(APP.keys.session);
  },
};

function fillSelect(select, categories) {
  select.innerHTML = '<option value="">Bitte wählen</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
