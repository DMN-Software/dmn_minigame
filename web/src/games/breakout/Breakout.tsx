import {
    BRICK_H,
    BRICK_W,
    COLS,
    GAP,
    H,
    MARGIN,
    PADDLE_H,
    PADDLE_W,
    PADDLE_Y,
    R,
    TOP,
    W,
    createBreakout,
    type BreakoutSim,
} from '../../../../shared/games/breakout.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const ROW_COLORS = ['#f472b6', '#a78bfa', '#38bdf8', '#4ade80', '#fbbf24']

function draw(ctx: CanvasRenderingContext2D, s: BreakoutSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    for (let i = 0; i < s.bricks.length; i++) {
        if (!s.bricks[i]) continue
        const row = (i / COLS) | 0
        ctx.fillStyle = ROW_COLORS[row]
        ctx.fillRect(MARGIN + (i % COLS) * (BRICK_W + GAP), TOP + row * (BRICK_H + GAP), BRICK_W, BRICK_H)
    }

    ctx.fillStyle = '#e6ebf2'
    ctx.fillRect(s.px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H)

    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(s.x, s.y, R, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = '600 16px system-ui, sans-serif'
    ctx.fillStyle = '#8b97a6'
    ctx.textAlign = 'left'
    ctx.fillText('Leben ' + s.lives, MARGIN, 28)
    ctx.textAlign = 'right'
    ctx.fillText('Runde ' + s.round, W - MARGIN, 28)

    if (s.stuck) {
        ctx.textAlign = 'center'
        ctx.fillText('Leertaste oder tippen', W / 2, PADDLE_Y - 34)
    }
}

export default function Breakout(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({
        create: createBreakout,
        props,
        canvas,
        draw,
        // hoechstens jeden vierten tick, sonst blaeht dauernde mausbewegung das protokoll auf
        sample: (c, tick) => {
            if (tick % 4 !== 0) return -1
            const p = c.pointer()
            return p ? Math.round(p.x * 1000) : -1
        },
    })
    return <canvas ref={canvas} />
}
