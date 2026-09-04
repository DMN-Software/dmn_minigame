import type { Input, Rng, Sim } from '../engine.ts'
import { aiMove, emptyBoard, judge, type Board, type Player, type Result } from './minimax.ts'

// ein perfekter gegner ist unschlagbar und damit langweilig, also patzt er ab und zu
const SLIP = 0.2
// bedenkzeit und standzeit der gewinnlinie in ticks, 60 ticks sind eine sekunde
const THINK = 20
const NEXT_ROUND = 54

export type TicTacToeSim = Sim & {
    board: Board
    turn: Player
    result: Result | null
}

export function createTicTacToe(rng: Rng): TicTacToeSim {
    const board = emptyBoard()
    let turn: Player = 'X'
    let result: Result | null = null
    let wins = 0
    let dead = false
    let rev = 0
    let wait = 0

    function settle() {
        rev += 1
        result = judge(board)
        if (!result) {
            turn = turn === 'X' ? 'O' : 'X'
            if (turn === 'O') wait = THINK
            return
        }
        if (result.winner === 'X') wins += 1
        if (result.winner === 'O') dead = true
        wait = NEXT_ROUND
    }

    return {
        board,
        get turn() {
            return turn
        },
        get result() {
            return result
        },
        get score() {
            return wins
        },
        get over() {
            return dead
        },
        get rev() {
            return rev
        },

        step(input: Input) {
            if (dead) return

            if (result) {
                wait -= 1
                if (wait > 0) return
                board.fill(null)
                result = null
                turn = 'X'
                rev += 1
                return
            }

            if (turn === 'O') {
                wait -= 1
                if (wait > 0) return
                board[aiMove(rng, board, SLIP)] = 'O'
                settle()
                return
            }

            if (input.pick < 0 || input.pick > 8 || board[input.pick]) return
            board[input.pick] = 'X'
            settle()
        },
    }
}
