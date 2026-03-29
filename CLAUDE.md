# Session-Kontext: super-b

## Projekt
**Super-B Epsilon BMS Web Reader** – eine einzelne HTML-Seite, die per Web Bluetooth (BLE) mit dem Super-B Epsilon Batterie-Management-System kommuniziert. Optimiert für die iOS-App **Bluefy**.

## Live-URL
https://umhh.github.io/super-b/superb_epsilon_bms.html

## Repo
https://github.com/umhh/super-b

## Aktueller Stand
- **Version:** v19
- **Branch `main`** ist aktuell und wird über GitHub Pages ausgeliefert
- **Dateien:** `superb_epsilon_bms.html` (21 KB, alles inline), `README.md`
- `app.js` wurde entfernt (war ab v15 nicht mehr in Verwendung)

## Entwicklungs-Workflow
1. Änderungen auf Feature-Branch entwickeln
2. Commit & Push auf diesen Branch
3. Nach jeder abgeschlossenen Anpassung den Nutzer fragen, ob PR erstellt und in `main` gemergt (squash) werden soll – niemals automatisch mergen

## Versionshinweise
- Versionsnummer im Footer und im JS (`v18 geladen` etc.) bei jeder Änderung erhöhen

## Wichtige technische Hinweise (Bluefy-Kompatibilität)
- Kein `async/await` – nur Promise-Chains
- Kein `30_000` (numeric separators) – nur `30000`
- Kein `'use strict'`
- Keine Box-Drawing-Zeichen in Kommentaren
- `acceptAllDevices: true` im BLE-Picker
- BLE-UUID als `BLE_UUID` (nicht `UUID`, Konflikt mit Bluefy)
- JS muss inline im HTML sein (kein externes Script – CDN-Caching-Problem)

## Versionshistorie (Kurzfassung)
- v19: PIN-Eingabefeld vor dem BLE-Connect
- v18: Versionsnummer erhöht
- v17: Größere fette Build-Info mit Zeit im Footer
- v16: acceptAllDevices für BLE-Gerätepicker
- v15: JS wieder inline (CDN-Caching-Fix)
- v12–v14: Experimente mit externem app.js (wieder rückgängig)
- v9: async/await → Promise-Chains
- v1–v8: Initiale Entwicklung und Bluefy-Debugging
