import { BIT, type Input, type Rng, type Sim } from '../engine.ts'

export const W = 360
export const H = 540
export const GROUND = 64
export const PIPE_W = 54
export const BIRD_X = 104
export const BIRD_R = 11

const SPACING = 184
// die alten px/s-werte durch 60 geteilt, gerechnet wird in einheiten je tick
const GRAVITY = 1250 / 3600
const FLAP = -352 / 60
const SPEED = 134 / 60
const SPEED_MAX = 210 / 60
const SPEED_STEP = 1.6 / 60

export type Pipe = { x: number; y: number; half: number; passed: boolean }

export type FlappySim = Sim & {
    y: number
    vy: number
    pipes: Pipe[]
    started: boolean
}

export function createFlappy(rng: Rng): FlappySim {
    const pipes: Pipe[] = []
    let speed = SPEED

    function addPipe(score: number) {
        // die luecke schrumpft mit dem punktestand, bleibt aber ueber vier vogelhoehen
        const half = Math.max(52, 76 - score * 1.1)
        const min = half + 46
        const max = H - GROUND - half - 34
        const last = pipes[pipes.length - 1]
        let y = min + rng() * (max - min)
        // mehr als 150 px hoehenunterschied zur vorigen luecke schafft der vogel nicht rechtzeitig
        if (last) y = Math.max(last.y - 150, Math.min(last.y + 150, y))
        pipes.push({ x: last ? last.x + SPACING : W + 90, y, half, passed: false })
    }

    const sim: FlappySim = {
        y: H / 2 - 40,
        vy: 0,
        pipes,
        started: false,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            if (input.pressed & BIT.fire) {
                sim.started = true
                sim.vy = FLAP
            }

            // vor dem ersten flattern faellt nichts, sonst ist man beim laden schon tot
            if (!sim.started) return

            sim.vy += GRAVITY
            sim.y += sim.vy

            for (const p of pipes) p.x -= speed
            while (pipes.length && pipes[0].x + PIPE_W < -20) pipes.shift()

            const last = pipes[pipes.length - 1]
            if (!last || last.x < W - SPACING) addPipe(sim.score)

            for (const p of pipes) {
                if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
                    p.passed = true
                    sim.score += 1
                    speed = Math.min(SPEED_MAX, speed + SPEED_STEP)
                }
            }

            const top = sim.y - BIRD_R
            const bottom = sim.y + BIRD_R
            let hit = top < 0 || bottom > H - GROUND

            for (const p of pipes) {
                if (BIRD_X + BIRD_R < p.x || BIRD_X - BIRD_R > p.x + PIPE_W) continue
                if (top < p.y - p.half || bottom > p.y + p.half) hit = true
            }

            if (hit) sim.over = true
        },
    }

    return sim
}
