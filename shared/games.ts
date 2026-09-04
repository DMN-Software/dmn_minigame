export type GameId =
    | 'snake'
    | 'flappy'
    | 'tictactoe'
    | 'tower'
    | 'g2048'
    | 'breakout'
    | 'minesweeper'
    | 'memory'
    | 'tetris'
    | 'pong'
    | 'simon'
    | 'doodle'

export type Scheme = 'dpad' | 'tap' | 'paddle' | 'pointer'

export type GameMeta = {
    id: GameId
    title: string
    hint: string
    scheme: Scheme
}

export const GAMES: GameMeta[] = [
    { id: 'snake', title: 'Snake', hint: 'Sammeln, ohne dich selbst zu treffen', scheme: 'dpad' },
    { id: 'flappy', title: 'Flappy Bird', hint: 'Tippen hält dich oben', scheme: 'tap' },
    { id: 'tictactoe', title: 'Tic-Tac-Toe', hint: 'Gegen den Rechner, drei in einer Reihe', scheme: 'pointer' },
    { id: 'tower', title: 'Tower Stack', hint: 'Blöcke stapeln, der Überstand fällt ab', scheme: 'tap' },
    { id: 'g2048', title: '2048', hint: 'Gleiche Zahlen zusammenschieben', scheme: 'dpad' },
    { id: 'breakout', title: 'Breakout', hint: 'Alle Steine mit dem Ball abräumen', scheme: 'paddle' },
    { id: 'minesweeper', title: 'Minesweeper', hint: 'Felder aufdecken, Minen markieren', scheme: 'pointer' },
    { id: 'memory', title: 'Memory', hint: 'Gleiche Karten finden', scheme: 'pointer' },
    { id: 'tetris', title: 'Tetris', hint: 'Reihen füllen und auflösen', scheme: 'dpad' },
    { id: 'pong', title: 'Pong', hint: 'Erster auf elf Punkte gewinnt', scheme: 'paddle' },
    { id: 'simon', title: 'Simon Says', hint: 'Die Folge nachklicken, sie wird länger', scheme: 'pointer' },
    { id: 'doodle', title: 'Doodle Jump', hint: 'Von Plattform zu Plattform nach oben', scheme: 'dpad' },
]

export const GAME_IDS = GAMES.map((g) => g.id)

export function isGameId(value: unknown): value is GameId {
    return typeof value === 'string' && (GAME_IDS as string[]).includes(value)
}

export function gameMeta(id: GameId): GameMeta {
    return GAMES.find((g) => g.id === id) as GameMeta
}

export type Limit = {
    maxScore: number
    minMs: number
    maxPerSecond: number
}

// grosszuegig ueber dem realistischen rekord angesetzt. der zweck ist nicht, gute spieler
// auszubremsen, sondern offensichtliche fantasiewerte abzuweisen. die werte fuer paare,
// blockstapler, turmbau und tischtennis stammen aus bot-simulationen gegen den echten
// spielcode - zu eng gesetzt weisen sie genau die laeufe ab, die in die liste wollen.
// nach ein paar wochen echten daten nachziehen, siehe docs/20_API.md.
export const LIMITS: Record<GameId, Limit> = {
    snake: { maxScore: 500, minMs: 3000, maxPerSecond: 3 },
    flappy: { maxScore: 999, minMs: 2000, maxPerSecond: 1.5 },
    tictactoe: { maxScore: 999, minMs: 2000, maxPerSecond: 1 },
    tower: { maxScore: 999, minMs: 2000, maxPerSecond: 4 },
    g2048: { maxScore: 500000, minMs: 10000, maxPerSecond: 400 },
    breakout: { maxScore: 9999, minMs: 5000, maxPerSecond: 20 },
    minesweeper: { maxScore: 999, minMs: 4000, maxPerSecond: 20 },
    memory: { maxScore: 800, minMs: 5000, maxPerSecond: 150 },
    tetris: { maxScore: 999999, minMs: 10000, maxPerSecond: 3000 },
    pong: { maxScore: 99, minMs: 10000, maxPerSecond: 1 },
    simon: { maxScore: 200, minMs: 3000, maxPerSecond: 0.5 },
    doodle: { maxScore: 99999, minMs: 3000, maxPerSecond: 200 },
}
