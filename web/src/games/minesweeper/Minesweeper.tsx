import { useEffect, useRef, useState, type ReactNode } from 'react'
import { COLS, MINES, blank, cleared, fill, flags, open, opened, showMines, toggleFlag, type Cell } from './field.ts'
import type { GameProps } from '../../shell/types.ts'
import { useSquare } from '../../shell/useSquare.ts'
import './minesweeper.css'

const HOLD = 400

function cellClass(c: Cell, boom: boolean): string {
    let cls = 'mine__cell'
    if (c.open) cls += ' mine__cell--open'
    if (c.open && !c.mine && c.near > 0) cls += ' mine__n' + c.near
    if (boom) cls += ' mine__cell--boom'
    return cls
}

function face(c: Cell): ReactNode {
    if (!c.open) return c.flag ? <span className="mine__flag" /> : null
    if (c.mine) return <span className="mine__bomb" />
    return c.near > 0 ? c.near : null
}

export default function Minesweeper({ paused, onScore, onGameOver }: GameProps) {
    const [cells, setCells] = useState<Cell[]>(blank)
    const [boom, setBoom] = useState(-1)
    const [dead, setDead] = useState(false)
    const [area, size] = useSquare(380)
    const armed = useRef(false)
    const press = useRef(0)
    const skip = useRef(false)

    useEffect(() => () => window.clearTimeout(press.current), [])

    const flag = (i: number) => {
        if (paused || dead) return
        setCells((prev) => toggleFlag(prev, i))
    }

    const dig = (i: number) => {
        if (paused || dead) return

        const base = armed.current ? cells : fill(cells, i)
        armed.current = true
        if (base[i].open || base[i].flag) {
            setCells(base)
            return
        }

        if (base[i].mine) {
            const shown = showMines(base)
            setCells(shown)
            setBoom(i)
            setDead(true)
            onGameOver(opened(shown))
            return
        }

        const next = open(base, i)
        setCells(next)
        const score = opened(next)
        onScore(score)
        if (cleared(next)) {
            setDead(true)
            onGameOver(score)
        }
    }

    const down = (i: number, button: number) => {
        if (button !== 0 || paused || dead) return
        skip.current = false
        press.current = window.setTimeout(() => {
            skip.current = true
            flag(i)
        }, HOLD)
    }

    const up = (i: number) => {
        window.clearTimeout(press.current)
        if (skip.current) return
        dig(i)
    }

    const abort = () => {
        window.clearTimeout(press.current)
        skip.current = true
    }

    const left = MINES - flags(cells)
    const cell = Math.floor(size / COLS)

    return (
        <div className="mine">
            <p className="mine__status">
                <span className="mine__count">Minen {left}</span>
                <span>Rechtsklick oder halten setzt eine Flagge</span>
            </p>

            <div className="mine__area" ref={area}>
                <div
                    className="mine__board"
                    style={{ width: size, height: size, fontSize: Math.round(cell * 0.55) }}
                >
                    {cells.map((c, i) => (
                        <button
                            key={i}
                            type="button"
                            className={cellClass(c, boom === i)}
                            onPointerDown={(e) => down(i, e.button)}
                            onPointerUp={() => up(i)}
                            onPointerLeave={abort}
                            onPointerCancel={abort}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                // beim halten auf dem touchscreen kommt contextmenu hinterher,
                                // die flagge liegt dann schon
                                if (skip.current) return
                                abort()
                                flag(i)
                            }}
                        >
                            {face(c)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
