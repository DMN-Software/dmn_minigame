import { SIZE, create2048, type Tile } from '../../../../shared/games/g2048.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './g2048.css'

const SLOTS = Array.from({ length: SIZE * SIZE }, (_, i) => i)

function fontScale(value: number): number {
    if (value < 100) return 0.44
    if (value < 1000) return 0.34
    return 0.26
}

function faceClass(t: Tile): string {
    let cls = 'g2048__face g2048__face--v' + (t.value <= 2048 ? t.value : 'max')
    if (t.born) cls += ' g2048__face--born'
    if (t.merged) cls += ' g2048__face--pop'
    return cls
}

export default function G2048(props: GameProps) {
    const sim = useSim({ create: create2048, props })
    const [area, size] = useSquare(380)

    const gap = Math.max(4, Math.round(size * 0.022))
    const cell = (size - gap * (SIZE + 1)) / SIZE
    const at = (n: number) => gap + n * (cell + gap)

    return (
        <div className="g2048" ref={area}>
            <div className="g2048__board" style={{ width: size, height: size }}>
                {SLOTS.map((i) => (
                    <div
                        key={i}
                        className="g2048__slot"
                        style={{
                            width: cell,
                            height: cell,
                            transform: 'translate(' + at(i % SIZE) + 'px,' + at(Math.floor(i / SIZE)) + 'px)',
                        }}
                    />
                ))}

                {sim.tiles.map((t) => (
                    <div
                        key={t.id}
                        className={t.gone ? 'g2048__tile g2048__tile--gone' : 'g2048__tile'}
                        style={{
                            width: cell,
                            height: cell,
                            transform: 'translate(' + at(t.x) + 'px,' + at(t.y) + 'px)',
                        }}
                    >
                        <div className={faceClass(t)} style={{ fontSize: Math.round(cell * fontScale(t.value)) }}>
                            {t.value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
