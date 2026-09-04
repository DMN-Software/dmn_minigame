# dmn_minigame

Zwölf Minispiele für die Zeit, in der man auf dem DMN-Server bewusstlos am Boden liegt und auf
einen Sanitäter wartet. Läuft als eigenständige Website unter
**https://minigames.dmn-software.com** und wird von `sky_ambulancejob` über diese Adresse in
einem iframe eingebunden. Dieselbe Seite ist im normalen Browser spielbar.

> **Quelle einsehbar, Nutzung untersagt.** Dieses Repository ist öffentlich, damit man den Code
> lesen kann — nicht, damit man ihn benutzt. Siehe [LICENSE](LICENSE). Kein Support, keine
> Beiträge; Pull Requests werden ungelesen geschlossen.

## Die Spiele

| Spiel | Steuerung | Technik |
|---|---|---|
| Snake | Richtungstasten, Wischen | Canvas |
| Flappy Bird | Tippen | Canvas |
| Tic-Tac-Toe | Klicken | DOM |
| Tower Stack | Tippen | Canvas |
| 2048 | Richtungstasten, Wischen | DOM |
| Breakout | Zeiger, Richtungstasten | Canvas |
| Minesweeper | Klicken, langer Druck für Flagge | DOM |
| Memory | Klicken | DOM |
| Tetris | Richtungstasten | Canvas |
| Pong | Zeiger, Richtungstasten | Canvas |
| Simon Says | Klicken | DOM |
| Doodle Jump | Richtungstasten | Canvas |

## Aufbau

```
shared/     spiellogik, typvertrag und grenzwerte, von web und api gemeinsam benutzt
web/        vite + react + typescript, zeichnet die spiele und die oberflaeche
api/        fastify + node:sqlite, die globale bestenliste
deploy/     dockerfiles, compose, caddy-block, deploy-anleitung
docs/       vertrag je subsystem
```

Die Spiellogik liegt bewusst in `shared/` und nicht im Frontend: Der Server spielt jeden Lauf
damit nach und rechnet die Punktzahl selbst aus, statt sie vom Browser entgegenzunehmen. Mehr
dazu in [docs/20_API.md](docs/20_API.md).

`shared/` ist kein npm-Paket, sondern wird von beiden Seiten mit relativem Pfad importiert.
Das spart Workspace-Werkzeug für ein paar Dateien.

## Entwickeln

```sh
cd api && npm install
IP_SALT=$(openssl rand -hex 32) ADMIN_TOKEN=$(openssl rand -hex 32) DB_PATH=./data/dev.db node src/index.ts

cd web && npm install && npm run dev
```

Der Vite-Dev-Server leitet `/api` auf `127.0.0.1:8090` weiter. Ohne laufende API funktionieren
alle Spiele, nur die Bestenliste bleibt leer.

Einbettung prüfen: `http://localhost:5173/test-iframe.html`

## URL-Parameter

| Parameter | Wirkung |
|---|---|
| `game=snake` | springt direkt auf die Startkarte dieses Spiels |
| `kiosk=1` | Menü und Zurück-Schaltfläche verschwinden, ohne `game` wird zufällig gewählt |
| `name=Max` | belegt das Namensfeld der Bestenliste vor |
| `board=0` | Bestenliste ausblenden, für sehr kleine iframes |
| `autostart=1` | Startkarte überspringen |
| `pad=1` / `pad=0` | Bildschirmsteuerung erzwingen oder abschalten |

Beispiel für die Einbindung:

```
https://minigames.dmn-software.com/?kiosk=1&game=snake&name=Max%20Mustermann&board=0
```

Was die einbettende Seite tun muss, steht in [docs/40_EINBETTUNG.md](docs/40_EINBETTUNG.md) —
kurz gefasst: NUI-Fokus halten, solange das iframe sichtbar ist.

## Betrieb

Siehe [deploy/README.md](deploy/README.md). Kurz: eigener Compose-Stack hinter dem Caddy, der
auf demselben Server bereits Port 80 und 443 besitzt.
