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
