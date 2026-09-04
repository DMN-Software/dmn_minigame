import { createTicTacToe } from '../../../../shared/games/tictactoe.ts'
import type { Player, Result } from '../../../../shared/games/minimax.ts'
import { useSim } from '../../shell/useSim.ts'
import { useSquare } from '../../shell/useSquare.ts'
import type { GameProps } from '../../shell/types.ts'
import './tictactoe.css'

function cellClass(mark: Player | null, result: Result | null, i: number): string {
    let cls = 'cell ttt__cell'
    if (mark) cls += mark === 'X' ? ' ttt__cell--x' : ' ttt__cell--o'
    if (result && result.line.includes(i)) cls += ' ttt__cell--win'
    return cls
}

function status(result: Result | null, turn: Player): string {
    if (!result) return turn === 'X' ? 'Du bist X' : 'O überlegt'
    if (result.winner === 'X') return 'Gewonnen'
    if (result.winner === 'O') return 'Verloren'
    return 'Unentschieden'
}

export default function TicTacToe(props: GameProps) {
    const sim = useSim({ create: createTicTacToe, props })
    const [area, size] = useSquare(380, 120)

    const idle = props.paused || sim.over || !!sim.result || sim.turn !== 'X'

    return (
        <div className="ttt">
            <p className="ttt__status">
                <span>{status(sim.result, sim.turn)}</span>
                <span className="ttt__streak">Serie {sim.score}</span>
            </p>

            <div className="ttt__area" ref={area}>
                <div className="ttt__board" style={{ width: size, height: size, fontSize: Math.round(size * 0.2) }}>
                    {sim.board.map((mark, i) => (
                        <button
                            key={i}
                            type="button"
                            className={cellClass(mark, sim.result, i)}
                            disabled={idle || !!mark}
                            onClick={() => props.controls.choose(i)}
                        >
                            {mark}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
