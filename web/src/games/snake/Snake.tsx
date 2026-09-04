import { CELLS, createSnake, type SnakeSim } from '../../../../shared/games/snake.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const CELL = 20
const SIZE = CELLS * CELL

function draw(ctx: CanvasRenderingContext2D, s: SnakeSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, SIZE, SIZE)

    ctx.fillStyle = '#f472b6'
    ctx.fillRect(s.food.x * CELL + 4, s.food.y * CELL + 4, CELL - 8, CELL - 8)

    for (let i = 0; i < s.body.length; i++) {
        ctx.fillStyle = i === 0 ? '#4ade80' : '#22683f'
        ctx.fillRect(s.body[i].x * CELL + 1, s.body[i].y * CELL + 1, CELL - 2, CELL - 2)
    }
}

export default function Snake(props: GameProps) {
    const canvas = useCanvas(SIZE, SIZE)
    useSim({ create: createSnake, props, canvas, draw })
    return <canvas ref={canvas} />
}
