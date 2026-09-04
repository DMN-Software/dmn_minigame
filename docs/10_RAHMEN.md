# Rahmen

Jedes Spiel ist zweigeteilt: die Logik liegt als reine Simulation in `shared/games/`, das
Zeichnen in `web/src/games/`. Der Grund steht in [20_API.md](20_API.md) — der Server spielt
jeden Lauf mit derselben Logik nach und rechnet die Punktzahl selbst aus. Alles, was der
Browser allein weiß, zählt nicht.

## Die Simulation

Eine Fabrikfunktion `create<Name>(rng: Rng)` liefert ein Objekt, das den Vertrag erfüllt und
zusätzlich alles öffentlich macht, was der Renderer zum Zeichnen braucht:

```ts
type Sim = {
    step(input: Input): void
    score: number
    over: boolean
    rev?: number
}

type Input = {
    held: number      // bitmaske der gehaltenen aktionen
    pressed: number   // was in genau diesem tick dazugekommen ist
    pick: number      // spielabhaengiger kanal, sonst -1
}
```

`step` wird 60-mal je Sekunde gerufen, auch wenn nichts passiert. `rev` brauchen nur die
klickgesteuerten Spiele: React rendert sie neu, sobald der Zähler sich ändert, sonst würde
jeder Tick ein Rendern auslösen.

Der `pick`-Kanal trägt, was nicht in sechs Tastenbits passt. Bei Minefinder ist das
`feldIndex * 2` zum Aufdecken und `feldIndex * 2 + 1` zum Flaggen, bei den Schlägerspielen die
Zielposition in Tausendsteln der Spielfeldbreite.

## Bitgleich rechnen

Der Server rechnet denselben Lauf noch einmal. Weicht auch nur ein Wert ab, scheitert die
Wiederholung und der Spieler verliert seinen Eintrag. In `shared/games/` gilt deshalb:

- Zufall ausschließlich über den übergebenen `rng` — `makeRng` ist ein mulberry32 aus
  Ganzzahloperationen und einer Division, also überall gleich.
- Keine Uhrzeit. Zeit wird in Ticks gezählt, 60 sind eine Sekunde. Aus einer Wartezeit von
  700 ms werden 42 Ticks.
- Keine transzendenten Funktionen. `Math.sin`, `cos`, `tan`, `atan2`, `pow`, `exp` und `log`
  sind zwischen JavaScript-Engines nicht bitgleich, und der Spieler kann Firefox benutzen,
  während der Server auf V8 läuft. Erlaubt sind die Grundrechenarten, `sqrt`, `floor`, `ceil`,
  `round`, `abs`, `min`, `max` und `imul`. Abprallwinkel werden deshalb als Vektor gerechnet
  und mit `sqrt` normiert, nicht über einen Winkel.
- Kein Zugriff auf `window`, `document` oder das Canvas. Die Dateien laufen unverändert in Node.
- Keine Objekt-Iterationsreihenfolge als Logik.

## Der Renderer

```tsx
export default function Snake(props: GameProps) {
    const canvas = useCanvas(SIZE, SIZE)
    useSim({ create: createSnake, props, canvas, draw })
    return <canvas ref={canvas} />
}
```

`useSim` treibt die Simulation mit festem Zeitschritt, schreibt dabei das Eingabeprotokoll
mit, meldet Punktestand und Spielende an den Host und ruft `draw` einmal je Frame. Der
Renderer liest nur; er darf den Zustand nicht verändern und keine eigene Zeit führen. Die
klickgesteuerten Spiele lassen `canvas` und `draw` weg und rendern aus dem zurückgegebenen
Objekt.

`useCanvas(w, h)` gibt eine feste logische Auflösung vor. Gezeichnet wird immer in Einheiten
von `0..w` und `0..h`; die Skalierung auf die tatsächliche Fläche setzt der Hook über
`ResizeObserver` und `devicePixelRatio`. Die Transformation darf ein Spiel nie zurücksetzen,
`save()` und `restore()` sind in Ordnung.

Für die klickgesteuerten Spiele gibt es `useSquare(max, min)`: Es misst den Container und
liefert die Kantenlänge eines Quadrats. `aspect-ratio` reicht dort nicht, weil Chromium die
Quadratur bricht, sobald die Höhe der Engpass ist.

## Steuerung

`useControls` fasst Tastatur, Zeiger, Wischgesten und das Bildschirmpad zu einer Bitmaske
zusammen; ein Spiel sieht nie, woher eine Eingabe kam. WASD liegt bewusst neben den
Pfeiltasten: in CEF schluckt GTA je nach Build die Pfeile.

Ein kurzer Tipp würde zwischen zwei Ticks verlorengehen, deshalb bleibt er bis zum nächsten
Tick in der Maske stehen. Das Bildschirmpad erscheint bei `(pointer: coarse)` und lässt sich
mit `?pad=1` bzw. `?pad=0` erzwingen; welche Variante gezeichnet wird, entscheidet `scheme`
aus `shared/games.ts`.

## Pause und Ende

Der Host pausiert bei `blur`, bei `visibilitychange` auf versteckt, bei Escape und bei `P`.
Fortgesetzt wird immer ausdrücklich per Klick, nie automatisch bei `focus` — sonst läuft das
Spiel weiter, während der Spieler noch woanders klickt. Beim Pausieren verwirft der Treiber
die aufgelaufene Zeit, sonst holt die Simulation alle verpassten Ticks auf einmal nach.

Nach dem Ende bleibt das Spiel montiert und nur pausiert; ausgehängt wird es erst beim
Neustart, wenn `key={run}` wechselt. Jede Simulation muss deshalb nach `over` von selbst
stillhalten.

## Neues Spiel hinzufügen

1. Eintrag in `shared/games.ts` unter `GAMES` und ein Grenzwertpaar in `LIMITS`
2. Simulation unter `shared/games/<id>.ts`, Fabrik in `shared/registry.ts` eintragen
3. Renderer unter `web/src/games/<id>/`, Loader in `web/src/shell/registry.ts`

Der Loader ist ein dynamisches `import()`, damit nicht alle zwölf Spiele im Startbündel
landen. Das Menü stößt ihn schon beim Überfahren der Kachel an.

Vor dem Abgeben prüfen, dass Direktlauf und Wiederholung dasselbe Ergebnis liefern — ein
Skript, das die Simulation tickt, das entstandene Protokoll durch `replay()` schickt und
Punktzahl und Tickzahl vergleicht, findet jede Verletzung der Regeln oben sofort.
