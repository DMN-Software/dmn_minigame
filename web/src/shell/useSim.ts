import { useEffect, useRef, useState, type RefObject } from 'react'
import { Recorder, TICK, makeRng, type Rng, type Sim } from '../../../shared/engine.ts'
import { useGameLoop } from './useGameLoop.ts'
import type { Controls, GameProps } from './types.ts'

type Options<T extends Sim> = {
    create: (rng: Rng) => T
    props: GameProps
    // canvas-spiele zeichnen hier, dom-spiele lassen beides weg und rendern aus sim.rev
    canvas?: RefObject<HTMLCanvasElement | null>
    draw?: (ctx: CanvasRenderingContext2D, sim: T) => void
    // was in diesem tick im pick-kanal steht, standard ist die anstehende feldwahl
    sample?: (controls: Controls, tick: number) => number
}

// nur was hier ins protokoll laeuft, kann der server nachspielen. ein spiel darf seinen
// zustand deshalb ausschliesslich ueber step() aendern.
export function useSim<T extends Sim>({ create, props, canvas, draw, sample }: Options<T>) {
    const { seed, paused, controls, onScore, onGameOver } = props

    const sim = useRef<T | null>(null)
    if (!sim.current) sim.current = create(makeRng(seed))

    const rec = useRef(new Recorder())
    const prev = useRef(0)
    const shown = useRef(-1)
    const drawn = useRef(-1)
    const done = useRef(false)
    const acc = useRef(0)
    const [, bump] = useState(0)

    useGameLoop((dt) => {
        const s = sim.current
        if (!s || done.current) return

        acc.current += dt
        while (acc.current >= TICK && !s.over) {
            acc.current -= TICK
            const held = controls.mask()
            const pick = sample ? sample(controls, rec.current.tick) : controls.takePick()
            rec.current.write(held, pick)
            // dieselbe rechnung wie in replay(), sonst laeuft der lauf serverseitig anders
            s.step({ held, pressed: held & ~prev.current, pick })
            prev.current = held
            rec.current.tick += 1
        }

        if (s.score !== shown.current) {
            shown.current = s.score
            onScore(s.score)
        }

        if (canvas?.current && draw) {
            const ctx = canvas.current.getContext('2d')
            if (ctx) draw(ctx, s)
        } else if ((s.rev ?? 0) !== drawn.current) {
            drawn.current = s.rev ?? 0
            bump((n) => n + 1)
        }

        if (s.over) {
            done.current = true
            onGameOver(s.score, rec.current.log)
        }
    }, !paused)

    useEffect(() => {
        // beim pausieren die aufgelaufene zeit verwerfen, sonst holt das spiel nach dem
        // fortsetzen alle verpassten ticks auf einmal nach
        if (paused) acc.current = 0
    }, [paused])

    return sim.current as T
}
