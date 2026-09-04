import { useCallback, useEffect, useRef, useState } from 'react'
import { aiMove, emptyBoard, judge, type Board, type Player, type Result } from './minimax.ts'
import type { GameProps } from '../../shell/types.ts'
import { useSquare } from '../../shell/useSquare.ts'
import './tictactoe.css'

// ein perfekter gegner ist unschlagbar und damit langweilig, also patzt er ab und zu
const SLIP = 0.2
const THINK = 320
const NEXT_ROUND = 900

function cellClass(mark: Player | null, result: Result | null, i: number): string {
    let cls = 'cell ttt__cell'
    if (mark) cls += mark === 'X' ? ' ttt__cell--x' : ' ttt__cell--o'
    if (result && result.line.includes(i)) cls += ' ttt__cell--win'
    return cls
}

function status(result: Result | null, turn: Player): string {
    if (!result) return turn === 'X' ? 'Du bist X' : 'O überlegt'
    if (result.winner === 'X') return 'Gewonnen'
    if (result.winner === 'O') return 'Verloren'
    return 'Unentschieden'
}

export default function TicTacToe({ paused, onScore, onGameOver }: GameProps) {
    const [board, setBoard] = useState<Board>(emptyBoard)
    const [turn, setTurn] = useState<Player>('X')
    const [result, setResult] = useState<Result | null>(null)
    const [streak, setStreak] = useState(0)
    const [dead, setDead] = useState(false)
    const [area, size] = useSquare(380, 120)
    const wins = useRef(0)

    const settle = useCallback(
        (next: Board) => {
            setBoard(next)
            const res = judge(next)
            if (!res) {
                setTurn((t) => (t === 'X' ? 'O' : 'X'))
                return
            }
            setResult(res)
            if (res.winner === 'X') {
                wins.current += 1
                setStreak(wins.current)
                onScore(wins.current)
            } else if (res.winner === 'O') {
                setDead(true)
                onGameOver(wins.current)
            }
        },
        [onScore, onGameOver],
    )

    // der zug von O haengt am zustand, damit eine pause ihn anhaelt statt ihn durchlaufen zu lassen
    useEffect(() => {
        if (paused || dead || result || turn !== 'O') return
        const t = window.setTimeout(() => {
            const next = board.slice()
            next[aiMove(board, SLIP)] = 'O'
            settle(next)
        }, THINK)
        return () => window.clearTimeout(t)
    }, [paused, dead, result, turn, board, settle])

    useEffect(() => {
        if (!result || dead || paused) return
        const t = window.setTimeout(() => {
            setBoard(emptyBoard())
            setTurn('X')
            setResult(null)
        }, NEXT_ROUND)
        return () => window.clearTimeout(t)
    }, [result, dead, paused])

    const play = (i: number) => {
        if (paused || dead || result || turn !== 'X' || board[i]) return
        const next = board.slice()
        next[i] = 'X'
        settle(next)
    }

    return (
        <div className="ttt">
            <p className="ttt__status">
                <span>{status(result, turn)}</span>
                <span className="ttt__streak">Serie {streak}</span>
            </p>

            <div className="ttt__area" ref={area}>
                <div className="ttt__board" style={{ width: size, height: size, fontSize: Math.round(size * 0.2) }}>
                    {board.map((mark, i) => (
                        <button
                            key={i}
                            type="button"
                            className={cellClass(mark, result, i)}
                            disabled={paused || dead || !!result || !!mark || turn !== 'X'}
                            onClick={() => play(i)}
                        >
                            {mark}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
