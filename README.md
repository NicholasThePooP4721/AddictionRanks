# AddictionRanks

Terminal-Style Web-App (schwarzes UI + grüne Schrift) mit Leaderboards, Forum und Profilseiten.

## Kategorien
### Leaderboard
- Alkohol
- Rauchen
- Screentime
- Glücksspiel

### Forum
- Off topic
- Videospiele
- Selbsthilfe
- Selbstzerstörung

## Features
- Einfaches Login nur mit Code + Name
- Profilseiten pro User: `profile.html?code=DEINCODE`
- Profilbilder sind im ganzen System sichtbar (Session, Leaderboards, Forum, Profilverzeichnis)
- Forum mit optionalem Bild-Upload pro Beitrag
- Ein Vote pro User pro Bild

## Starten
```bash
cd /workspace/AddictionRanks
python3 -m http.server 8000
```

Dann öffnen:
- `http://localhost:8000`
- `http://localhost:8000/forum.html`
- `http://localhost:8000/profile.html`

## Subdomain-Idee für eine echte Webseite
Für eine richtige Produktion solltest du **keine einzelnen Profil-Dateien** erzeugen (z. B. `user123.html`).
Besser ist:
1. Eine dynamische Route wie `https://user123.deineseite.com` oder `https://deineseite.com/u/user123`
2. DNS-Wildcard auf `*.deineseite.com`
3. Webserver-Config (Nginx/Cloudflare/Vercel) auf dieselbe App
4. Backend lädt Profil aus Datenbank anhand Subdomain/Slug

### Warum nicht „jede Person = eigene Datei“?
- Schwer wartbar bei vielen Usern
- Unsicher, wenn Dateien direkt erzeugt werden
- Updates/Moderation sehr unpraktisch
- Schlechter für Skalierung

## Sicherheits-Hinweis
Diese Version ist komplett clientseitig (LocalStorage) und nur ein Prototyp.
Für ein echtes Profilsystem brauchst du ein Backend mit Auth, Datenbank, Upload-Prüfung und Session-Sicherheit.
