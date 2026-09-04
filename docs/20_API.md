# Bestenliste

Ein eigener Fastify-Dienst auf Node 24 mit `node:sqlite`. Kein Build-Schritt — Node führt die
TypeScript-Quellen direkt aus, gestartet wird mit `node src/index.ts`. Deshalb gilt im ganzen
Ordner `api/`: **nur löschbare Syntax**, also kein `enum`, keine Parameter-Properties,
Typ-Importe als `import type`, relative Importe mit `.ts`-Endung.

Warum nicht das Supabase-Postgres, das auf derselben Maschine läuft: Die Bestenliste sind ein
paar tausend Zeilen, leselastig, ein einziger Schreiber. Eine Kopplung an einen fremden Stack,
der für ein anderes Projekt neu gestartet und aktualisiert wird, wäre teurer als der ganze
Dienst. Die Sicherung ist das Kopieren einer Datei aus dem Volume.

## Umgebung

| Variable | Standard | |
|---|---|---|
| `PORT` | `8090` | |
| `DB_PATH` | `./data/minigames.db` | Verzeichnis wird beim Start angelegt |
| `IP_SALT` | — | Pflicht, sonst Abbruch mit Exit 1 |
| `ADMIN_TOKEN` | — | Pflicht, für den Löschendpunkt |

## Schema

Migrationen liegen als Array in `db.ts`, Index plus eins ist die Schemaversion in
`PRAGMA user_version`. Ein ausgelieferter Block wird nie geändert, Neues kommt als weiterer
Eintrag. Beim Öffnen `journal_mode = WAL` und `foreign_keys = ON`.

```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL, created_at INTEGER NOT NULL, ip_hash TEXT NOT NULL
);
CREATE INDEX scores_best ON scores (game, score DESC, created_at);

CREATE TABLE sessions (
    token TEXT PRIMARY KEY, game TEXT NOT NULL,
    started_at INTEGER NOT NULL, used_at INTEGER, ip_hash TEXT NOT NULL
);
CREATE INDEX sessions_age ON sessions (started_at);
```

Zeitstempel sind Unix-Millisekunden. `ip_hash` ist `sha256(ip + IP_SALT)` auf 16 Zeichen
gekürzt; die rohe Adresse wird weder gespeichert noch geloggt. Sitzungen älter als sechs
Stunden werden alle zehn Minuten weggeräumt, der Timer ist `unref()`, damit er den Prozess
nicht am Leben hält.

## Endpunkte

Alle unter `/api/v1`, damit Caddy nichts umschreiben muss.

| Methode | Pfad | Rumpf | Antwort | Limit |
|---|---|---|---|---|
| `GET` | `/health` | — | `{ ok: true }` | aus |
| `POST` | `/session` | `{ game }` | `{ token }` | 30/min |
| `POST` | `/score` | `{ token, name, score }` | `{ rank, top }` | 20/min |
| `GET` | `/scores/:game?limit=` | — | `{ top }` | 120/min |
| `DELETE` | `/scores/:id` | Header `Authorization: Bearer` | `{ ok: true }` | 10/min |

`limit` wird auf 1 bis 50 geklemmt, Standard 10. Der Ratelimit-Schlüssel ist der IP-Hash.

Die Liste zeigt **den besten Lauf je Name**, sonst belegt ein einziger Spieler alle Plätze:

```sql
SELECT name, MAX(score) AS score, MIN(created_at) AS at
FROM scores WHERE game = ? GROUP BY name ORDER BY score DESC, at ASC LIMIT ?
```

`rank` in der Antwort auf `POST /score` ist der Platz des eingetragenen Namens in dieser Liste
oder `null`, wenn er nicht unter die zurückgegebenen Plätze fällt.

Den Löschendpunkt gibt es, weil eine öffentliche Liste mit freiem Namensfeld irgendwann einen
Eintrag bekommt, der weg muss. Er deckt zugleich Löschbegehren ab.

## Prüfungen beim Einreichen

1. Token existiert, ist nicht verbraucht, nicht älter als zwei Stunden
2. `score` ganzzahlig, zwischen 0 und `LIMITS[game].maxScore`
3. Laufdauer mindestens `LIMITS[game].minMs`
4. `score / (dauerMs / 1000)` höchstens `LIMITS[game].maxPerSecond`
5. Name gültig

Der Token wird erst **nach** allen Prüfungen eingelöst — ein abgelehnter Name soll den Lauf
nicht verbrennen. Zwei gleichzeitige Abgaben fängt das bedingte
`UPDATE … WHERE used_at IS NULL` ab.

Die Meldungen sind kurz und deutsch, weil das Frontend sie unverändert anzeigt:
`Sitzung unbekannt`, `Sitzung schon eingetragen`, `Sitzung abgelaufen`, `Zu schnell fertig`,
`Punktzahl unglaubwuerdig`, `Punktzahl passt nicht zur Spieldauer`, `Name zu kurz`,
`Name zu lang`, `Name enthaelt unerlaubte Zeichen`, `Name nicht erlaubt`.

## Namen

`normalizeName` aus `shared/scores.ts` (NFC, Mehrfach-Leerzeichen zusammenziehen, trimmen),
danach Länge 2 bis 16 und das Muster `NAME_RE` — Buchstaben jeder Sprache, Ziffern, Leerzeichen,
Punkt, Unterstrich, Bindestrich. Der Wortfilter prüft eine reduzierte Form: kleingeschrieben,
Leetspeak zurückgesetzt, alle Nicht-Buchstaben entfernt. Das fängt `H1tl3r` und `f u c k`. Es
ist eine Anstandsprüfung, keine Moderation.

## Cheat-Schutz, ehrlich

Ein Score, den der Browser berechnet, ist fälschbar. Wer die Konsole öffnet, kann `fetch` mit
beliebigen Werten aufrufen. Dagegen hilft nur serverseitige Simulation des kompletten
Spielverlaufs, und die kostet für zwölf Spiele ein Vielfaches vom Rest des Projekts. Sie wird
nicht gebaut.

Die Prüfungen oben heben die Hürde für Gelegenheitsmanipulation und einfache Skripte. Sie
beseitigen Betrug nicht — ein Eintrag in der Liste ist kein Beleg für tatsächliches Spielen.
Obfuskation, Signaturen im Client und Proof-of-Work wären gegen eine offene Browserkonsole
wirkungslos und kosten nur Wartung.

## Grenzwerte nachziehen

`LIMITS` in `shared/games.ts` ist großzügig über dem realistischen Rekord angesetzt. Zwei Werte
sind mit Bot-Simulationen belegt: Flatterflug erreicht rund 0,67 Punkte pro Sekunde bei einer
Grenze von 1,5, Sprungturm rund 13 bei einer Grenze von 200. Nach ein paar Wochen echten
Betriebs sollten die Werte anhand der Daten nachgezogen werden:

```sql
SELECT game, MAX(score), MAX(CAST(score AS REAL) / (duration_ms / 1000.0))
FROM scores GROUP BY game;
```
