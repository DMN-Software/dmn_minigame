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

const BG = '#000000'
const INK = '#e8e8e8'
const ROW_COLORS = ['#cb4f42', '#d97d33', '#d3b036', '#3f9c3a', '#3b5bbf']
const WALL = 6
const BIG = '800 22px system-ui, -apple-system, "Segoe UI", sans-serif'
const SMALL = '800 14px system-ui, -apple-system, "Segoe UI", sans-serif'

// letzte ballpositionen fuer den nachzieheffekt, reine anzeige und ausserhalb der simulation
const trail: number[] = []

function draw(ctx: CanvasRenderingContext2D, s: BreakoutSim) {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)

    // die steine werden um einen pixel groesser gezeichnet, damit von den vier pixeln
    // abstand der simulation die zwei pixel fuge des automaten uebrig bleiben
    for (let i = 0; i < s.bricks.length; i++) {
        if (!s.bricks[i]) continue
        const row = (i / COLS) | 0
        ctx.fillStyle = ROW_COLORS[row]
        ctx.fillRect(MARGIN + (i % COLS) * (BRICK_W + GAP) - 1, TOP + row * (BRICK_H + GAP) - 1, BRICK_W + 2, BRICK_H + 2)
    }

    ctx.fillStyle = INK
    ctx.fillRect(0, 0, WALL, H)
    ctx.fillRect(W - WALL, 0, WALL, H)
    ctx.fillRect(0, 0, W, WALL)

    for (let i = 0; i < s.lives; i++) ctx.fillRect(WALL + 10 + i * 13, 17, 8, 8)

    ctx.textBaseline = 'top'
    ctx.textAlign = 'center'
    ctx.font = BIG
    ctx.fillText(String(s.score).padStart(3, '0'), W / 2, 12)
    ctx.textAlign = 'right'
    ctx.font = SMALL
    ctx.fillText('RUNDE ' + s.round, W - WALL - 10, 17)

    ctx.fillRect(s.px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H)

    if (s.stuck) trail.length = 0
    else {
        trail.push(s.x, s.y)
        if (trail.length > 8) trail.splice(0, 2)
    }

    ctx.save()
    for (let i = 0; i < trail.length - 2; i += 2) {
        ctx.globalAlpha = 0.12 + 0.11 * (i / 2)
        ctx.fillRect(trail[i] - R, trail[i + 1] - R, R * 2, R * 2)
    }
    ctx.restore()

    ctx.fillRect(s.x - R, s.y - R, R * 2, R * 2)

    if (s.stuck && Math.floor(performance.now() / 400) % 2 === 0) {
        ctx.textAlign = 'center'
        ctx.fillText('LEERTASTE ODER TIPPEN', W / 2, PADDLE_Y - 34)
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
