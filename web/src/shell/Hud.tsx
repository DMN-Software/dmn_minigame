import type { GameMeta } from '../../../shared/games.ts'

type Props = {
    meta: GameMeta
    score: number
    best: number
    paused: boolean
    tight: boolean
    kiosk: boolean
    onBack: () => void
    onPause: () => void
}

export function Hud({ meta, score, best, paused, tight, kiosk, onBack, onPause }: Props) {
    return (
        <div className={tight ? 'hud hud--tight' : 'hud'}>
            {!kiosk && (
                <button className="hud__back" onClick={onBack}>
                    Zurück
                </button>
            )}
            <span className="hud__title">{meta.title}</span>
            <span className="hud__spacer" />
            <span className="hud__stat">
                <span>Punkte </span>
                <b>{score}</b>
            </span>
            <span className="hud__stat">
                <span>Best </span>
                {best}
            </span>
            <button className="hud__back" onClick={onPause}>
                {paused ? 'Weiter' : 'Pause'}
            </button>
        </div>
    )
}
