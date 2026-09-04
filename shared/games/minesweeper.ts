import { randInt, type Input, type Rng, type Sim } from '../engine.ts'

export const COLS = 9
export const ROWS = 9
export const MINES = 10

export type Cell = {
    mine: boolean
    near: number
    open: boolean
    flag: boolean
}

export type MinesweeperSim = Sim & {
    cells: Cell[]
    // feld, auf dem der lauf geendet hat, sonst -1
    boom: number
}

function neighbors(i: number): number[] {
    const x = i % COLS
    const y = Math.floor(i / COLS)
    const out: number[] = []
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue
            out.push(ny * COLS + nx)
        }
    }
    return out
}

export function createMinesweeper(rng: Rng): MinesweeperSim {
    const cells: Cell[] = Array.from({ length: COLS * ROWS }, () => ({
        mine: false,
        near: 0,
        open: false,
        flag: false,
    }))

    let boom = -1
    let score = 0
    let over = false
    let rev = 0
    let armed = false

    // erst nach dem ersten klick verteilen, sonst ist der einstieg gluecksache. das feld
    // und seine nachbarn bleiben frei, damit der erste klick gleich eine flaeche oeffnet
    function fill(safe: number) {
        const banned = neighbors(safe)
        banned.push(safe)

        const pool: number[] = []
        for (let i = 0; i < cells.length; i++) if (!banned.includes(i)) pool.push(i)

        for (let n = 0; n < MINES; n++) {
            const at = randInt(rng, pool.length)
            cells[pool[at]].mine = true
            pool.splice(at, 1)
        }

        for (let i = 0; i < cells.length; i++) {
            cells[i].near = neighbors(i).filter((j) => cells[j].mine).length
        }
    }

    function flood(from: number) {
        const queue = [from]
        for (let q = 0; q < queue.length; q++) {
            const c = cells[queue[q]]
            if (c.open || c.flag) continue
            c.open = true
            if (c.near === 0) for (const j of neighbors(queue[q])) queue.push(j)
        }
    }

    function counted(): number {
        let n = 0
        for (const c of cells) if (c.open && !c.mine) n += 1
        return n
    }

    function dig(i: number) {
        if (!armed) {
            fill(i)
            armed = true
        }

        const c = cells[i]
        if (c.open || c.flag) return

        if (c.mine) {
            for (const m of cells) {
                if (!m.mine) continue
                m.open = true
                m.flag = false
            }
            boom = i
            over = true
            rev += 1
            return
        }

        flood(i)
        score = counted()
        rev += 1
        if (cells.every((m) => m.open || m.mine)) over = true
    }

    return {
        cells,
        get boom() {
            return boom
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
            if (over || input.pick < 0 || input.pick >= COLS * ROWS * 2) return

            const i = input.pick >> 1
            // gerade meldung deckt auf, ungerade setzt die flagge
            if (input.pick % 2 === 0) {
                dig(i)
                return
            }

            if (cells[i].open) return
            cells[i].flag = !cells[i].flag
            rev += 1
        },
    }
}
