import { randInt, type Input, type Rng, type Sim } from '../engine.ts'

export const PADS = 4

// 420 ms vorlauf, 620 ms pause bis die folge waechst, 180 ms leuchten beim antippen
const LEAD = 25
const GROW = 37
const FLASH = 11

type Phase = 'show' | 'input' | 'grow'

export type SimonSim = Sim & {
    score: number
    over: boolean
    rev: number
    lit: number
}

// 640 ms je glied, pro folgenlaenge 25 ms schneller. unter 250 ms merkt sich das keiner.
function gapFor(len: number) {
    return Math.max(15, 38 - Math.floor((len * 3) / 2))
}

export function createSimon(rng: Rng): SimonSim {
    const seq = [randInt(rng, PADS)]

    let phase: Phase = 'show'
    let at = 0
    let pos = 0
    let wait = LEAD
    let flash = 0

    const sim: SimonSim = {
        lit: -1,
        score: 0,
        over: false,
        rev: 0,

        step(input: Input) {
            if (sim.over) return

            if (flash > 0) {
                flash -= 1
                if (flash === 0) {
                    sim.lit = -1
                    sim.rev += 1
                }
            }

            if (phase === 'show') {
                wait -= 1
                if (wait > 0) return

                const gap = gapFor(seq.length)
                const on = Math.floor((gap * 11) / 20)
                if (sim.lit >= 0) {
                    sim.lit = -1
                    wait = gap - on
                    at += 1
                } else if (at < seq.length) {
                    sim.lit = seq[at]
                    wait = on
                } else {
                    phase = 'input'
                    pos = 0
                    return
                }
                sim.rev += 1
                return
            }

            if (phase === 'grow') {
                wait -= 1
                if (wait > 0) return
                seq.push(randInt(rng, PADS))
                at = 0
                wait = LEAD
                phase = 'show'
                return
            }

            const pad = input.pick
            if (pad < 0 || pad >= PADS) return

            sim.lit = pad
            flash = FLASH
            sim.rev += 1

            if (seq[pos] !== pad) {
                // die punktzahl steht schon auf der zuletzt geschafften laenge
                sim.over = true
                return
            }

            if (pos + 1 === seq.length) {
                sim.score = seq.length
                phase = 'grow'
                wait = GROW
            } else {
                pos += 1
            }
        },
    }

    return sim
}
