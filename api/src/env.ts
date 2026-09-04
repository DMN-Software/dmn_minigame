import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

function required(key: string): string {
    const value = process.env[key]
    // kurze werte sind fast immer der dev-platzhalter aus der README, siehe openssl rand -hex 32
    if (!value || value.length < 32) {
        console.error(`${key} fehlt oder ist zu kurz, ohne die variable startet der dienst nicht`)
        process.exit(1)
    }
    return value
}

export const env = {
    port: Number(process.env.PORT ?? 8090),
    dbPath: resolve(process.env.DB_PATH ?? './data/minigames.db'),
    ipSalt: required('IP_SALT'),
    adminToken: required('ADMIN_TOKEN'),
}

mkdirSync(dirname(env.dbPath), { recursive: true })
