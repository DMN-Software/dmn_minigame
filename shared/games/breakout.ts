import { BIT, type Input, type Rng, type Sim } from '../engine.ts'

export const W = 480
export const H = 360
export const COLS = 10
export const ROWS = 5
export const BRICK_W = 42
export const BRICK_H = 16
export const GAP = 4
export const MARGIN = 12
export const TOP = 48
export const PADDLE_W = 72
export const PADDLE_H = 10
export const PADDLE_Y = H - 26
export const R = 5

// tempi in pixeln je tick
const PADDLE_SPEED = 620 / 60
const BASE = 210 / 60

// abpraller laufen ueber das verhaeltnis vx/vy, nicht ueber einen winkel: sin und cos
// sind zwischen den js-engines nicht bitgleich und die wiederholung wuerde auseinanderlaufen
const SERVE_SPREAD = 0.73
const PADDLE_SPREAD = 1.75

export type BreakoutSim = Sim & {
    bricks: boolean[]
    px: number
    x: number
    y: number
    lives: number
    round: number
    stuck: boolean
}

export function createBreakout(rng: Rng): BreakoutSim {
    let vx = 0
    let vy = 0
    let target = -1

    function aim(ratio: number, speed: number) {
        const len = Math.sqrt(ratio * ratio + 1)
        vx = (ratio / len) * speed
        vy = (-1 / len) * speed
    }

    function launch() {
        let speed = BASE
        for (let i = 1; i < sim.round; i++) speed *= 1.12
        aim((rng() - 0.5) * SERVE_SPREAD, speed)
        sim.stuck = false
    }

    function serve() {
        sim.stuck = true
        vx = 0
        vy = 0
        sim.x = sim.px
        sim.y = PADDLE_Y - R - 1
    }

    function bricks(): number {
        for (let i = 0; i < sim.bricks.length; i++) {
            if (!sim.bricks[i]) continue

            const col = i % COLS
            const row = (i / COLS) | 0
            const bx = MARGIN + col * (BRICK_W + GAP)
            const by = TOP + row * (BRICK_H + GAP)
            if (sim.x + R < bx || sim.x - R > bx + BRICK_W) continue
            if (sim.y + R < by || sim.y - R > by + BRICK_H) continue

            sim.bricks[i] = false
            // die flachere ueberdeckung verraet, ueber welche kante der ball gekommen ist
            const ox = Math.min(sim.x + R - bx, bx + BRICK_W - (sim.x - R))
            const oy = Math.min(sim.y + R - by, by + BRICK_H - (sim.y - R))
            if (ox < oy) vx = -vx
            else vy = -vy
            return ROWS - row
        }
        return 0
    }

    function advance(steps: number): number {
        sim.x += vx / steps
        sim.y += vy / steps

        if (sim.x < R) {
            sim.x = R
            vx = Math.abs(vx)
        }
        if (sim.x > W - R) {
            sim.x = W - R
            vx = -Math.abs(vx)
        }
        if (sim.y < R) {
            sim.y = R
            vy = Math.abs(vy)
        }

        if (vy > 0 && sim.y + R >= PADDLE_Y && sim.y - R <= PADDLE_Y + PADDLE_H && Math.abs(sim.x - sim.px) <= PADDLE_W / 2 + R) {
            const off = Math.max(-1, Math.min(1, (sim.x - sim.px) / (PADDLE_W / 2)))
            aim(off * PADDLE_SPREAD, Math.sqrt(vx * vx + vy * vy))
            sim.y = PADDLE_Y - R
        }

        return bricks()
    }

    const sim: BreakoutSim = {
        bricks: new Array(COLS * ROWS).fill(true),
        px: W / 2,
        x: W / 2,
        y: PADDLE_Y - R - 1,
        lives: 3,
        round: 1,
        stuck: true,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            if (input.pick >= 0) target = input.pick
            const dir = (input.held & BIT.right ? 1 : 0) - (input.held & BIT.left ? 1 : 0)
            if (dir !== 0) {
                // sonst zieht ein liegengebliebener zeiger den schlaeger wieder zurueck
                target = -1
                sim.px += dir * PADDLE_SPEED
            } else if (target >= 0) {
                const d = (target / 1000) * W - sim.px
                sim.px += Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, d))
            }
            sim.px = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, sim.px))

            if (sim.stuck) {
                sim.x = sim.px
                sim.y = PADDLE_Y - R - 1
                if (!(input.pressed & BIT.fire)) return
                launch()
            }

            // bei hohem tempo passt der ball sonst zwischen zwei ticks durch einen stein
            const steps = Math.max(1, Math.ceil(Math.sqrt(vx * vx + vy * vy) / 4))
            for (let i = 0; i < steps; i++) {
                sim.score += advance(steps)
                if (sim.y - R > H) {
                    sim.lives -= 1
                    if (sim.lives <= 0) {
                        sim.over = true
                        return
                    }
                    serve()
                    break
                }
            }

            if (sim.bricks.every((b) => !b)) {
                sim.round += 1
                sim.bricks = new Array(COLS * ROWS).fill(true)
                serve()
            }
        },
    }

    return sim
}
