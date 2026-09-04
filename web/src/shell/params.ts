import { isGameId, type GameId } from '../../../shared/games.ts'
import { NAME_MAX, normalizeName } from '../../../shared/scores.ts'

export type Params = {
    game: GameId | null
    kiosk: boolean
    name: string
    board: boolean
    autostart: boolean
    pad: boolean | null
}

export function readParams(search = window.location.search): Params {
    const q = new URLSearchParams(search)
    const game = q.get('game')
    const pad = q.get('pad')

    return {
        game: isGameId(game) ? game : null,
        kiosk: q.get('kiosk') === '1',
        name: normalizeName(q.get('name') ?? '').slice(0, NAME_MAX),
        board: q.get('board') !== '0',
        autostart: q.get('autostart') === '1',
        pad: pad === null ? null : pad === '1',
    }
}
