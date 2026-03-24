# Super-B Epsilon BMS Web Reader

Browser-App zum Auslesen des BMS (Battery Management System) der **Super-B Epsilon** Lithiumbatterie über Bluetooth Low Energy (BLE) – direkt im Browser, ohne Installation.

**Live-App:** [umhh.github.io/super-b/superb_epsilon_bms.html](https://umhh.github.io/super-b/superb_epsilon_bms.html)

---

## Screenshot

<!-- Screenshot hier einfügen -->

---

## Funktionen

- **State of Charge (SoC)** – Ladestand in % mit farbigem Kreisdiagramm (grün / gelb / rot)
- **State of Health (SoH)** – Akkugesundheit in %
- **Spannung** – Batteriespannung in Volt
- **Strom** – Lade- oder Entladestrom in Ampere
- **Leistung** – Aktuelle Leistung in Watt
- **Restlaufzeit** – Geschätzte Laufzeit bei aktuellem Verbrauch (Stunden und Minuten)
- **Ladezyklen** – Anzahl der bisherigen Ladezyklen (nur BMS V2)
- **Status-Badges** – Anzeige von Laden/Entladen, Fehler und Balancer-Status
- Automatische Protokoll-Erkennung (BMS V1 und V2)
- Daten-Polling alle 30 Sekunden (V2)

---

## Voraussetzungen

| Anforderung | Details |
|---|---|
| Browser | [Bluefy – Web BLE Browser](https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055) (iOS / iPadOS) |
| Batterie | Super-B Epsilon Lithiumbatterie mit BLE-fähigem BMS |
| Betriebssystem | iOS / iPadOS (Safari unterstützt kein Web Bluetooth) |

> **Hinweis:** Safari und andere Standard-Browser auf iOS unterstützen die Web Bluetooth API nicht. Die App zeigt in diesem Fall automatisch einen Hinweis mit Link zur Bluefy-App im App Store.

---

## Bedienung

1. Seite in **Bluefy** öffnen: `https://umhh.github.io/super-b/superb_epsilon_bms.html`
2. Batterie einschalten und BLE-Verbindung sicherstellen
3. Auf **Verbinden** tippen
4. Im erscheinenden Bluetooth-Dialog das Super-B Epsilon Gerät auswählen
5. Die App erkennt automatisch die BMS-Version und zeigt die Live-Daten an
6. Zum Trennen auf **Trennen** tippen

---

## Unterstützte Protokolle

### BMS V1
- Passive Benachrichtigungen über eine Notify-Characteristic
- 20-Byte-Frames: SoC, SoH, Spannung, Strom, Status-Byte (Fehler, Balancer), Restlaufzeit
- Keine Ladezyklen-Anzeige

### BMS V2
- Aktives Request/Response-Protokoll (Query-Befehl `0x21 0x54 0x00`)
- 24-Byte-Frames in zwei Teilen (Frame 0 und Frame 2)
- Zusätzlich: Ladezyklen
- Polling alle 30 Sekunden

Die App prüft beim Verbinden zuerst auf V2, fällt bei Bedarf auf V1 zurück.

---

## Technische Hinweise

- **Web Bluetooth API** – Läuft vollständig im Browser, keine Server-Komponente
- **Hosting** – Statische HTML-Datei auf GitHub Pages
- **JavaScript** – Reines ES5 mit Promise-Chaining (kein `async/await`), für maximale Kompatibilität mit Bluefy auf iOS
- **UI** – Dark-Mode-Design, optimiert für iPhone und iPad (Safe Area, Touch-Targets)
- **Kein Framework** – Keine externen Abhängigkeiten, kein Build-Prozess

---

## Repository

[github.com/umhh/super-b](https://github.com/umhh/super-b)
