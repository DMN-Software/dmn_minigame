import { useEffect, useState, type CSSProperties } from 'react'
import { GAMES, type GameId, type Scheme } from '../../../shared/games.ts'
import { prefetch } from './registry.ts'

// je spiel die leitfarbe seines vorbilds, damit die auswahl nicht aus zwoelf
// gleichen grauen zeilen besteht
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

const INPUT: Record<Scheme, string> = {
    dpad: 'Tasten',
    tap: 'Tippen',
    paddle: 'Zeiger',
    pointer: 'Klicken',
}

// im iframe der fivem-resource wuerde der link das spiel durch die startseite ersetzen
const framed = window.self !== window.top

// die einblendung nur beim ersten aufruf, nach jedem zurueck aus einem spiel stoert sie
let intro = true

export function Menu({ onPick }: { onPick: (id: GameId) => void }) {
    const [first] = useState(intro)
    useEffect(() => {
        intro = false
    }, [])

    return (
        <div className={first ? 'menu menu--intro' : 'menu'}>
            <header className="top">
                <div className="wrap top__in">
                    {framed ? (
                        <span className="brand">
                            <Brand />
                        </span>
                    ) : (
                        <a className="brand" href="https://dmn-software.com">
                            <Brand />
                        </a>
                    )}
                </div>
            </header>

            <main className="wrap">
                <div className="menu__head">
                    <h1>
                        <span>Minispiele</span>
                    </h1>
                    <p>Zwölf Stück gegen die Wartezeit.</p>
                </div>

                <ol className="games">
                    {GAMES.map((g, i) => (
                        <li key={g.id} style={{ '--i': i, '--tile-accent': ACCENT[g.id] } as CSSProperties}>
                            <button className="game" onPointerEnter={() => prefetch(g.id)} onClick={() => onPick(g.id)}>
                                <span className="game__no">{String(i + 1).padStart(2, '0')}</span>
                                <span className="game__body">
                                    <span className="game__top">
                                        <b>
                                            <i className="game__dot" />
                                            {g.title}
                                        </b>
                                        <span className="game__input">{INPUT[g.scheme]}</span>
                                    </span>
                                    <span className="game__hint">{g.hint}</span>
                                </span>
                                <svg className="game__go" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                                    <path d="M3 8h9.5M8.5 4 12.5 8l-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ol>
            </main>

            {!framed && (
                <footer className="wrap legal">
                    <a href="https://dmn-software.com/impressum.html">Impressum</a>
                    <span aria-hidden="true"> · </span>
                    <a href="https://dmn-software.com/datenschutz.html">Datenschutz</a>
                </footer>
            )}
        </div>
    )
}

function Brand() {
    return (
        <>
            <img src="/favicon.svg" alt="" width="28" height="28" />
            <span>
                DMN<span className="brand__slash">/</span>
                <span className="brand__soft">Software</span>
            </span>
        </>
    )
}
