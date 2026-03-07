# AddictionRanks

Simple Webseite mit Login-Code, Upload und mehreren Leaderboards.

## Kategorien
- Alkohol
- Rauchen
- Screentime
- Glücksspiel

## Features
- Einfaches Login-System mit zufälligem Kurzcode
- Mini-Profil (Anzeigename + kurzer Profiltext)
- Foto-Uploads pro Kategorie
- Einmal-Vote-Regel: pro Person nur ein Vote pro Foto
- Zwei Leaderboards je Kategorie:
  - Foto-Leaderboard
  - User-Leaderboard
- Separates simples Forum auf `forum.html`
- Browser-Speicherung via LocalStorage

## Starten
```bash
cd /workspace/AddictionRanks
python3 -m http.server 8000
```

Danach im Browser öffnen:
- `http://localhost:8000` (Leaderboard)
- `http://localhost:8000/forum.html` (Forum)
