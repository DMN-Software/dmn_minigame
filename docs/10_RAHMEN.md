# Rahmen

Der Rahmen liegt in `web/src/shell/` und ist der Vertrag, gegen den jedes Spiel gebaut wird.
Ein Spiel kennt weder die Bestenliste noch den Pause-Zustand der Seite noch die URL-Parameter.

## Was ein Spiel ist

Eine React-Komponente als Default-Export mit genau diesen Props:

```ts
type GameProps = {
    paused: boolean
    controls: Controls
    onScore: (score: number) => void
    onGameOver: (score: number) => void
}
```

- `onScore` aktualisiert nur die Anzeige. Der Host verwirft unveränderte Werte, ein Aufruf pro
  Frame ist erlaubt.
- `onGameOver` beendet den Lauf. Der Host lässt pro Lauf genau einen Aufruf durch, das Spiel
  muss sich nicht selbst absichern — aber danach nichts mehr tun.
- `paused` ist die einzige Wahrheit. Kein Spiel horcht selbst auf `visibilitychange` oder `blur`.

Nach dem Ende bleibt das Spiel montiert und nur pausiert — ausgehängt wird es erst beim
Neustart, wenn `run` hochzählt und `key={run}` wechselt. Jedes Spiel muss deshalb nach
`onGameOver` von selbst stillhalten und im Rückgabewert seines `useEffect` aufräumen; die
Canvas-Spiele setzen dafür ein `over`-Flag, das ihr Schritt oben abfragt.

## Steuerung

`useControls` fasst Tastatur, Zeiger, Wischgesten und das Bildschirmpad zu einem Strom zusammen.
Ein Spiel sieht nie, woher eine Eingabe kam:

```ts
type Action = 'up' | 'down' | 'left' | 'right' | 'fire' | 'alt'

type Controls = {
    on(fn: (action: Action) => void): () => void
    held(action: Action): boolean
    axis(): number
    pointer(): { x: number; y: number } | null
}
```

`axis()` folgt dem Zeiger, solange er sich in den letzten 1,5 Sekunden bewegt hat, sonst den
Tasten. WASD liegt bewusst neben den Pfeiltasten: in CEF schluckt GTA je nach Build die Pfeile.

Das Bildschirmpad erscheint bei `(pointer: coarse)` und lässt sich mit `?pad=1` bzw. `?pad=0`
erzwingen. Welche Variante gezeichnet wird, entscheidet `scheme` aus `shared/games.ts`:
`dpad` bekommt ein Steuerkreuz, `tap` eine große Taste, `paddle` und `pointer` nichts — dort
reicht Ziehen bzw. Klicken auf der Fläche.

## Schleife und Canvas

```ts
useGameLoop((dt, now) => { ... }, !paused)
```

`dt` kommt in Sekunden und ist auf 0,1 gedeckelt. Ungedeckelt springt nach einem Tab-Wechsel
jedes Spiel durch die halbe Welt.

```ts
const canvas = useCanvas(360, 540)
```

Gezeichnet wird **immer** in logischen Einheiten von `0..width` und `0..height`. Die Skalierung
auf die tatsächliche Fläche setzt der Hook über `ResizeObserver` und `devicePixelRatio`;
ein Spiel darf die Transformation nie zurücksetzen. `save()` und `restore()` sind in Ordnung.

Die DOM-Spiele brauchen kein Canvas, aber dieselbe Anpassung an den Platz. Dafür gibt es
`useSquare(max, min)`: Es misst den Container und liefert die Kantenlänge eines Quadrats.
`aspect-ratio` reicht dort nicht, weil Chromium die Quadratur bricht, sobald die Höhe der
Engpass ist.

## Pause

Der Host pausiert bei `blur`, bei `visibilitychange` auf versteckt, bei Escape und bei `P`.
Fortgesetzt wird **immer** ausdrücklich per Klick, nie automatisch bei `focus` — sonst läuft das
Spiel weiter, während der Spieler noch woanders klickt.

## Neues Spiel hinzufügen

1. Eintrag in `shared/games.ts` unter `GAMES` und ein Grenzwertpaar in `LIMITS`
2. Loader in `web/src/shell/registry.ts`
3. Komponente unter `web/src/games/<id>/`

Der Loader ist ein dynamisches `import()`, damit nicht alle zwölf Spiele im Startbündel landen.
Das Menü stößt ihn schon beim Überfahren der Kachel an.
