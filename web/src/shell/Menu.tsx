import type { CSSProperties } from 'react'
import { GAMES, type GameId } from '../../../shared/games.ts'
import { prefetch } from './registry.ts'

// je spiel die leitfarbe seines vorbilds, damit die auswahl nicht aus zwoelf
// gleichen grauen kaesten besteht
const ACCENT: Record<GameId, string> = {
    snake: '#9ead86',
    flappy: '#4ec0ca',
    tictactoe: '#d1495b',
    tower: '#5eb0e5',
    g2048: '#edc22e',
    breakout: '#cb4f42',
    minesweeper: '#c0c0c0',
    memory: '#8f2130',
    tetris: '#31c7ef',
    pong: '#e8e8e8',
    simon: '#00a74a',
    doodle: '#7ab648',
}

export function Menu({ onPick }: { onPick: (id: GameId) => void }) {
    return (
        <div className="menu">
            <div className="menu__inner">
                <div className="menu__head">
                    <h1>Minispiele</h1>
                    <p>Zwölf Stück gegen die Wartezeit.</p>
                </div>
                <div className="menu__grid">
                    {GAMES.map((g) => (
                        <button
                            key={g.id}
                            className="tile"
                            style={{ '--tile-accent': ACCENT[g.id] } as CSSProperties}
                            onPointerEnter={() => prefetch(g.id)}
                            onClick={() => onPick(g.id)}
                        >
                            <span className="tile__dot" />
                            <b>{g.title}</b>
                            <span className="tile__hint">{g.hint}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
