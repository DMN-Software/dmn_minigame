export const TICK_HZ = 60
export const TICK = 1 / TICK_HZ

// ein lauf laenger als eine halbe stunde ist kein lauf mehr, und die wiederholung
// auf dem server soll ein festes budget haben
export const MAX_TICKS = TICK_HZ * 60 * 30
export const MAX_LOG = 120000
export const MAX_PICK = 4095

export type Action = 'up' | 'down' | 'left' | 'right' | 'fire' | 'alt'

export const BIT: Record<Action, number> = {
    up: 1,
    down: 2,
    left: 4,
    right: 8,
    fire: 16,
    alt: 32,
}

export type Input = {
    /** bitmaske der gehaltenen aktionen */
    held: number
    /** was in genau diesem tick dazugekommen ist */
    pressed: number
    /**
     * spielabhaengiger diskreter kanal, gilt nur fuer diesen tick, sonst -1.
     * klickspiele legen hier das gewaehlte feld ab, schlaegerspiele die zielposition
     * in tausendsteln - die schreiben aber hoechstens jeden vierten tick, sonst
     * blaeht dauernde mausbewegung das protokoll auf.
     */
    pick: number
}

export type Sim = {
    step(input: Input): void
    readonly score: number
    readonly over: boolean
    /**
     * zaehlt hoch, sobald sich sichtbar etwas geaendert hat. nur die dom-spiele brauchen
     * das, damit react nicht jeden tick neu rendert - die wiederholung ignoriert es.
     */
    readonly rev?: number
}

export type Rng = () => number

// mulberry32: nur ganzzahlige operationen und eine division, damit client und server
// bitgleich rechnen. Math.random waere hier toedlich, die wiederholung muesste scheitern.
export function makeRng(seed: number): Rng {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

export function randInt(rng: Rng, n: number): number {
    const v = Math.floor(rng() * n)
    return v < n ? v : n - 1
}

export function shuffle<T>(rng: Rng, items: T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
        const j = randInt(rng, i + 1)
        const t = out[i]
        out[i] = out[j]
        out[j] = t
    }
    return out
}

/**
 * Flache Liste aus Tripeln [tick, held, pick]. Ein Eintrag entsteht nur, wenn sich die
 * gehaltenen Aktionen aendern oder ein Feld gewaehlt wird - ein Lauf ueber Minuten bleibt
 * damit ein paar hundert Zahlen gross.
 */
export type Log = number[]

export class Recorder {
    readonly log: Log = []
    private held = 0
    tick = 0

    write(held: number, pick: number) {
        if (held === this.held && pick < 0) return
        this.log.push(this.tick, held, pick)
        this.held = held
    }
}

export type ReplayResult = { ok: true; score: number; ticks: number } | { ok: false; reason: string }

export function replay(create: (rng: Rng) => Sim, seed: number, log: Log): ReplayResult {
    if (log.length % 3 !== 0 || log.length > MAX_LOG) return { ok: false, reason: 'log' }

    for (let i = 0; i < log.length; i += 3) {
        const [tick, held, pick] = [log[i], log[i + 1], log[i + 2]]
        if (!Number.isInteger(tick) || !Number.isInteger(held) || !Number.isInteger(pick)) {
            return { ok: false, reason: 'log' }
        }
        if (tick < 0 || tick > MAX_TICKS) return { ok: false, reason: 'log' }
        if (held < 0 || held > 63) return { ok: false, reason: 'log' }
        if (pick < -1 || pick > MAX_PICK) return { ok: false, reason: 'log' }
        // streng aufsteigend, sonst liesse sich derselbe tick mehrfach bespielen
        if (i > 0 && tick <= log[i - 3]) return { ok: false, reason: 'log' }
    }

    const sim = create(makeRng(seed))
    let cursor = 0
    let held = 0

    for (let tick = 0; tick <= MAX_TICKS; tick++) {
        let next = held
        let pick = -1
        if (cursor < log.length && log[cursor] === tick) {
            next = log[cursor + 1]
            pick = log[cursor + 2]
            cursor += 3
        }
        const pressed = next & ~held
        held = next

        sim.step({ held, pressed, pick })
        if (sim.over) return { ok: true, score: sim.score, ticks: tick + 1 }
    }

    return { ok: false, reason: 'endless' }
}
