import { shuffle, type Input, type Rng, type Sim } from '../engine.ts'

// acht paare auf sechzehn karten, die motive dazu liegen im renderer
const PAIRS = 8
// 700 ms, sonst ist die zweite karte weg, bevor man sie gelesen hat
const HOLD = 42

export type Card = { id: number; sym: number }

export type MemorySim = Sim & {
    score: number
    over: boolean
    rev: number
    cards: Card[]
    open: number[]
    found: number[]
}

export function createMemory(rng: Rng): MemorySim {
    const deck: Card[] = []
    for (let sym = 0; sym < PAIRS; sym++) {
        deck.push({ id: sym * 2, sym }, { id: sym * 2 + 1, sym })
    }

    let misses = 0
    let hold = 0

    function settle() {
        const a = sim.cards[sim.open[0]]
        const b = sim.cards[sim.open[1]]
        if (a.sym === b.sym) sim.found.push(a.sym)
        else misses += 1

        sim.open.length = 0
        sim.score = Math.max(0, sim.found.length * 100 - misses * 10)
        sim.rev += 1
        if (sim.found.length === PAIRS) sim.over = true
    }

    const sim: MemorySim = {
        cards: shuffle(rng, deck),
        open: [],
        found: [],
        score: 0,
        over: false,
        rev: 0,

        step(input: Input) {
            if (sim.over) return

            // solange zwei karten offen liegen, laeuft nur die wartezeit
            if (hold > 0) {
                hold -= 1
                if (hold === 0) settle()
                return
            }

            const i = input.pick
            if (i < 0 || i >= sim.cards.length) return
            if (sim.open.includes(i) || sim.found.includes(sim.cards[i].sym)) return

            sim.open.push(i)
            sim.rev += 1
            if (sim.open.length === 2) hold = HOLD
        },
    }

    return sim
}
