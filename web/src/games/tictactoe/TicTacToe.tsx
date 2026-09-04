import { createTicTacToe } from '../../../../shared/games/tictactoe.ts'
import type { Player, Result } from '../../../../shared/games/minimax.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './tictactoe.css'

function cellClass(mark: Player | null): string {
    if (!mark) return 'ttt__cell'
    return mark === 'X' ? 'ttt__cell ttt__cell--x' : 'ttt__cell ttt__cell--o'
}

// die felder einer linie stehen aufsteigend, ihr abstand verraet die richtung
function winClass(result: Result): string {
    const [a, b] = result.line
    const cls = 'ttt__win ttt__win--' + (result.winner === 'X' ? 'x' : 'o')
    if (b - a === 1) return cls + ' ttt__win--row ttt__win--r' + a / 3
    if (b - a === 3) return cls + ' ttt__win--col ttt__win--c' + a
    return cls + ' ttt__win--diag ttt__win--' + (a === 0 ? 'd1' : 'd2')
}

function status(result: Result | null, turn: Player): string {
    if (!result) return turn === 'X' ? 'Du bist X' : 'O überlegt'
    if (result.winner === 'X') return 'Gewonnen'
    if (result.winner === 'O') return 'Verloren'
    return 'Unentschieden'
}

export default function TicTacToe(props: GameProps) {
    const sim = useSim({ create: createTicTacToe, props })
    const [area, size] = useSquare()

    const idle = props.paused || sim.over || !!sim.result || sim.turn !== 'X'

    return (
        <div className="ttt">
            <p className="ttt__status">
                <span>{status(sim.result, sim.turn)}</span>
                <span className="ttt__streak">Serie {sim.score}</span>
            </p>

            <div className="ttt__area" ref={area}>
                <div className="ttt__board" style={{ width: size, height: size }}>
                    <span className="ttt__rule ttt__rule--v ttt__rule--v1" />
                    <span className="ttt__rule ttt__rule--v ttt__rule--v2" />
                    <span className="ttt__rule ttt__rule--h ttt__rule--h1" />
                    <span className="ttt__rule ttt__rule--h ttt__rule--h2" />

                    {sim.board.map((mark, i) => (
                        <button
                            key={i}
                            type="button"
                            className={cellClass(mark)}
                            disabled={idle || !!mark}
                            onClick={() => props.controls.choose(i)}
                        />
                    ))}

                    {sim.result && sim.result.winner && <span className={winClass(sim.result)} />}
                </div>
            </div>
        </div>
    )
}
