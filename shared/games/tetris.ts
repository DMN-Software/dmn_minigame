import { BIT, shuffle, type Input, type Rng, type Sim } from '../engine.ts'

export const COLS = 10
export const ROWS = 20

const LINE_SCORE = [0, 100, 300, 500, 800]

export type Cell = { x: number; y: number }

type Piece = {
    color: string
    rotations: Cell[][]
}

function turn(rows: string[]): string[] {
    const out: string[] = []
    for (let x = 0; x < rows.length; x++) {
        let line = ''
        for (let y = rows.length - 1; y >= 0; y--) line += rows[y][x]
        out.push(line)
    }
    return out
}

function cells(rows: string[]): Cell[] {
    const out: Cell[] = []
    for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < rows[y].length; x++) {
            if (rows[y][x] === 'x') out.push({ x, y })
        }
    }
    return out
}

function build(color: string, rows: string[]): Piece {
    const rotations: Cell[][] = []
    let cur = rows
    for (let i = 0; i < 4; i++) {
        rotations.push(cells(cur))
        cur = turn(cur)
    }
    return { color, rotations }
}

// die kaesten sind quadratisch, damit das drehen ohne sonderfaelle auskommt
export const PIECES: Piece[] = [
    build('#38bdf8', ['....', 'xxxx', '....', '....']),
    build('#fbbf24', ['xx', 'xx']),
    build('#a78bfa', ['.x.', 'xxx', '...']),
    build('#4ade80', ['.xx', 'xx.', '...']),
    build('#f472b6', ['xx.', '.xx', '...']),
    build('#e6ebf2', ['x..', 'xxx', '...']),
    build('#fb923c', ['..x', 'xxx', '...']),
]

export function width(piece: number): number {
    let max = 0
    for (const c of PIECES[piece].rotations[0]) max = Math.max(max, c.x + 1)
    return max
}

export type Active = { piece: number; rot: number; x: number; y: number }

export type TetrisSim = Sim & {
    score: number
    over: boolean
    // index in PIECES, -1 fuer leer
    grid: number[]
    active: Active
    // hoehe, auf der das stueck landen wuerde
    ghost: number
    next: number
    lines: number
    level: number
}

export function createTetris(rng: Rng): TetrisSim {
    const bag: number[] = []
    let fall = 0

    function pull(): number {
        if (bag.length === 0) bag.push(...shuffle(rng, [0, 1, 2, 3, 4, 5, 6]))
        return bag.pop() as number
    }

    function collides(a: Active): boolean {
        for (const c of PIECES[a.piece].rotations[a.rot]) {
            const x = a.x + c.x
            const y = a.y + c.y
            if (x < 0 || x >= COLS || y >= ROWS) return true
            if (y >= 0 && sim.grid[y * COLS + x] >= 0) return true
        }
        return false
    }

    function move(dx: number, dy: number): boolean {
        const a: Active = { piece: sim.active.piece, rot: sim.active.rot, x: sim.active.x + dx, y: sim.active.y + dy }
        if (collides(a)) return false
        sim.active = a
        return true
    }

    function spin() {
        // ohne wandkick: passt die drehung nicht, bleibt das stueck einfach stehen
        const a: Active = { ...sim.active, rot: (sim.active.rot + 1) % 4 }
        if (!collides(a)) sim.active = a
    }

    function drop(): number {
        let y = sim.active.y
        while (!collides({ ...sim.active, y: y + 1 })) y += 1
        return y
    }

    function spawn() {
        const piece = sim.next
        sim.next = pull()
        sim.active = { piece, rot: 0, x: Math.floor((COLS - width(piece)) / 2), y: 0 }
        if (collides(sim.active)) sim.over = true
    }

    function sweep(): number {
        let cleared = 0
        for (let y = ROWS - 1; y >= 0; y--) {
            let full = true
            for (let x = 0; x < COLS; x++) {
                if (sim.grid[y * COLS + x] < 0) {
                    full = false
                    break
                }
            }
            if (!full) continue

            sim.grid.splice(y * COLS, COLS)
            sim.grid.unshift(...new Array(COLS).fill(-1))
            cleared += 1
            y += 1
        }
        return cleared
    }

    function lock() {
        for (const c of PIECES[sim.active.piece].rotations[sim.active.rot]) {
            const y = sim.active.y + c.y
            if (y >= 0) sim.grid[y * COLS + sim.active.x + c.x] = sim.active.piece
        }

        const cleared = sweep()
        if (cleared > 0) {
            sim.score += LINE_SCORE[cleared] * sim.level
            sim.lines += cleared
            sim.level = Math.floor(sim.lines / 10) + 1
        }
        spawn()
    }

    const sim: TetrisSim = {
        grid: new Array(COLS * ROWS).fill(-1),
        active: { piece: 0, rot: 0, x: 0, y: 0 },
        ghost: 0,
        next: 0,
        lines: 0,
        level: 1,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            if (input.pressed & BIT.left) move(-1, 0)
            if (input.pressed & BIT.right) move(1, 0)
            if (input.pressed & BIT.up) spin()
            if (input.pressed & BIT.down && move(0, 1)) fall = 0

            // 54 ticks bei level 1, je level knapp fuenf weniger, unten bei 5 gedeckelt
            const every = Math.max(5, Math.round(54 - (sim.level - 1) * 4.8))
            let landed = false

            if (input.pressed & BIT.alt) {
                sim.active = { ...sim.active, y: drop() }
                landed = true
            } else {
                fall += 1
                if (fall >= (input.held & BIT.down ? Math.min(every, 3) : every)) {
                    fall = 0
                    landed = !move(0, 1)
                }
            }

            if (landed) {
                fall = 0
                lock()
                if (sim.over) return
            }

            sim.ghost = drop()
        },
    }

    sim.next = pull()
    spawn()
    sim.ghost = drop()

    return sim
}
