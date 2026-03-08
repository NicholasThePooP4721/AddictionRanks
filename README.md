# AddictionRanks

Simple Webseite mit Code-Login, Upload, mehreren Leaderboards, Forum und Profilseiten.

## Kategorien
- Alkohol
- Rauchen
- Screentime
- Glücksspiel

## Features
- Code-basiertes Login mit kurzem zufälligem Code
- User-Verzeichnis in LocalStorage
- Eigene Profil-Subpage pro User: `profile.html?code=DEINCODE`
- Profilbearbeitung (Name, About, Profilfoto) für das eigene Profil
- Foto-Uploads pro Kategorie
- Einmal-Vote-Regel: pro User nur 1 Vote pro Foto
- Zwei Leaderboards pro Kategorie:
  - Foto-Leaderboard
  - User-Leaderboard
- Separates Forum auf `forum.html` mit Login direkt auf der Forumseite

## Starten
```bash
cd /workspace/AddictionRanks
python3 -m http.server 8000
```

Danach im Browser öffnen:
- `http://localhost:8000` (Leaderboard)
- `http://localhost:8000/forum.html` (Forum)
- `http://localhost:8000/profile.html` (eigenes Profil, wenn eingeloggt)
