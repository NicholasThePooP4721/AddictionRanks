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
- Sehr simples Login: nur Code + Name
- Profilseiten pro User: `profile.html?code=DEINCODE`
- Profilbilder werden an vielen Stellen angezeigt (Leaderboard, User-Ranking, Forum, Profilübersicht)
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

## Subdomain-Idee (für echte Website)
Du willst statt `profile.html?code=ABC123` lieber sowas wie:
- `abc123.deinedomain.com`

Das geht **nicht gut mit rein statischen einzelnen Profil-Dateien** für jeden User.
Besser ist:
1. Wildcard-DNS setzen: `*.deinedomain.com` -> Server/IP
2. Wildcard-TLS-Zertifikat für `*.deinedomain.com`
3. Webserver-Routing (nginx/caddy) auf eine App
4. App liest Subdomain (`abc123`) und lädt Profil aus DB

### Warum nicht „eine Datei pro Profil“?
- schwer zu verwalten bei vielen Usern
- Updates/Deletes sind mühsam
- Sicherheits- und Rechteprüfung fehlen
- kein gutes Skalieren

## Security-Hinweis
Dieses Projekt bleibt ein clientseitiger Prototyp mit `localStorage`.
Für ein sicheres Profilsystem brauchst du serverseitige Auth, DB, sichere Sessions (HttpOnly Cookies), Upload-Validierung und Rate-Limits.
