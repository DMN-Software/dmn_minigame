import type { GameId } from '../../../shared/games.ts'
import type { Log } from '../../../shared/engine.ts'
import type { BoardResponse, ScoreResponse, SessionResponse } from '../../../shared/scores.ts'

const BASE = '/api/v1'

class ApiFailure extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response
    try {
        res = await fetch(BASE + path, {
            ...init,
            headers: init?.body ? { 'content-type': 'application/json' } : undefined,
        })
    } catch {
        throw new ApiFailure('Keine Verbindung')
    }

    const body = await res.json().catch(() => null)
    if (!res.ok) throw new ApiFailure((body as { message?: string } | null)?.message ?? 'Fehler')
    return body as T
}

export const api = {
    session: (game: GameId) => call<SessionResponse>('/session', { method: 'POST', body: JSON.stringify({ game }) }),

    // die punktzahl steht bewusst nicht drin, die rechnet der server aus dem protokoll
    submit: (token: string, name: string, log: Log) =>
        call<ScoreResponse>('/score', { method: 'POST', body: JSON.stringify({ token, name, log }) }),

    board: (game: GameId, limit = 10) => call<BoardResponse>(`/scores/${game}?limit=${limit}`),
}

export function apiMessage(err: unknown): string {
    return err instanceof ApiFailure ? err.message : 'Unbekannter Fehler'
}
