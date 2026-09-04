import { useEffect, useRef, type ReactNode } from 'react'
import { COLS, MINES, createMinesweeper, type Cell } from '../../../../shared/games/minesweeper.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './minesweeper.css'

const HOLD = 400
// kopfzeile und die fasen ringsum gehen von der hoehe ab, bevor das raster geteilt wird
const CHROME = 76

const SEGMENTS: [string, number, number, number, number][] = [
    ['a', 4, 1, 12, 4],
    ['b', 15, 4, 4, 13],
    ['c', 15, 19, 4, 13],
    ['d', 4, 31, 12, 4],
    ['e', 1, 19, 4, 13],
    ['f', 1, 4, 4, 13],
    ['g', 4, 16, 12, 4],
]

const GLYPHS: Record<string, string> = {
    '0': 'abcdef',
    '1': 'bc',
    '2': 'abged',
    '3': 'abgcd',
    '4': 'fgbc',
    '5': 'afgcd',
    '6': 'afgecd',
    '7': 'abc',
    '8': 'abcdefg',
    '9': 'abcdfg',
    '-': 'g',
}

function counter(n: number): string {
    if (n < 0) return '-' + String(Math.min(99, -n)).padStart(2, '0')
    return String(Math.min(999, n)).padStart(3, '0')
}

function Led({ text }: { text: string }) {
    return (
        <span className="mine__led">
            {text.split('').map((ch, i) => (
                <svg key={i} className="mine__digit" viewBox="0 0 20 36">
                    {SEGMENTS.map(([id, x, y, w, h]) => (
                        <rect
                            key={id}
                            x={x}
                            y={y}
                            width={w}
                            height={h}
                            fill={GLYPHS[ch].includes(id) ? '#ff0000' : '#3b0000'}
                        />
                    ))}
                </svg>
            ))}
        </span>
    )
}

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
    const [area, size] = useSquare()
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

    // ganze pixel je feld, sonst franst das relief der fasen aus
    const cell = Math.max(16, Math.floor((size - CHROME) / COLS))
    const board = cell * COLS

    return (
        <div className="mine">
            <div className="mine__area" ref={area}>
                <div className="mine__frame">
                    <div className="mine__head">
                        <Led text={counter(left)} />
                    </div>

                    <div className="mine__board" style={{ width: board, height: board, fontSize: Math.round(cell * 0.62) }}>
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

            <p className="mine__status">Rechtsklick oder halten setzt eine Flagge</p>
        </div>
    )
}
