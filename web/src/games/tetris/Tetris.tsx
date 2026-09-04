import { COLS, PIECES, ROWS, createTetris, type TetrisSim } from '../../../../shared/games/tetris.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const CELL = 30
const W = COLS * CELL
const H = ROWS * CELL
// die seitenspalte liegt neben dem brunnen, sonst verdeckt der vorschaukasten das
// fallende stueck
const SIDE = 132
const FULL_W = W + SIDE

const BG = '#0b0b12'
const GRID = 'rgba(255, 255, 255, .045)'
const FRAME = '#dfe4ee'
const SHINE = 'rgba(255, 255, 255, .75)'
// reihenfolge wie in PIECES: I O T S Z J L
const FILL = ['#31c7ef', '#f7d308', '#ad4d9c', '#42b642', '#ef2029', '#5a65ad', '#ef7921']
const EDGE = ['#1b7d96', '#9c8605', '#6d2f63', '#2a742a', '#961419', '#39406e', '#984c15']

const BOX_X = W + 22
const BOX_Y = 40
const BOX_W = 88
const BOX_H = 76
const FONT = '800 13px system-ui, -apple-system, "Segoe UI", sans-serif'

function tile(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, piece: number) {
    const b = Math.max(1, Math.round(size / 15))
    ctx.fillStyle = EDGE[piece]
    ctx.fillRect(px, py, size, size)
    ctx.fillStyle = FILL[piece]
    ctx.fillRect(px + b, py + b, size - b * 2, size - b * 2)
    ctx.fillStyle = SHINE
    ctx.fillRect(px + b * 2, py + b * 2, Math.round(size / 5), Math.round(size / 5))
}

function preview(ctx: CanvasRenderingContext2D, piece: number) {
    ctx.fillStyle = '#05050a'
    ctx.fillRect(BOX_X, BOX_Y, BOX_W, BOX_H)
    ctx.strokeStyle = FRAME
    ctx.lineWidth = 1
    ctx.strokeRect(BOX_X + 0.5, BOX_Y + 0.5, BOX_W - 1, BOX_H - 1)

    const cells = PIECES[piece].rotations[0]
    let minX = COLS
    let maxX = 0
    let minY = ROWS
    let maxY = 0
    for (const c of cells) {
        minX = Math.min(minX, c.x)
        maxX = Math.max(maxX, c.x)
        minY = Math.min(minY, c.y)
        maxY = Math.max(maxY, c.y)
    }

    const ox = BOX_X + (BOX_W - (maxX - minX + 1) * 16) / 2 - minX * 16
    const oy = BOX_Y + (BOX_H - (maxY - minY + 1) * 16) / 2 - minY * 16
    for (const c of cells) tile(ctx, ox + c.x * 16, oy + c.y * 16, 16, piece)
}

function draw(ctx: CanvasRenderingContext2D, s: TetrisSim) {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, FULL_W, H)
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = GRID
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 1; x < COLS; x++) {
        ctx.moveTo(x * CELL + 0.5, 0)
        ctx.lineTo(x * CELL + 0.5, H)
    }
    for (let y = 1; y < ROWS; y++) {
        ctx.moveTo(0, y * CELL + 0.5)
        ctx.lineTo(W, y * CELL + 0.5)
    }
    ctx.stroke()

    for (let i = 0; i < s.grid.length; i++) {
        const piece = s.grid[i]
        if (piece >= 0) tile(ctx, (i % COLS) * CELL, ((i / COLS) | 0) * CELL, CELL, piece)
    }

    preview(ctx, s.next)

    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.font = FONT
    ctx.fillStyle = FRAME
    ctx.fillText('NEXT', BOX_X, BOX_Y - 18)
    ctx.fillText('LEVEL ' + s.level, BOX_X, BOX_Y + BOX_H + 16)
    ctx.fillText(s.lines + ' REIHEN', BOX_X, BOX_Y + BOX_H + 36)

    const cells = PIECES[s.active.piece].rotations[s.active.rot]

    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.strokeStyle = FILL[s.active.piece]
    ctx.lineWidth = 2
    for (const c of cells) ctx.strokeRect((s.active.x + c.x) * CELL + 2, (s.ghost + c.y) * CELL + 2, CELL - 4, CELL - 4)
    ctx.restore()

    for (const c of cells) {
        const y = s.active.y + c.y
        if (y >= 0) tile(ctx, (s.active.x + c.x) * CELL, y * CELL, CELL, s.active.piece)
    }

    ctx.strokeStyle = FRAME
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
    ctx.lineWidth = 1
    ctx.strokeRect(6.5, 6.5, W - 13, H - 13)
}

export default function Tetris(props: GameProps) {
    const canvas = useCanvas(FULL_W, H)
    useSim({ create: createTetris, props, canvas, draw })
    return <canvas ref={canvas} />
}
