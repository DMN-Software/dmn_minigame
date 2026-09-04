import { randomBytes, randomInt } from 'node:crypto'
import type { FastifyInstance, FastifyReply } from 'fastify'
import type { GameId } from '../../shared/games.ts'
import { GAME_IDS, LIMITS } from '../../shared/games.ts'
import { MAX_LOG, TICK_HZ, replay } from '../../shared/engine.ts'
import { SIMS } from '../../shared/registry.ts'
import type { ScoreRow } from '../../shared/scores.ts'
import { db, ipHash } from './db.ts'
import { env } from './env.ts'
import { checkName } from './names.ts'

const SESSION_TTL = 2 * 60 * 60 * 1000

const insertSession = db.prepare(
    'INSERT INTO sessions (token, game, started_at, used_at, ip_hash, seed) VALUES (?, ?, ?, NULL, ?, ?)',
)
const findSession = db.prepare('SELECT game, started_at, seed FROM sessions WHERE token = ?')
const useSession = db.prepare('UPDATE sessions SET used_at = ? WHERE token = ? AND used_at IS NULL')
const insertScore = db.prepare(
    'INSERT INTO scores (game, name, score, duration_ms, created_at, ip_hash, ticks) VALUES (?, ?, ?, ?, ?, ?, ?)',
)
// bester lauf je name, sonst belegt ein einziger spieler die ganze liste
const bestPerName = db.prepare(`
    SELECT name, MAX(score) AS score, created_at AS at
    FROM scores WHERE game = ? GROUP BY name ORDER BY score DESC, at ASC LIMIT ?
`)
const dropScore = db.prepare('DELETE FROM scores WHERE id = ?')

function board(game: GameId, limit: number): ScoreRow[] {
    const rows = bestPerName.all(game, limit) as unknown as { name: string; score: number; at: number }[]
    return rows.map((row, i) => ({ rank: i + 1, name: row.name, score: row.score, at: row.at }))
}

function bad(reply: FastifyReply, error: string, message: string) {
    return reply.code(400).send({ error, message })
}

export async function routes(app: FastifyInstance) {
    app.get('/health', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async () => ({ ok: true }))

    app.post<{ Body: { game: GameId } }>(
        '/session',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['game'],
                    additionalProperties: false,
                    properties: { game: { type: 'string', enum: GAME_IDS } },
                },
            },
            config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
        },
        async (req) => {
            const token = randomBytes(32).toString('base64url')
            const seed = randomInt(1, 0xffffffff)
            insertSession.run(token, req.body.game, Date.now(), ipHash(req.ip), seed)
            return { token, seed }
        },
    )

    app.post<{ Body: { token: string; name: string; log: number[] } }>(
        '/score',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['token', 'name', 'log'],
                    additionalProperties: false,
                    properties: {
                        token: { type: 'string', maxLength: 64 },
                        name: { type: 'string', maxLength: 100 },
                        log: { type: 'array', maxItems: MAX_LOG, items: { type: 'integer' } },
                    },
                },
            },
            config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
        },
        async (req, reply) => {
            const { token, log } = req.body
            const session = findSession.get(token) as { game: string; started_at: number; seed: number } | undefined
            if (!session) return bad(reply, 'no_session', 'Sitzung unbekannt')

            const now = Date.now()
            if (now - session.started_at > SESSION_TTL) return bad(reply, 'session_expired', 'Sitzung abgelaufen')

            const checked = checkName(req.body.name)
            if (!checked.ok) return bad(reply, 'bad_name', checked.message)

            // der client schickt keine punktzahl. sie entsteht hier, indem der lauf mit
            // demselben startwert und demselben eingabeprotokoll nachgespielt wird.
            const game = session.game as GameId
            const result = replay(SIMS[game], session.seed, log)
            if (!result.ok) return bad(reply, 'bad_run', 'Lauf nicht nachvollziehbar')

            const score = result.score
            const durationMs = Math.round((result.ticks / TICK_HZ) * 1000)
            // fangnetz, falls ein spiel doch eine luecke hat. die wiederholung ist die
            // eigentliche pruefung, hier bleibt nur noch das offensichtliche haengen.
            if (score > LIMITS[game].maxScore) return bad(reply, 'score_range', 'Punktzahl unglaubwürdig')
            if (durationMs > now - session.started_at) return bad(reply, 'bad_run', 'Lauf nicht nachvollziehbar')

            db.exec('BEGIN')
            if (useSession.run(now, token).changes !== 1) {
                db.exec('ROLLBACK')
                return bad(reply, 'session_used', 'Sitzung schon eingetragen')
            }
            insertScore.run(game, checked.name, score, durationMs, now, ipHash(req.ip), result.ticks)
            db.exec('COMMIT')

            const top = board(game, 10)
            const place = top.findIndex((row) => row.name === checked.name && row.score === score)
            return { rank: place < 0 ? null : place + 1, score, top }
        },
    )

    app.get<{ Params: { game: GameId }; Querystring: { limit: number } }>(
        '/scores/:game',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['game'],
                    properties: { game: { type: 'string', enum: GAME_IDS } },
                },
                querystring: {
                    type: 'object',
                    properties: { limit: { type: 'integer', default: 10 } },
                },
            },
            config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
        },
        async (req) => {
            const limit = Math.min(50, Math.max(1, req.query.limit))
            return { top: board(req.params.game, limit) }
        },
    )

    app.delete<{ Params: { id: number } }>(
        '/scores/:id',
        {
            schema: {
                params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
            },
            config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
        },
        async (req, reply) => {
            if (req.headers.authorization !== `Bearer ${env.adminToken}`) {
                return reply.code(401).send({ error: 'unauthorized', message: 'Nicht berechtigt' })
            }
            if (dropScore.run(req.params.id).changes !== 1) {
                return reply.code(404).send({ error: 'not_found', message: 'Eintrag nicht gefunden' })
            }
            return { ok: true }
        },
    )
}
