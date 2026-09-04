export const COLS = 9
export const ROWS = 9
export const MINES = 10

export type Cell = {
    mine: boolean
    near: number
    open: boolean
    flag: boolean
}

export function blank(): Cell[] {
    return Array.from({ length: COLS * ROWS }, () => ({ mine: false, near: 0, open: false, flag: false }))
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

// erst nach dem ersten klick verteilen, sonst ist der einstieg gluecksache. das feld und
// seine nachbarn bleiben frei, damit der erste klick gleich eine flaeche oeffnet
export function fill(cells: Cell[], safe: number): Cell[] {
    const next = cells.map((c) => ({ ...c }))
    const banned = new Set(neighbors(safe))
    banned.add(safe)

    const pool: number[] = []
    for (let i = 0; i < next.length; i++) if (!banned.has(i)) pool.push(i)

    for (let n = 0; n < MINES; n++) {
        const pick = Math.floor(Math.random() * pool.length)
        next[pool[pick]].mine = true
        pool.splice(pick, 1)
    }

    for (let i = 0; i < next.length; i++) {
        next[i].near = neighbors(i).filter((j) => next[j].mine).length
    }
    return next
}

export function open(cells: Cell[], from: number): Cell[] {
    const next = cells.map((c) => ({ ...c }))
    const queue = [from]
    while (queue.length) {
        const i = queue.pop() as number
        const c = next[i]
        if (c.open || c.flag) continue
        c.open = true
        if (c.near === 0) for (const j of neighbors(i)) queue.push(j)
    }
    return next
}

export function toggleFlag(cells: Cell[], i: number): Cell[] {
    if (cells[i].open) return cells
    const next = cells.slice()
    next[i] = { ...next[i], flag: !next[i].flag }
    return next
}

export function showMines(cells: Cell[]): Cell[] {
    return cells.map((c) => (c.mine ? { ...c, open: true, flag: false } : c))
}

export function opened(cells: Cell[]): number {
    let n = 0
    for (const c of cells) if (c.open && !c.mine) n += 1
    return n
}

export function flags(cells: Cell[]): number {
    let n = 0
    for (const c of cells) if (c.flag) n += 1
    return n
}

export function cleared(cells: Cell[]): boolean {
    return cells.every((c) => c.open || c.mine)
}
