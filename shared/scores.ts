import type { Log } from './engine.ts'

export const NAME_MIN = 2
export const NAME_MAX = 16

// buchstaben jeder sprache, ziffern, leerzeichen, punkt, unterstrich, bindestrich.
// keine steuerzeichen, keine zero-width-zeichen, keine emojis.
export const NAME_RE = /^[\p{L}\p{N} ._-]+$/u

export type SessionResponse = { token: string; seed: number }

export type ScoreRequest = { token: string; name: string; log: Log }

export type ScoreRow = {
    rank: number
    name: string
    score: number
    at: number
}

export type ScoreResponse = {
    rank: number | null
    score: number
    top: ScoreRow[]
}

export type BoardResponse = { top: ScoreRow[] }

export function normalizeName(raw: string): string {
    return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}
