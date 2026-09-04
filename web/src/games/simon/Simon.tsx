import { createSimon } from '../../../../shared/games/simon.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './simon.css'

const PADS = [0, 1, 2, 3]

export default function Simon(props: GameProps) {
    const sim = useSim({ create: createSimon, props })
    const [area, size] = useSquare()

    return (
        <div className="simon" ref={area}>
            <div className="simon__disc" style={{ width: size, height: size }}>
                {PADS.map((pad) => (
                    <button
                        key={pad}
                        type="button"
                        className={'simon__pad simon__pad--' + pad + (sim.lit === pad ? ' simon__pad--lit' : '')}
                        onClick={() => props.controls.choose(pad)}
                    />
                ))}

                <div className="simon__hub" style={{ fontSize: Math.round(size * 0.09) }}>
                    {sim.score}
                </div>
            </div>
        </div>
    )
}
