import { CX, H, HALF, PADDLE_H, PADDLE_W, PX, W, createPong, type PongSim } from '../../../../shared/games/pong.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

function draw(ctx: CanvasRenderingContext2D, s: PongSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#232a33'
    for (let y = 10; y < H - 10; y += 22) ctx.fillRect(W / 2 - 1, y, 2, 12)

    ctx.fillStyle = '#4ade80'
    ctx.fillRect(PX, s.py - PADDLE_H / 2, PADDLE_W, PADDLE_H)
    ctx.fillStyle = '#f472b6'
    ctx.fillRect(CX, s.cy - PADDLE_H / 2, PADDLE_W, PADDLE_H)

    ctx.fillStyle = '#e6ebf2'
    ctx.fillRect(s.bx - HALF, s.by - HALF, HALF * 2, HALF * 2)

    ctx.font = '600 16px system-ui, sans-serif'
    ctx.fillStyle = '#8b97a6'
    ctx.textAlign = 'right'
    ctx.fillText(String(s.score), W / 2 - 16, 30)
    ctx.textAlign = 'left'
    ctx.fillText(String(s.cpu), W / 2 + 16, 30)
}

export default function Pong(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({
        create: createPong,
        props,
        canvas,
        draw,
        // hoechstens jeden vierten tick, sonst blaeht dauernde mausbewegung das protokoll auf
        sample: (c, tick) => {
            if (tick % 4 !== 0) return -1
            const p = c.pointer()
            return p ? Math.round(p.y * 1000) : -1
        },
    })
    return <canvas ref={canvas} />
}
