import { BIT, type Input, type Rng, type Sim } from '../engine.ts'

export const W = 360
export const H = 540
export const BH = 26
export const HOVER = 88
export const BASE_Y = H - 96

const BASE_W = 168
const VIEW = 152
// die alten px/s-werte durch 60 geteilt, gerechnet wird in einheiten je tick
const FALL = 1150 / 60
const SPEED = 148 / 60
const SPEED_MAX = 330 / 60
const SPEED_STEP = 7 / 60
const CAM_EASE = 5 / 60

export type Block = { x: number; w: number; y: number }

export type TowerSim = Sim & {
    stack: Block[]
    cur: Block
    dropping: boolean
    cam: number
}

export function createTower(rng: Rng): TowerSim {
    const base: Block = { x: (W - BASE_W) / 2, w: BASE_W, y: BASE_Y }
    const stack = [base]
    let dir = 1
    let speed = SPEED

    function hover(top: Block): Block {
        return { x: rng() < 0.5 ? 0 : W - top.w, w: top.w, y: top.y - BH - HOVER }
    }

    const sim: TowerSim = {
        stack,
        cur: hover(base),
        dropping: false,
        cam: 0,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return
            if (input.pressed & BIT.fire) sim.dropping = true

            const top = stack[stack.length - 1]

            if (sim.dropping) {
                sim.cur.y += FALL
                if (sim.cur.y >= top.y - BH) {
                    const left = Math.max(top.x, sim.cur.x)
                    const right = Math.min(top.x + top.w, sim.cur.x + sim.cur.w)

                    // unter zwei pixel bleibt nichts stehen, worauf der naechste block passt
                    if (right - left < 2) {
                        sim.over = true
                        return
                    }

                    const placed = { x: left, w: right - left, y: top.y - BH }
                    stack.push(placed)
                    sim.score += 1
                    speed = Math.min(SPEED_MAX, speed + SPEED_STEP)
                    sim.dropping = false
                    sim.cur = hover(placed)
                }
            } else {
                // hin und her ohne sinus, die richtung kippt am rand
                sim.cur.x += dir * speed
                if (sim.cur.x <= 0) {
                    sim.cur.x = 0
                    dir = 1
                } else if (sim.cur.x + sim.cur.w >= W) {
                    sim.cur.x = W - sim.cur.w
                    dir = -1
                }
            }

            const wanted = Math.max(0, VIEW - (stack[stack.length - 1].y - BH - HOVER))
            sim.cam += (wanted - sim.cam) * CAM_EASE
        },
    }

    return sim
}
