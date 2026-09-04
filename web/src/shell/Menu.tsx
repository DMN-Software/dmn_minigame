import { GAMES, type GameId } from '../../../shared/games.ts'
import { prefetch } from './registry.ts'

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
                            onPointerEnter={() => prefetch(g.id)}
                            onClick={() => onPick(g.id)}
                        >
                            <b>{g.title}</b>
                            <span>{g.hint}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
