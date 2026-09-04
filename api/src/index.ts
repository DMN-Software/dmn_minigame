import rateLimit from '@fastify/rate-limit'
import Fastify, { type FastifyError } from 'fastify'
import { db, ipHash, pruneSessions } from './db.ts'
import { env } from './env.ts'
import { routes } from './routes.ts'

const app = Fastify({
    // nur dem docker-nachbarn glauben. mit true waere req.ip der linkeste X-Forwarded-For
    // eintrag, also frei vom client waehlbar, und jedes ratelimit umgehbar.
    trustProxy: 'uniquelocal',
    // das eingabeprotokoll eines langen laufs sind bis zu MAX_LOG ganze zahlen
    bodyLimit: 1_500_000,
    logger: {
        serializers: {
            req: (req) => ({ method: req.method, url: req.url }),
        },
    },
})

app.setErrorHandler((err: FastifyError, req, reply) => {
    const status = err.statusCode ?? 500
    if (status === 429) return reply.code(429).send({ error: 'rate_limited', message: 'Zu viele Anfragen' })
    if (status < 500) return reply.code(status).send({ error: 'bad_request', message: 'Ungültige Anfrage' })

    req.log.error(err)
    return reply.code(500).send({ error: 'internal', message: 'Serverfehler' })
})

app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: 'not_found', message: 'Unbekannter Pfad' }))

await app.register(rateLimit, { global: false, keyGenerator: (req) => ipHash(req.ip) })
await app.register(routes, { prefix: '/api/v1' })

// der timer darf den prozess nicht am leben halten
setInterval(pruneSessions, 10 * 60 * 1000).unref()

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.once(signal, async () => {
        await app.close()
        db.close()
    })
}

await app.listen({ port: env.port, host: '0.0.0.0' })
