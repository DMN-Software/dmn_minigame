import { BIT, type Input, type Rng, type Sim } from '../engine.ts'

export const W = 480
export const H = 300
export const PADDLE_W = 8
export const PADDLE_H = 52
export const PX = 18
export const CX = W - 26
export const HALF = 4
export const WIN = 11

// tempi in pixeln je tick
const PLAYER_SPEED = 420 / 60
const CPU_SPEED = 230 / 60
const BASE = 280 / 60
const MAX_SPEED = 660 / 60
const RALLY_STEP = 80 / 60

const AIM = 20
const WIDE_AIM = 40
const SERVE_WAIT = 42

// der abpraller laeuft ueber das verhaeltnis vy/vx statt ueber einen winkel, sin und cos
// sind zwischen den js-engines nicht bitgleich
const SPREAD = 1.03
const MIN_SPREAD = 0.12

export type PongSim = Sim & {
    score: number
    over: boolean
    py: number
    cy: number
    bx: number
    by: number
    cpu: number
}

export function createPong(rng: Rng): PongSim {
    let vx = 0
    let vy = 0
    let aim = 0
    let rally = 0
    let wait = 0
    let target = -1

    function aimError(): number {
        // meist zielt er nur knapp daneben. ohne die seltenen ausreisser kommt er an jeden
        // flachen ball heran und der ballwechsel hoert nie auf
        return (rng() * 2 - 1) * (rng() < 0.06 ? WIDE_AIM : AIM)
    }

    function serve(dir: number) {
        sim.bx = W / 2
        sim.by = H / 2
        vx = dir * BASE
        vy = (rng() - 0.5) * BASE * 0.6
        aim = aimError()
        rally = 0
        wait = SERVE_WAIT
    }

    function hit(paddleY: number, dir: number) {
        const off = Math.max(-1, Math.min(1, (sim.by - paddleY) / (PADDLE_H / 2)))
        // ganz flache baelle laufen sonst ewig auf derselben hoehe hin und her
        const r = Math.abs(off) < 0.12 ? (sim.by < H / 2 ? MIN_SPREAD : -MIN_SPREAD) : off * SPREAD
        // jeder schlagabtausch wird schneller, sonst enden lange ballwechsel nie
        const speed = Math.min(BASE + rally * RALLY_STEP, MAX_SPEED)
        rally += 1
        const len = Math.sqrt(r * r + 1)
        vx = (dir * speed) / len
        vy = (speed * r) / len
        aim = aimError()
    }

    function advance(steps: number) {
        sim.bx += vx / steps
        sim.by += vy / steps

        if (sim.by < HALF) {
            sim.by = HALF
            vy = Math.abs(vy)
        }
        if (sim.by > H - HALF) {
            sim.by = H - HALF
            vy = -Math.abs(vy)
        }

        if (vx < 0 && sim.bx - HALF <= PX + PADDLE_W && sim.bx + HALF >= PX && Math.abs(sim.by - sim.py) <= PADDLE_H / 2 + HALF) {
            sim.bx = PX + PADDLE_W + HALF
            hit(sim.py, 1)
        }
        if (vx > 0 && sim.bx + HALF >= CX && sim.bx - HALF <= CX + PADDLE_W && Math.abs(sim.by - sim.cy) <= PADDLE_H / 2 + HALF) {
            sim.bx = CX - HALF
            hit(sim.cy, -1)
        }
    }

    const sim: PongSim = {
        py: H / 2,
        cy: H / 2,
        bx: W / 2,
        by: H / 2,
        cpu: 0,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            if (input.pick >= 0) target = input.pick
            const dir = (input.held & BIT.down ? 1 : 0) - (input.held & BIT.up ? 1 : 0)
            if (dir !== 0) {
                // sonst zieht ein liegengebliebener zeiger den schlaeger wieder zurueck
                target = -1
                sim.py += dir * PLAYER_SPEED
            } else if (target >= 0) {
                const d = (target / 1000) * H - sim.py
                sim.py += Math.max(-PLAYER_SPEED, Math.min(PLAYER_SPEED, d))
            }
            sim.py = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, sim.py))

            // der rechner zielt nur grob und kommt bei steilen baellen nicht hinterher
            const chase = vx > 0 && sim.bx > W * 0.35
            const goal = chase ? sim.by + aim : H / 2
            const reach = CPU_SPEED * (chase ? 1 : 0.5)
            sim.cy += Math.max(-reach, Math.min(reach, goal - sim.cy))
            sim.cy = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, sim.cy))

            if (wait > 0) {
                wait -= 1
                return
            }

            const steps = Math.max(1, Math.ceil(Math.sqrt(vx * vx + vy * vy) / 4))
            for (let i = 0; i < steps; i++) advance(steps)

            if (sim.bx < -HALF) {
                sim.cpu += 1
                serve(-1)
            } else if (sim.bx > W + HALF) {
                sim.score += 1
                serve(1)
            }

            if (sim.score >= WIN || sim.cpu >= WIN) sim.over = true
        },
    }

    serve(rng() < 0.5 ? -1 : 1)

    return sim
}
