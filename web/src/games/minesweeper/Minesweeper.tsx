import { useEffect, useRef, type ReactNode } from 'react'
import { COLS, MINES, createMinesweeper, type Cell } from '../../../../shared/games/minesweeper.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
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

export default function Minesweeper(props: GameProps) {
    const sim = useSim({ create: createMinesweeper, props })
    const [area, size] = useSquare(380)
    const press = useRef(0)
    const skip = useRef(false)

    useEffect(() => () => window.clearTimeout(press.current), [])

    const busy = props.paused || sim.over

    // gerade meldung deckt auf, ungerade setzt die flagge
    const down = (i: number, button: number) => {
        if (button !== 0 || busy) return
        skip.current = false
        press.current = window.setTimeout(() => {
            skip.current = true
            props.controls.choose(i * 2 + 1)
        }, HOLD)
    }

    const up = (i: number) => {
        window.clearTimeout(press.current)
        if (skip.current || busy) return
        props.controls.choose(i * 2)
    }

    const abort = () => {
        window.clearTimeout(press.current)
        skip.current = true
    }

    let left = MINES
    for (const c of sim.cells) if (c.flag) left -= 1
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
                    {sim.cells.map((c, i) => (
                        <button
                            key={i}
                            type="button"
                            className={cellClass(c, sim.boom === i)}
                            onPointerDown={(e) => down(i, e.button)}
                            onPointerUp={() => up(i)}
                            onPointerLeave={abort}
                            onPointerCancel={abort}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                // beim halten auf dem touchscreen kommt contextmenu hinterher,
                                // die flagge liegt dann schon
                                if (skip.current || busy) return
                                abort()
                                props.controls.choose(i * 2 + 1)
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
