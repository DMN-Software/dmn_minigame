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
            <img className="hud__mark" src="/favicon.svg" alt="" width="22" height="22" />
            {!kiosk && (
                <button className="hud__back" onClick={onBack}>
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <path d="M13 8H3.5M7.5 4 3.5 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
            <button className="hud__pause" onClick={onPause}>
                {paused ? 'Weiter' : 'Pause'}
            </button>
        </div>
    )
}
