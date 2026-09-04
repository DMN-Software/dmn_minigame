import { CELLS, createSnake, type SnakeSim } from '../../../../shared/games/snake.ts'
import { roundRect } from '../../shell/paint.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const SIZE = 400
const INSET = 10
const CELL = (SIZE - INSET * 2) / CELLS

const CASE = '#141807'
const CASE_EDGE = '#2c3417'
const LCD = '#9ead86'
const INK = '#1f2412'
const DOTS = 'rgba(31, 36, 18, .07)'
const FRAME = 'rgba(31, 36, 18, .55)'

const PULSE = 1500

function cellPos(i: number) {
    return INSET + i * CELL
}

function drawDots(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = DOTS
    const d = 5
    const off = (CELL - d) / 2
    for (let y = 0; y < CELLS; y++) {
        for (let x = 0; x < CELLS; x++) {
            ctx.fillRect(cellPos(x) + off, cellPos(y) + off, d, d)
        }
    }
}

function drawHead(ctx: CanvasRenderingContext2D, s: SnakeSim) {
    const head = s.body[0]
    const neck = s.body[1]
    const x = cellPos(head.x)
    const y = cellPos(head.y)

    ctx.fillStyle = INK
    ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)

    // blickrichtung steckt nicht im zustand, ergibt sich aber aus dem naechsten glied
    const dx = neck ? Math.sign(head.x - neck.x) : 1
    const dy = neck ? Math.sign(head.y - neck.y) : 0
    const cx = x + CELL / 2
    const cy = y + CELL / 2
    const front = CELL / 2 - 4
    const side = 3.5

    ctx.fillStyle = LCD
    ctx.fillRect(cx + dx * front - dy * side - 1.5, cy + dy * front - dx * side - 1.5, 3, 3)
    ctx.fillRect(cx + dx * front + dy * side - 1.5, cy + dy * front + dx * side - 1.5, 3, 3)
}

function draw(ctx: CanvasRenderingContext2D, s: SnakeSim) {
    ctx.fillStyle = CASE
    ctx.fillRect(0, 0, SIZE, SIZE)

    roundRect(ctx, 3, 3, SIZE - 6, SIZE - 6, 16)
    ctx.fillStyle = LCD
    ctx.fill()
    ctx.strokeStyle = CASE_EDGE
    ctx.lineWidth = 2
    ctx.stroke()

    drawDots(ctx)

    roundRect(ctx, INSET - 4, INSET - 4, SIZE - (INSET - 4) * 2, SIZE - (INSET - 4) * 2, 6)
    ctx.strokeStyle = FRAME
    ctx.lineWidth = 2
    ctx.stroke()

    const beat = 0.5 + 0.5 * Math.sin((performance.now() / PULSE) * Math.PI * 2)
    const pad = 3 + beat * 3
    ctx.fillStyle = INK
    ctx.fillRect(cellPos(s.food.x) + pad, cellPos(s.food.y) + pad, CELL - pad * 2, CELL - pad * 2)

    for (let i = 1; i < s.body.length; i++) {
        ctx.fillRect(cellPos(s.body[i].x) + 2, cellPos(s.body[i].y) + 2, CELL - 4, CELL - 4)
    }

    drawHead(ctx, s)
}

export default function Snake(props: GameProps) {
    const canvas = useCanvas(SIZE, SIZE)
    useSim({ create: createSnake, props, canvas, draw })
    return <canvas ref={canvas} />
}
