import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { env } from './env.ts'

// index + 1 ist die schemaversion. ein ausgelieferter block wird nie mehr angefasst,
// aenderungen kommen als weiterer eintrag dazu.
const MIGRATIONS = [
    `
    CREATE TABLE scores (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        game        TEXT    NOT NULL,
        name        TEXT    NOT NULL,
        score       INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL,
        created_at  INTEGER NOT NULL,
        ip_hash     TEXT    NOT NULL
    );
    CREATE INDEX scores_best ON scores (game, score DESC, created_at);

    CREATE TABLE sessions (
        token      TEXT PRIMARY KEY,
        game       TEXT    NOT NULL,
        started_at INTEGER NOT NULL,
        used_at    INTEGER,
        ip_hash    TEXT    NOT NULL
    );
    CREATE INDEX sessions_age ON sessions (started_at);
    `,
    `
    ALTER TABLE sessions ADD COLUMN seed INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scores ADD COLUMN ticks INTEGER NOT NULL DEFAULT 0;
    `,
]

export const db = new DatabaseSync(env.dbPath)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

function migrate() {
    const { user_version: current } = db.prepare('PRAGMA user_version').get() as { user_version: number }
    for (let v = current; v < MIGRATIONS.length; v++) {
        db.exec('BEGIN')
        db.exec(MIGRATIONS[v])
        db.exec(`PRAGMA user_version = ${v + 1}`)
        db.exec('COMMIT')
    }
}

migrate()

const dropOldSessions = db.prepare('DELETE FROM sessions WHERE started_at < ?')
const dropUsedSessions = db.prepare('DELETE FROM sessions WHERE used_at IS NOT NULL AND used_at < ?')

export function pruneSessions() {
    const now = Date.now()
    // die ttl ist zwei stunden, alles darueber ist ohnehin unbrauchbar
    dropOldSessions.run(now - 3 * 60 * 60 * 1000)
    dropUsedSessions.run(now - 10 * 60 * 1000)
}

// die rohe ip landet weder in der datenbank noch im log
export function ipHash(ip: string): string {
    return createHash('sha256').update(ip + env.ipSalt).digest('hex').slice(0, 16)
}
