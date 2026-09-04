import { H, PH, PLAT_H, PLAT_W, PW, W, createDoodle, type DoodleSim } from '../../../../shared/games/doodle.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

function drawFigure(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x - PW / 2, y - PH / 2, PW, PH)
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(x - 7, y - 6, 4, 4)
    ctx.fillRect(x + 3, y - 6, 4, 4)
}

function draw(ctx: CanvasRenderingContext2D, s: DoodleSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    for (const p of s.plats) {
        const y = p.y - s.cam
        if (y < -PLAT_H || y > H) continue
        ctx.fillStyle = '#4ade80'
        ctx.fillRect(p.x, y, PLAT_W, PLAT_H)
        ctx.fillStyle = '#22683f'
        ctx.fillRect(p.x, y + PLAT_H - 3, PLAT_W, 3)
    }

    const sy = s.y - s.cam
    drawFigure(ctx, s.x, sy)
    if (s.x < PW) drawFigure(ctx, s.x + W, sy)
    if (s.x > W - PW) drawFigure(ctx, s.x - W, sy)
}

export default function Doodle(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createDoodle, props, canvas, draw })
    return <canvas ref={canvas} />
}
