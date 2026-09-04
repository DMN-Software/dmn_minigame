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
    duration_ms INTEGER NOT NULL, created_at INTEGER NOT NULL, ip_hash TEXT NOT NULL,
    ticks INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX scores_best ON scores (game, score DESC, created_at);

CREATE TABLE sessions (
    token TEXT PRIMARY KEY, game TEXT NOT NULL,
    started_at INTEGER NOT NULL, used_at INTEGER, ip_hash TEXT NOT NULL,
    seed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sessions_age ON sessions (started_at);
```

Zeitstempel sind Unix-Millisekunden. `ip_hash` ist `sha256(ip + IP_SALT)` auf 16 Zeichen
gekürzt; die rohe Adresse wird weder gespeichert noch geloggt. Alle zehn Minuten fallen
eingelöste Sitzungen nach zehn Minuten und alle übrigen nach drei Stunden weg — die Gültigkeit
beträgt ohnehin nur zwei. Der Timer ist `unref()`, damit er den Prozess nicht am Leben hält.

`seed` und `ticks` kamen mit der zweiten Migration dazu, als die Punktzahl auf das Nachspielen
umgestellt wurde.

## Endpunkte

Alle unter `/api/v1`, damit Caddy nichts umschreiben muss.

| Methode | Pfad | Rumpf | Antwort | Limit |
|---|---|---|---|---|
| `GET` | `/health` | — | `{ ok: true }` | 60/min |
| `POST` | `/session` | `{ game }` | `{ token, seed }` | 30/min |
| `POST` | `/score` | `{ token, name, log }` | `{ rank, score, top }` | 20/min |
| `GET` | `/scores/:game?limit=` | — | `{ top }` | 120/min |
| `DELETE` | `/scores/:id` | Header `Authorization: Bearer` | `{ ok: true }` | 10/min |

`limit` wird auf 1 bis 50 geklemmt, Standard 10. Der Ratelimit-Schlüssel ist der IP-Hash.

Die Liste zeigt **den besten Lauf je Name**, sonst belegt ein einziger Spieler alle Plätze:

```sql
SELECT name, MAX(score) AS score, created_at AS at
FROM scores WHERE game = ? GROUP BY name ORDER BY score DESC, at ASC LIMIT ?
```

Den Löschendpunkt gibt es, weil eine öffentliche Liste mit freiem Namensfeld irgendwann einen
Eintrag bekommt, der weg muss. Er deckt zugleich Löschbegehren ab.

## Die Punktzahl kommt nicht vom Client

`POST /score` nimmt **keine** Punktzahl entgegen. Der Client schickt sein Eingabeprotokoll,
und der Server spielt den Lauf damit nach:

1. `POST /session` gibt neben dem Token einen Startwert aus und merkt sich beides zur Sitzung.
2. Der Browser treibt die Simulation mit festem Zeitschritt von 60 Ticks je Sekunde und
   schreibt jede Änderung der Eingabe als Tripel `[tick, held, pick]` mit.
3. `POST /score` schickt Token, Name und dieses Protokoll.
4. Der Server baut dieselbe Simulation mit demselben Startwert auf, spielt das Protokoll ab
   und liest die Punktzahl am Ende aus.

Die Spiellogik liegt dafür in `shared/games/` und wird von beiden Seiten unverändert benutzt;
unter `web/src/games/` steht nur noch das Zeichnen. Ein Lauf, der sich nicht nachspielen lässt
oder nicht in einem Spielende endet, wird mit `Lauf nicht nachvollziehbar` abgewiesen.

Damit das trägt, muss die Logik bitgleich rechnen. Die Regeln stehen in
[10_RAHMEN.md](10_RAHMEN.md): kein `Math.random`, keine Uhrzeit, keine transzendenten
Funktionen, kein Zugriff auf den Browser.

**Was das leistet und was nicht.** Eine erfundene Punktzahl ist unmöglich — jeder Eintrag
entspricht einem echten, nachspielbaren Durchlauf. Ein Skript, das das Spiel selbst gut
spielt, bleibt möglich; das lässt sich in einem Browserspiel nicht ausschließen und wäre auch
mit Obfuskation oder Client-Signaturen nicht zu erreichen. Dagegen hilft nur der
Löschendpunkt.

Die Grenzwerte aus `shared/games.ts` bleiben als Fangnetz stehen, falls ein Spiel doch eine
Lücke hat. Die eigentliche Prüfung ist die Wiederholung.

## Weitere Prüfungen beim Einreichen

- Token existiert, ist nicht verbraucht und nicht älter als zwei Stunden
- Der Name ist gültig
- Die nachgespielte Dauer passt in die Zeit seit Ausgabe des Tokens
- Die Punktzahl liegt unter `LIMITS[game].maxScore`

Der Token wird erst **nach** allen Prüfungen eingelöst — ein abgelehnter Name soll den Lauf
nicht verbrennen. Zwei gleichzeitige Abgaben fängt das bedingte
`UPDATE … WHERE used_at IS NULL` ab.

Die Meldungen sind kurz und deutsch, weil das Frontend sie unverändert anzeigt:
`Sitzung unbekannt`, `Sitzung schon eingetragen`, `Sitzung abgelaufen`,
`Lauf nicht nachvollziehbar`, `Punktzahl unglaubwürdig`, `Name zu kurz`, `Name zu lang`,
`Name enthält unerlaubte Zeichen`, `Name nicht erlaubt`.

## Namen

`normalizeName` aus `shared/scores.ts` (NFC, Mehrfach-Leerzeichen zusammenziehen, trimmen),
danach Länge 2 bis 16 und das Muster `NAME_RE` — Buchstaben jeder Sprache, Ziffern, Leerzeichen,
Punkt, Unterstrich, Bindestrich. Der Wortfilter prüft eine reduzierte Form: kleingeschrieben,
Leetspeak zurückgesetzt, alle Nicht-Buchstaben entfernt. Das fängt `H1tl3r` und `f u c k`. Es
ist eine Anstandsprüfung, keine Moderation.

## Grenzwerte nachziehen

`LIMITS` in `shared/games.ts` ist großzügig über dem realistischen Rekord angesetzt und dient
seit der Umstellung auf das Nachspielen nur noch als Fangnetz. Nach ein paar Wochen echten
Betriebs lassen sich die Werte anhand der Daten nachziehen:

```sql
SELECT game, MAX(score), MAX(CAST(score AS REAL) / (duration_ms / 1000.0))
FROM scores GROUP BY game;
```
