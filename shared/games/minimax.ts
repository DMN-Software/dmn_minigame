import { randInt, type Rng } from '../engine.ts'

export type Player = 'X' | 'O'
export type Board = (Player | null)[]
export type Result = { winner: Player | null; line: number[] }

const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]

export function emptyBoard(): Board {
    return [null, null, null, null, null, null, null, null, null]
}

export function judge(b: Board): Result | null {
    for (const line of LINES) {
        const mark = b[line[0]]
        if (mark && mark === b[line[1]] && mark === b[line[2]]) return { winner: mark, line }
    }
    return b.every((m) => m !== null) ? { winner: null, line: [] } : null
}

// aus sicht von O. die tiefe geht mit ein, damit ein sieg frueh und eine niederlage
// so spaet wie moeglich kommt
function value(b: Board, turn: Player, depth: number): number {
    const res = judge(b)
    if (res) {
        if (res.winner === 'O') return 10 - depth
        if (res.winner === 'X') return depth - 10
        return 0
    }

    let out = turn === 'O' ? -Infinity : Infinity
    for (let i = 0; i < 9; i++) {
        if (b[i]) continue
        b[i] = turn
        const v = value(b, turn === 'O' ? 'X' : 'O', depth + 1)
        b[i] = null
        out = turn === 'O' ? Math.max(out, v) : Math.min(out, v)
    }
    return out
}

export function aiMove(rng: Rng, board: Board, slip: number): number {
    const free: number[] = []
    for (let i = 0; i < 9; i++) if (!board[i]) free.push(i)
    if (rng() < slip) return free[randInt(rng, free.length)]

    const work = board.slice()
    let top = -Infinity
    let picks: number[] = []
    for (const i of free) {
        work[i] = 'O'
        const v = value(work, 'X', 1)
        work[i] = null
        if (v > top) {
            top = v
            picks = [i]
        } else if (v === top) {
            // gleichwertige zuege wuerfeln, sonst spielt O jede partie dieselbe eroeffnung
            picks.push(i)
        }
    }
    return picks[randInt(rng, picks.length)]
}
