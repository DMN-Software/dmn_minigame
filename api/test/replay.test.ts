import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_TICKS, Recorder, makeRng, randInt, replay } from '../../shared/engine.ts'
import { GAME_IDS, type GameId } from '../../shared/games.ts'
import { SIMS } from '../../shared/registry.ts'

const SEEDS = 20

const PICKS: Partial<Record<GameId, number>> = {
    tictactoe: 9,
    breakout: 1001,
    minesweeper: 162,
    memory: 16,
    pong: 1001,
    simon: 4,
}

const PINNED: Record<GameId, { seed: number; score: number; ticks: number }> = {
    snake: { seed: 11, score: 1, ticks: 1130 },
    flappy: { seed: 10, score: 2, ticks: 334 },
    tictactoe: { seed: 20, score: 2, ticks: 1614 },
    tower: { seed: 8, score: 4, ticks: 185 },
    g2048: { seed: 13, score: 2752, ticks: 2407 },
    breakout: { seed: 23, score: 9, ticks: 1347 },
    minesweeper: { seed: 12, score: 60, ticks: 2722 },
    memory: { seed: 1, score: 590, ticks: 3278 },
    tetris: { seed: 3, score: 0, ticks: 320 },
    pong: { seed: 13, score: 2, ticks: 2521 },
    simon: { seed: 1, score: 1, ticks: 277 },
    doodle: { seed: 24, score: 52, ticks: 279 },
}

function play(game: GameId, seed: number) {
    const sim = SIMS[game](makeRng(seed))
    const hand = makeRng(seed ^ 0x5bd1e995)
    const range = PICKS[game]
    const rec = new Recorder()
    let held = 0
    let prev = 0

    while (!sim.over && rec.tick <= MAX_TICKS) {
        if (hand() < 0.15) held = randInt(hand, 64)
        const pick = range && hand() < 0.05 ? randInt(hand, range) : -1
        rec.write(held, pick)
        sim.step({ held, pressed: held & ~prev, pick })
        prev = held
        rec.tick += 1
    }

    return { over: sim.over, score: sim.score, ticks: rec.tick, log: rec.log }
}

for (const game of GAME_IDS) {
    test(`${game}: server-replay ergibt denselben lauf`, () => {
        for (let seed = 1; seed <= SEEDS; seed++) {
            const run = play(game, seed)
            assert.ok(run.over, `seed ${seed} endet nicht`)
            assert.deepEqual(replay(SIMS[game], seed, run.log), { ok: true, score: run.score, ticks: run.ticks })
        }
    })

    test(`${game}: fester seed mit festen eingaben ergibt immer dieselbe punktzahl`, () => {
        const { seed, score, ticks } = PINNED[game]
        const first = play(game, seed)
        assert.deepEqual(play(game, seed).log, first.log)
        assert.deepEqual(replay(SIMS[game], seed, first.log), { ok: true, score, ticks })
    })
}
