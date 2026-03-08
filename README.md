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
- Simples Code-Login
- Optionale PIN je Code (lokal gehasht mit SHA-256)
- Profilseiten pro User: `profile.html?code=DEINCODE`
- Profilbild + Profiltext
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

## Wichtiger Security-Hinweis
Dieses Projekt ist **rein clientseitig** (LocalStorage, kein Server, keine Datenbank, keine echte Auth-Absicherung).
Für ein wirklich sicheres Profilsystem brauchst du:
1. Backend mit echter User-Datenbank
2. Passwort-Hashing mit Argon2/Bcrypt + Salt
3. Sessions über HttpOnly Secure Cookies
4. Rollen-/Rechte-Checks serverseitig
5. Upload-Validierung + Malware-Scan + Größenlimits
6. Rate-Limiting + CSRF- und XSS-Schutz
