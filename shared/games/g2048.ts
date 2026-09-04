import { BIT, randInt, type Input, type Rng, type Sim } from '../engine.ts'

export const SIZE = 4

type Dir = 'up' | 'down' | 'left' | 'right'

export type Tile = {
    id: number
    x: number
    y: number
    value: number
    born: boolean
    merged: boolean
    // geschluckte kachel. faehrt den zug noch mit und liegt danach unter der neuen.
    gone: boolean
}

export type G2048Sim = Sim & {
    tiles: Tile[]
}

function buildOrder(): Record<Dir, number[][]> {
    const rows: number[][] = []
    const cols: number[][] = []
    for (let a = 0; a < SIZE; a++) {
        const row: number[] = []
        const col: number[] = []
        for (let b = 0; b < SIZE; b++) {
            row.push(a * SIZE + b)
            col.push(b * SIZE + a)
        }
        rows.push(row)
        cols.push(col)
    }
    return {
        left: rows,
        right: rows.map((r) => r.slice().reverse()),
        up: cols,
        down: cols.map((c) => c.slice().reverse()),
    }
}

const ORDER = buildOrder()

function heading(pressed: number): Dir | null {
    if (pressed & BIT.left) return 'left'
    if (pressed & BIT.right) return 'right'
    if (pressed & BIT.up) return 'up'
    if (pressed & BIT.down) return 'down'
    return null
}

function move(tiles: Tile[], dir: Dir): { tiles: Tile[]; gained: number; moved: boolean } {
    const byCell = new Map<number, Tile>()
    for (const t of tiles) if (!t.gone) byCell.set(t.y * SIZE + t.x, t)

    const out: Tile[] = []
    let gained = 0
    let moved = false

    for (const line of ORDER[dir]) {
        const queue: Tile[] = []
        for (const cell of line) {
            const t = byCell.get(cell)
            if (t) queue.push(t)
        }

        let slot = 0
        for (let i = 0; i < queue.length; i++) {
            const cell = line[slot]
            const x = cell % SIZE
            const y = Math.floor(cell / SIZE)
            const a = queue[i]
            const b = queue[i + 1]

            if (b && b.value === a.value) {
                gained += a.value * 2
                moved = true
                out.push({ ...a, x, y, value: a.value * 2, born: false, merged: true })
                out.push({ ...b, x, y, born: false, merged: false, gone: true })
                i += 1
            } else {
                if (a.x !== x || a.y !== y) moved = true
                out.push({ ...a, x, y, born: false, merged: false })
            }
            slot += 1
        }
    }

    return { tiles: out, gained, moved }
}

function canMove(tiles: Tile[]): boolean {
    const grid = new Map<number, number>()
    for (const t of tiles) if (!t.gone) grid.set(t.y * SIZE + t.x, t.value)
    if (grid.size < SIZE * SIZE) return true

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const v = grid.get(y * SIZE + x)
            if (x + 1 < SIZE && v === grid.get(y * SIZE + x + 1)) return true
            if (y + 1 < SIZE && v === grid.get((y + 1) * SIZE + x)) return true
        }
    }
    return false
}

export function create2048(rng: Rng): G2048Sim {
    let seq = 0
    let score = 0
    let over = false
    let rev = 0

    function spawn(tiles: Tile[]): Tile[] {
        const taken = new Set<number>()
        for (const t of tiles) if (!t.gone) taken.add(t.y * SIZE + t.x)

        const free: number[] = []
        for (let i = 0; i < SIZE * SIZE; i++) if (!taken.has(i)) free.push(i)
        if (!free.length) return tiles

        const at = free[randInt(rng, free.length)]
        seq += 1
        return tiles.concat({
            id: seq,
            x: at % SIZE,
            y: Math.floor(at / SIZE),
            value: rng() < 0.9 ? 2 : 4,
            born: true,
            merged: false,
            gone: false,
        })
    }

    let tiles = spawn(spawn([]))

    return {
        get tiles() {
            return tiles
        },
        get score() {
            return score
        },
        get over() {
            return over
        },
        get rev() {
            return rev
        },

        step(input: Input) {
            if (over) return

            const dir = heading(input.pressed)
            if (!dir) return

            const res = move(tiles, dir)
            if (!res.moved) return

            tiles = spawn(res.tiles)
            score += res.gained
            rev += 1
            if (!canMove(tiles)) over = true
        },
    }
}
