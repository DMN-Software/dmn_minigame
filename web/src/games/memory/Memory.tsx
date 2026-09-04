import { createMemory } from '../../../../shared/games/memory.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './memory.css'

const MOTIVE = [
    { d: 'M12 3 L21.5 20.5 L2.5 20.5 Z', c: '#c0392b' },
    { d: 'M4.5 4.5 H19.5 V19.5 H4.5 Z', c: '#2471a3' },
    { d: 'M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z', c: '#1e8449' },
    { d: 'M12 3 A9 9 0 1 0 12 21 A9 9 0 1 0 12 3 Z', c: '#b7950b' },
    { d: 'M12 2.5 L14.7 9.5 L22 9.9 L16.3 14.5 L18.2 21.5 L12 17.5 L5.8 21.5 L7.7 14.5 L2 9.9 L9.3 9.5 Z', c: '#6c3483' },
    { d: 'M9.5 3 H14.5 V9.5 H21 V14.5 H14.5 V21 H9.5 V14.5 H3 V9.5 H9.5 Z', c: '#ca6f1e' },
    { d: 'M12 2.5 L20.5 7.2 V16.8 L12 21.5 L3.5 16.8 V7.2 Z', c: '#117a65' },
    { d: 'M12 2.5 C18.5 8 18.5 16.5 12 21.5 C5.5 16.5 5.5 8 12 2.5 Z', c: '#212f3d' },
]

export default function Memory(props: GameProps) {
    const sim = useSim({ create: createMemory, props })
    const [area, size] = useSquare()

    const gap = Math.max(5, Math.round(size * 0.018))

    return (
        <div className="mem" ref={area}>
            <div className="mem__board" style={{ width: size, height: size, gap }}>
                {sim.cards.map((card, i) => {
                    const done = sim.found.includes(card.sym)
                    const up = done || sim.open.includes(i)
                    const motive = MOTIVE[card.sym]
                    return (
                        <button
                            key={card.id}
                            type="button"
                            className={done ? 'mem__card mem__card--done' : 'mem__card'}
                            onClick={() => props.controls.choose(i)}
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
        </div>
    )
}
