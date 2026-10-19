<div align="center">

# dmn_minigame

**Zwölf einbettbare Minispiele. Die Punktzahl für die Bestenliste rechnet der Server aus, indem er jeden Lauf nachspielt.**

[![Live spielen](https://img.shields.io/badge/live-minigames.dmn--software.com-FF6B00?style=for-the-badge&logo=gamejolt&logoColor=white)](https://minigames.dmn-software.com)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![node:sqlite](https://img.shields.io/badge/node:sqlite-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/api/sqlite.html)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Lizenz: Alle Rechte vorbehalten](https://img.shields.io/badge/License-All_rights_reserved-lightgrey?style=flat-square)](LICENSE)

</div>

---

Eine eigenständige Seite mit zwölf Minispielen und einer globalen Bestenliste, gebaut zum
Einbetten per iframe. Die Punktzahlen kommen nicht aus dem Browser, sondern aus einer
serverseitigen Wiederholung jedes Laufs mit derselben Simulation. Läuft unter
**[minigames.dmn-software.com](https://minigames.dmn-software.com)** und ist dort auch direkt im
Browser spielbar.

> **Alle Rechte vorbehalten.** Dieses Repository ist öffentlich, damit man den Code lesen kann.
> Mögliche Arbeit- oder Auftraggeber dürfen ihn zur Prüfung herunterladen und lokal ausführen,
> jede andere Nutzung ist ausgeschlossen. Siehe [LICENSE](LICENSE). Es ist kein
> Open-Source-Projekt: kein Support, keine Beiträge.

## Der interessante Teil: die Punktzahl entsteht auf dem Server

Eine Bestenliste im Browser ist normalerweise eine Einladung: `POST /score {"score": 999999}`,
fertig. Die üblichen Gegenmittel (signierte Werte, Plausibilitätsgrenzen) prüfen am Ende
doch nur eine Zahl, die sich der Client ausgedacht hat.

Diese Zahl gibt es hier nicht. **Der Client schickt nie eine Punktzahl.** Er schickt, was gedrückt
wurde, und der Server spielt den Lauf damit nach.

```
POST /session        Server würfelt Seed und Token (node:crypto), merkt sich beides
      ↓
   gespielt          Recorder schreibt nur bei Änderung ein Tripel [tick, held, pick]
      ↓
POST /score          { token, name, log }   ← keine Punktzahl im Body
      ↓
   Server            replay(SIMS[game], session.seed, log)  →  hier entsteht die Punktzahl
```

Damit das aufgeht, muss dieselbe Simulation auf beiden Seiten **bitgleich** laufen. Dafür gelten im
Spielcode ein paar harte Regeln, nachzulesen in [docs/10_RAHMEN.md](docs/10_RAHMEN.md):

| Regel | Grund |
|---|---|
| Zufall nur über den mitgelieferten `rng` | eigener mulberry32 statt `Math.random`, damit beide Seiten dieselbe Folge sehen |
| Zeit nur in Ticks, nie Wanduhrzeit | 60 Hz fest; `Date.now()` gäbe es beim Nachspielen nicht noch einmal |
| Kein `sin`, `cos`, `pow`, `exp`, `log` | transzendente Funktionen sind zwischen JS-Engines nicht bitgleich |
| Kein DOM- oder Canvas-Zugriff in der Logik | die API hat kein DOM |

Der Rest ist Absicherung drumherum: das Log wird vor dem Nachspielen validiert (Länge durch drei
teilbar, Ticks streng monoton, Wertebereiche, `MAX_LOG` = 120 000), der Lauf bricht nach 30 Minuten
Spielzeit ab, die nachgespielte Dauer muss in die Zeit seit Ausgabe des Tokens passen, eine
Höchstpunktzahl je Spiel (`LIMITS`) fängt Ausreißer ab, und die Session wird vor dem Nachspielen
atomar verbraucht (`UPDATE … WHERE token = ? AND used_at IS NULL`). Dasselbe Token zählt so auch
bei gleichzeitigen Requests nur einmal, und ein abgelehnter Lauf lässt sich nicht beliebig oft
nachspielen.

Was bleibt: wer einen Bot schreibt, der die Spiele wirklich gut spielt, kommt in die Liste. Dagegen
hilft nur der Löschendpunkt.

Bei Spielen mit verdeckter Information kommt eine zweite Grenze dazu. Der Seed geht an den Client,
sonst könnte der Browser nicht dieselbe Simulation rechnen. Ein Bot kann damit bei Memoria die
Kartenlage, bei Minefinder die Minen und bei Sim Says die ganze Folge vorab ausrechnen. Das
Nachspielen garantiert weiter, dass die Punktzahl zu echten Eingaben passt. Dass der Spieler das
Feld nicht schon kannte, lässt sich bei diesen drei Spielen aber nicht beweisen.

Das steht so auch in [docs/20_API.md](docs/20_API.md): die Grenzen des Verfahrens sind
dokumentiert, nicht weggelassen.

## Die Spiele

Ein Spiel ist eine Datei in `shared/games/`, die diesen Vertrag erfüllt:

```ts
type Sim = {
    step(input: Input): void   // Input = { held, pressed, pick }, Bitmasken statt Event-Strom
    score: number
    over: boolean
}
```

Mehr nicht. Die Oberfläche in `web/` zeichnet nur, was die Simulation sagt; der Server ruft dasselbe
`step()` auf, ohne je etwas zu zeichnen.

Die Namen lehnen sich an bekannte Vorbilder an, sind aber bewusst nicht deren Namen.
Mehrere davon sind eingetragene Marken.

| Spiel | Steuerung | Technik |
|---|---|---|
| Snaker | Richtungstasten, Wischen | Canvas |
| Flapper | Tippen | Canvas |
| Tick Tack Toe | Klicken | DOM |
| Stacker | Tippen | Canvas |
| 2048 | Richtungstasten, Wischen | DOM |
| Brickout | Zeiger, Richtungstasten | Canvas |
| Minefinder | Klicken, langer Druck für Flagge | DOM |
| Memoria | Klicken | DOM |
| Blockris | Richtungstasten | Canvas |
| Pongo | Zeiger, Richtungstasten | Canvas |
| Sim Says | Klicken | DOM |
| Doodle Hop | Richtungstasten | Canvas |

## Aufbau

```
shared/     spiellogik, typvertrag und grenzwerte, von web und api gemeinsam benutzt   rund 1700 Zeilen
web/        vite + react + typescript, zeichnet die spiele und die oberflaeche         rund 2100 Zeilen
api/        fastify + node:sqlite, die globale bestenliste                              rund 300 Zeilen
deploy/     dockerfiles, compose, caddy-block, deploy-anleitung
docs/       vertrag je subsystem
```

`shared/` ist kein npm-Paket, sondern wird von beiden Seiten mit relativem Pfad importiert. Das
spart Workspace-Werkzeug für ein paar Dateien.

Abhängigkeiten sind dünn gehalten: die API hat zwei (`fastify`, `@fastify/rate-limit`), das Frontend
hat zwei (`react`, `react-dom`). Die Datenbank ist `node:sqlite` aus der Standardbibliothek: kein
`better-sqlite3`, kein ORM, keine zweite Postgres-Instanz für eine Tabelle mit acht Spalten.
Migrationen sind ein Array von SQL-Blöcken, der Fortschritt steht in `PRAGMA user_version`. Die API
braucht keinen Build-Schritt, Node 24 führt das TypeScript direkt aus.

## API

Alles unter `/api/v1`, Rate-Limit pro Route, Schlüssel ist die **gehashte** IP.

| | Pfad | Limit | |
|---|---|---|---|
| `GET` | `/health` | 60/min | |
| `POST` | `/session` | 30/min | Token und Seed, zwei Stunden gültig, einmal verwendbar |
| `POST` | `/score` | 20/min | nimmt das Log entgegen, keine Punktzahl |
| `GET` | `/scores/:game` | 120/min | |
| `DELETE` | `/scores/:id` | 10/min | `Authorization: Bearer …` |

Zur IP: gespeichert und als Rate-Limit-Schlüssel benutzt wird nur `sha256(ip + IP_SALT)`, auf 16
Zeichen gekürzt. Die rohe Adresse landet weder in der Datenbank noch im Log. `trustProxy` steht auf
`'uniquelocal'` und nicht auf `true`, weil `X-Forwarded-For` sonst vom Client frei wählbar wäre und
das Rate-Limit damit wirkungslos.

Namen laufen durch einen Filter, der Leetspeak zurückübersetzt, NFKD-normalisiert und erst dann
gegen die Blockliste prüft, inklusive der Hangul-Füllzeichen, die als Buchstabe zählen, aber wie
Leerraum aussehen und sonst leere Zeilen in der Bestenliste erzeugen würden.

Details: [docs/20_API.md](docs/20_API.md).

## Entwickeln

Lokal ausführen ist zur Prüfung ausdrücklich erlaubt, siehe [LICENSE](LICENSE).

```sh
cd api && npm install
IP_SALT=$(openssl rand -hex 32) ADMIN_TOKEN=$(openssl rand -hex 32) DB_PATH=./data/dev.db node src/index.ts

cd api && npm test

cd web && npm install && npm run dev
```

`npm test` spielt jedes der zwölf Spiele mit festen Seeds und festen Eingaben durch, schickt das
Protokoll durch denselben `replay()` wie der Server und vergleicht Punktzahl und Tickzahl. Für je
einen Seed pro Spiel sind beide Werte fest eingetragen; rechnet eine Simulation nicht bitgleich,
schlägt der Test fehl. Er läuft mit `node:test` aus der Standardbibliothek, ohne zusätzliche
Abhängigkeit.

Der Vite-Dev-Server leitet `/api` auf `127.0.0.1:8090` weiter. Ohne laufende API funktionieren alle
Spiele, nur die Bestenliste bleibt leer.

Einbettung prüfen: `http://localhost:5173/test-iframe.html`

Die CI (`.github/workflows/pruefung.yml`) läuft auf Node 24 und prüft bei jedem Push auf `main` und
jedem Pull Request den Typecheck beider Pakete, den Vite-Build und den Replay-Test.

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

Was die einbettende Seite tun muss, steht in [docs/40_EINBETTUNG.md](docs/40_EINBETTUNG.md). Das
gilt auch für einen Spiel-Client wie FiveM, der die Seite als NUI-iframe zeigt: Er muss den
Eingabefokus halten, solange das iframe sichtbar ist.

## Betrieb

Zwei Container hinter dem Caddy, der auf demselben Server bereits Port 80 und 443 hält; die
Verbindung läuft über ein von Hand angelegtes externes Docker-Netz. Beide Images laufen als
Nicht-Root, beide haben einen Healthcheck, die SQLite-Datei liegt in einem named Volume, und
`IP_SALT` und `ADMIN_TOKEN` sind in der Compose-Datei als Pflichtvariablen gesetzt. Ohne sie
startet der Stack gar nicht erst.

Anleitung: [deploy/README.md](deploy/README.md).
