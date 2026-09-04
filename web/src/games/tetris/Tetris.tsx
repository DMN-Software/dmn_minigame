import { COLS, PIECES, ROWS, createTetris, type TetrisSim } from '../../../../shared/games/tetris.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const CELL = 30
const W = COLS * CELL
const H = ROWS * CELL

function block(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2)
}

function preview(ctx: CanvasRenderingContext2D, piece: number) {
    const x = W - 104
    const y = 8
    ctx.fillStyle = '#161b22'
    ctx.fillRect(x, y, 96, 72)
    ctx.strokeStyle = '#232a33'
    ctx.strokeRect(x + 0.5, y + 0.5, 95, 71)

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

    const ox = x + (96 - (maxX - minX + 1) * 16) / 2 - minX * 16
    const oy = y + (72 - (maxY - minY + 1) * 16) / 2 - minY * 16
    for (const c of cells) block(ctx, ox + c.x * 16, oy + c.y * 16, 16, PIECES[piece].color)
}

function draw(ctx: CanvasRenderingContext2D, s: TetrisSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#232a33'
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
        if (piece >= 0) block(ctx, (i % COLS) * CELL, ((i / COLS) | 0) * CELL, CELL, PIECES[piece].color)
    }

    const p = PIECES[s.active.piece]
    ctx.save()
    ctx.globalAlpha = 0.22
    for (const c of p.rotations[s.active.rot]) block(ctx, (s.active.x + c.x) * CELL, (s.ghost + c.y) * CELL, CELL, p.color)
    ctx.restore()

    for (const c of p.rotations[s.active.rot]) {
        const y = s.active.y + c.y
        if (y >= 0) block(ctx, (s.active.x + c.x) * CELL, y * CELL, CELL, p.color)
    }

    preview(ctx, s.next)

    ctx.font = '600 16px system-ui, sans-serif'
    ctx.fillStyle = '#8b97a6'
    ctx.textAlign = 'left'
    ctx.fillText('Level ' + s.level + ' · ' + s.lines + ' Reihen', 10, 28)
}

export default function Tetris(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createTetris, props, canvas, draw })
    return <canvas ref={canvas} />
}
