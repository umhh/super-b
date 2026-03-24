# MCP Server Setup – Sitzungsnotizen
_Datum: 2026-03-24_

## Ziel
Eigenen MCP-Server auf Raspberry Pi / NAS betreiben, damit Claude Code Web
(Bluefy / iPad) Zugriff auf lokale Dateien und Shell-Befehle bekommt.

## Gewählte Optionen
| Schritt | Option | Beschreibung |
|---------|--------|--------------|
| 1 – Plattform | **B** | Raspberry Pi / NAS zu Hause |
| 2 – Software | **B** | `mcp-server-shell` (Dateien + Shell) |
| 3 – Tunnel | **A** | Cloudflare Tunnel (`cloudflared`) |
| 4 – Auth | **A** | Bearer Token im Header |

## Offene Fragen
- [ ] Eigene Domain vorhanden, oder `trycloudflare.com`-URL verwenden?
- [ ] Pi-Architektur: arm64 (Pi 4/5) oder armhf (Pi 3)?
- [ ] Welche Verzeichnisse soll der Server freigeben?
- [ ] Node.js bereits installiert?

## Nächste Schritte (Reihenfolge)

### 1. Node.js auf Pi prüfen / installieren
```bash
node --version   # >= 18 nötig
# Falls fehlt:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. MCP Server installieren
```bash
npm install -g @modelcontextprotocol/server-filesystem
npm install -g mcp-server-shell
```

Konfiguration `~/mcp-config.json`:
```json
{
  "roots": ["/home/pi/projekte"],
  "allowShell": true,
  "token": "HIER-EIN-GEHEIMES-TOKEN"
}
```

### 3. cloudflared installieren
```bash
# Pi 4/5 (arm64):
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared-linux-arm64.deb

# Pi 3 (armhf):
# cloudflared-linux-arm.deb
```

Schnelltest ohne Account:
```bash
cloudflared tunnel --url http://localhost:3333
```

Mit eigenem Account + Domain:
```bash
cloudflared tunnel login
cloudflared tunnel create mcp-server
```

`~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/pi/.cloudflared/<TUNNEL-ID>.json
ingress:
  - hostname: mcp.deine-domain.de
    service: http://localhost:3333
  - service: http_status:404
```

### 4. Dienste als systemd einrichten

`/etc/systemd/system/mcp-server.service`:
```ini
[Unit]
Description=MCP Shell Server
After=network.target

[Service]
ExecStart=/usr/bin/mcp-server-shell --config /home/pi/mcp-config.json --port 3333
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable mcp-server cloudflared
sudo systemctl start mcp-server cloudflared
```

### 5. In Claude Code Web eintragen
Settings → MCP Servers → Add:
```
URL:   https://mcp.deine-domain.de
Auth:  Bearer HIER-EIN-GEHEIMES-TOKEN
```
