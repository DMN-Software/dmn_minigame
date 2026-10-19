import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyError } from 'fastify'
import { MAX_TICKS, Recorder, makeRng, randInt } from '../../shared/engine.ts'
import { SIMS } from '../../shared/registry.ts'

const dir = mkdtempSync(join(tmpdir(), 'minigame-routes-'))
const ADMIN_TOKEN = 'a'.repeat(40)

process.env.DB_PATH = join(dir, 'minigames.db')
process.env.IP_SALT = 's'.repeat(40)
process.env.ADMIN_TOKEN = ADMIN_TOKEN

const { db, ipHash } = await import('../src/db.ts')
const { routes } = await import('../src/routes.ts')

const app = Fastify()

app.setErrorHandler((err: FastifyError, _req, reply) => {
    const status = err.statusCode ?? 500
    if (status === 429) return reply.code(429).send({ error: 'rate_limited', message: 'Zu viele Anfragen' })
    if (status < 500) return reply.code(status).send({ error: 'bad_request', message: 'Ungültige Anfrage' })
    return reply.code(500).send({ error: 'internal', message: 'Serverfehler' })
})

await app.register(rateLimit, { global: false, keyGenerator: (req) => ipHash(req.ip) })
await app.register(routes, { prefix: '/api/v1' })

after(async () => {
    await app.close()
    db.close()
    rmSync(dir, { recursive: true, force: true })
})

const backdate = db.prepare('UPDATE sessions SET started_at = ? WHERE token = ?')

async function start(game: string) {
    const res = await app.inject({ method: 'POST', url: '/api/v1/session', payload: { game } })
    assert.equal(res.statusCode, 200)
    return res.json() as { token: string; seed: number }
}

function submit(token: string, name: string, log: number[]) {
    return app.inject({ method: 'POST', url: '/api/v1/score', payload: { token, name, log } })
}

function stack(seed: number) {
    const sim = SIMS.tower(makeRng(seed))
    const hand = makeRng(seed ^ 0x5bd1e995)
    const rec = new Recorder()
    let held = 0
    let prev = 0

    while (!sim.over && rec.tick <= MAX_TICKS) {
        if (hand() < 0.15) held = randInt(hand, 64)
        rec.write(held, -1)
        sim.step({ held, pressed: held & ~prev, pick: -1 })
        prev = held
        rec.tick += 1
    }

    return { score: sim.score, log: rec.log }
}

test('kaputter log verbraucht die sitzung', async () => {
    const { token } = await start('tower')

    const first = await submit(token, 'Kranfahrer', [1, 2])
    assert.equal(first.statusCode, 400)
    assert.equal(first.json().error, 'bad_run')

    const again = await submit(token, 'Kranfahrer', [1, 2])
    assert.equal(again.statusCode, 400)
    assert.equal(again.json().error, 'session_used')
})

test('falscher name verbraucht die sitzung nicht', async () => {
    const { token, seed } = await start('tower')
    backdate.run(Date.now() - 10 * 60 * 1000, token)
    const run = stack(seed)

    const refused = await submit(token, '<b>', run.log)
    assert.equal(refused.statusCode, 400)
    assert.equal(refused.json().error, 'bad_name')

    const saved = await submit(token, 'Kranfahrer', run.log)
    assert.equal(saved.statusCode, 200)
    assert.equal(saved.json().score, run.score)
    assert.deepEqual(
        saved.json().top.map((row: { name: string }) => row.name),
        ['Kranfahrer'],
    )
})

test('löschen nur mit admin-token', async () => {
    const { id } = db.prepare("SELECT id FROM scores WHERE name = 'Kranfahrer'").get() as { id: number }
    const drop = (authorization: string) =>
        app.inject({ method: 'DELETE', url: `/api/v1/scores/${id}`, headers: { authorization } })

    const denied = await drop('Bearer falsch')
    assert.equal(denied.statusCode, 401)
    assert.equal(denied.json().error, 'unauthorized')

    const dropped = await drop(`Bearer ${ADMIN_TOKEN}`)
    assert.equal(dropped.statusCode, 200)
    assert.deepEqual(dropped.json(), { ok: true })

    const gone = await drop(`Bearer ${ADMIN_TOKEN}`)
    assert.equal(gone.statusCode, 404)
    assert.equal(gone.json().error, 'not_found')
})
