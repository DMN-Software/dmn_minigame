import { BIT, type Input, type Rng, type Sim } from '../engine.ts'

export const W = 360
export const H = 540
export const PW = 26
export const PH = 26
export const PLAT_W = 66
export const PLAT_H = 10

const START_Y = H - 80
const BASE_Y = START_Y - PH / 2
const UNIT = 10
// die alten px/s-werte durch 60 geteilt, gerechnet wird in einheiten je tick
const GRAVITY = 1500 / 3600
const JUMP = -660 / 60
const MOVE = 300 / 60

export type Plat = { x: number; y: number }

export type DoodleSim = Sim & {
    x: number
    y: number
    plats: Plat[]
    cam: number
}

export function createDoodle(rng: Rng): DoodleSim {
    const plats: Plat[] = [{ x: (W - PLAT_W) / 2, y: START_Y }]
    let vy = 0
    let peak = BASE_Y

    function addPlat() {
        const last = plats[plats.length - 1]
        // der sprung schafft knapp 140 px, mehr als 122 laesst sich seitlich nicht mehr ausgleichen
        const reach = Math.min(122, 96 + (START_Y - last.y) / 90)
        plats.push({ x: rng() * (W - PLAT_W), y: last.y - (58 + rng() * (reach - 58)) })
    }

    while (plats[plats.length - 1].y > -H) addPlat()

    const sim: DoodleSim = {
        x: W / 2,
        y: BASE_Y,
        plats,
        cam: 0,
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            const dir = (input.held & BIT.right ? 1 : 0) - (input.held & BIT.left ? 1 : 0)
            sim.x += dir * MOVE
            if (sim.x < 0) sim.x += W
            if (sim.x > W) sim.x -= W

            const was = sim.y + PH / 2
            vy += GRAVITY
            sim.y += vy
            const now = sim.y + PH / 2

            if (vy > 0) {
                for (const p of plats) {
                    if (was > p.y || now < p.y) continue
                    let dx = sim.x - (p.x + PLAT_W / 2)
                    if (dx > W / 2) dx -= W
                    if (dx < -W / 2) dx += W
                    if (Math.abs(dx) < (PLAT_W + PW) / 2 - 3) {
                        sim.y = p.y - PH / 2
                        vy = JUMP
                        break
                    }
                }
            }

            if (sim.y - sim.cam < 220) sim.cam = sim.y - 220
            if (sim.y < peak) {
                peak = sim.y
                const height = Math.floor((BASE_Y - peak) / UNIT)
                if (height > sim.score) sim.score = height
            }

            while (plats[plats.length - 1].y > sim.cam - 40) addPlat()
            while (plats[0].y > sim.cam + H + 60) plats.shift()

            if (sim.y - sim.cam > H + PH) sim.over = true
        },
    }

    return sim
}
