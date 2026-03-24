# CLAUDE.md – Super-B Epsilon BMS Web Reader

## Projekt-Übersicht
Browser-App zum Auslesen des BMS (Battery Management System) der **Super-B Epsilon** Lithiumbatterie über Bluetooth Low Energy (BLE) – direkt im Browser, ohne Installation.

**Live-App:** https://umhh.github.io/super-b/superb_epsilon_bms.html
**Repository:** https://github.com/umhh/super-b

## Dateien
- `superb_epsilon_bms.html` – Haupt-App (HTML + eingebettetes JS)
- `app.js` – Externes JS (aktuell nicht aktiv genutzt, inline ist stabiler)
- `README.md` – Projektdokumentation

## Wichtige technische Entscheidungen
- **Kein async/await** – Reines ES5 mit Promise-Chaining (Bluefy auf iOS unterstützt kein async/await zuverlässig)
- **Kein externes app.js** – JS ist inline in der HTML-Datei, da Bluefy CDN-Caching-Probleme verursacht
- **acceptAllDevices: true** – Zeigt alle BLE-Geräte im Picker an (seit v16)
- **Kein Framework, keine externen Abhängigkeiten**

## BLE-Protokoll
### BMS V1
- Passive Notify-Characteristic
- 20-Byte-Frames: SoC, SoH, Spannung, Strom, Status-Byte, Restlaufzeit

### BMS V2
- Request/Response: Query-Befehl `0x21 0x54 0x00`
- 24-Byte-Frames in zwei Teilen (Frame 0 und Frame 2)
- Zusätzlich: Ladezyklen
- Polling alle 30 Sekunden

App erkennt beim Verbinden automatisch V1 oder V2.

## Entwicklungs-Branch
- Aktiver Branch: `claude/show-version-number-Io6WN`
- Basis: `master` / `main`

## Ziel-Plattform
- **Bluefy** – Web BLE Browser (iOS/iPadOS)
- Safari unterstützt Web Bluetooth API nicht → Bluefy notwendig

## Offene Aufgaben / letzter Stand
- Versionsnummer in der App anzeigen (aktueller Feature-Branch)
