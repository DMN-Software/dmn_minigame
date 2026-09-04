import { useEffect, useState } from 'react'
import type { GameProps } from '../../shell/types.ts'
import './memory.css'

const HOLD = 700

const MOTIVE = [
    { d: 'M12 3 L21.5 20.5 L2.5 20.5 Z', c: 'var(--p1)' },
    { d: 'M4.5 4.5 H19.5 V19.5 H4.5 Z', c: 'var(--p2)' },
    { d: 'M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z', c: 'var(--p3)' },
    { d: 'M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 Z', c: 'var(--p4)' },
    { d: 'M12 2.5 L14.7 9.5 L22 9.9 L16.3 14.5 L18.2 21.5 L12 17.5 L5.8 21.5 L7.7 14.5 L2 9.9 L9.3 9.5 Z', c: 'var(--p5)' },
    { d: 'M9.5 3 H14.5 V9.5 H21 V14.5 H14.5 V21 H9.5 V14.5 H3 V9.5 H9.5 Z', c: 'var(--p6)' },
    { d: 'M12 2.5 L20.5 7.2 V16.8 L12 21.5 L3.5 16.8 V7.2 Z', c: 'var(--bad)' },
    { d: 'M12 2.5 C18.5 8 18.5 16.5 12 21.5 C5.5 16.5 5.5 8 12 2.5 Z', c: 'var(--text)' },
]

type Card = { id: number; sym: number }

function deal(): Card[] {
    const cards: Card[] = []
    for (let sym = 0; sym < MOTIVE.length; sym++) {
        cards.push({ id: sym * 2, sym }, { id: sym * 2 + 1, sym })
    }
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const t = cards[i]
        cards[i] = cards[j]
        cards[j] = t
    }
    return cards
}

function points(pairs: number, misses: number) {
    return Math.max(0, pairs * 100 - misses * 10)
}

export default function Memory({ paused, onScore, onGameOver }: GameProps) {
    const [cards] = useState(deal)
    const [open, setOpen] = useState<number[]>([])
    const [found, setFound] = useState<number[]>([])
    const [misses, setMisses] = useState(0)

    // pausiert der host mitten im vergleich, laeuft die wartezeit danach neu an
    useEffect(() => {
        if (paused || open.length < 2) return

        const hit = cards[open[0]].sym === cards[open[1]].sym
        const t = window.setTimeout(() => {
            setOpen([])
            if (hit) {
                const pairs = found.length + 1
                setFound([...found, cards[open[0]].sym])
                onScore(points(pairs, misses))
                if (pairs === MOTIVE.length) onGameOver(points(pairs, misses))
            } else {
                setMisses(misses + 1)
                onScore(points(found.length, misses + 1))
            }
        }, HOLD)

        return () => clearTimeout(t)
    }, [paused, open, cards, found, misses, onScore, onGameOver])

    function flip(i: number) {
        if (paused || open.length > 1) return
        if (open.includes(i) || found.includes(cards[i].sym)) return
        setOpen([...open, i])
    }

    return (
        <div className="grid-game mem__board">
            {cards.map((card, i) => {
                const done = found.includes(card.sym)
                const up = done || open.includes(i)
                const motive = MOTIVE[card.sym]
                return (
                    <button
                        key={card.id}
                        type="button"
                        className={done ? 'mem__card mem__card--done' : 'mem__card'}
                        onClick={() => flip(i)}
                    >
                        <span className={up ? 'mem__inner mem__inner--up' : 'mem__inner'}>
                            <span className="mem__face mem__face--back" />
                            <span className="mem__face mem__face--front">
                                <svg viewBox="0 0 24 24">
                                    <path d={motive.d} fill={motive.c} />
                                </svg>
                            </span>
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
