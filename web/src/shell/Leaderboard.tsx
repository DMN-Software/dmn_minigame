import { useEffect, useState } from 'react'
import type { GameId } from '../../../shared/games.ts'
import type { Log } from '../../../shared/engine.ts'
import { NAME_MAX, NAME_MIN, NAME_RE, normalizeName, type ScoreRow } from '../../../shared/scores.ts'
import { api, apiMessage } from './api.ts'

type Props = {
    game: GameId
    // gesetzt, sobald ein lauf vorbei ist und noch nicht eingetragen wurde
    pending: { token: string; log: Log } | null
    presetName: string
    onSubmitted: () => void
}

export function Leaderboard({ game, pending, presetName, onSubmitted }: Props) {
    const [top, setTop] = useState<ScoreRow[] | null>(null)
    const [name, setName] = useState(presetName)
    const [rank, setRank] = useState<number | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let alive = true
        setTop(null)
        setRank(null)
        api.board(game)
            .then((r) => alive && setTop(r.top))
            .catch(() => alive && setTop([]))
        return () => {
            alive = false
        }
    }, [game])

    const clean = normalizeName(name)
    const valid = clean.length >= NAME_MIN && clean.length <= NAME_MAX && NAME_RE.test(clean)

    async function submit() {
        if (!pending || !valid) return
        setBusy(true)
        setError('')
        try {
            const res = await api.submit(pending.token, clean, pending.log)
            setTop(res.top)
            setRank(res.rank)
            onSubmitted()
        } catch (err) {
            setError(apiMessage(err))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="board">
            <h3>Bestenliste</h3>

            {top === null && <p className="board__empty">Lädt …</p>}
            {top?.length === 0 && <p className="board__empty">Noch kein Eintrag. Sei der Erste.</p>}

            {top && top.length > 0 && (
                <ol>
                    {top.map((row) => (
                        <li key={`${row.rank}-${row.name}`} className={rank === row.rank ? 'is-me' : undefined}>
                            <i>{row.rank}</i>
                            <em>{row.name}</em>
                            <b>{row.score}</b>
                        </li>
                    ))}
                </ol>
            )}

            {pending && (
                <>
                    <div className="namebox">
                        <input
                            value={name}
                            maxLength={NAME_MAX}
                            placeholder="Dein Name"
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                        />
                        <button disabled={!valid || busy} onClick={submit}>
                            Eintragen
                        </button>
                    </div>
                    <p className="note">Bitte keinen echten Namen eintragen, die Liste ist öffentlich.</p>
                    {error && <p className="note note--bad">{error}</p>}
                </>
            )}
        </div>
    )
}
