import { BASE_Y, BH, H, HOVER, W, createTower, type TowerSim } from '../../../../shared/games/tower.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const COLORS = ['#4ade80', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c']

function draw(ctx: CanvasRenderingContext2D, s: TowerSim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    const groundY = BASE_Y + BH + s.cam
    if (groundY < H) {
        ctx.fillStyle = '#161b22'
        ctx.fillRect(0, groundY, W, H - groundY)
        ctx.fillStyle = '#232a33'
        ctx.fillRect(0, groundY, W, 3)
    }

    for (let i = 0; i < s.stack.length; i++) {
        const b = s.stack[i]
        const y = b.y + s.cam
        if (y > H || y + BH < 0) continue
        ctx.fillStyle = COLORS[i % COLORS.length]
        ctx.fillRect(b.x, y, b.w, BH - 2)
    }

    ctx.fillStyle = COLORS[s.stack.length % COLORS.length]
    ctx.fillRect(s.cur.x, s.cur.y + s.cam, s.cur.w, BH - 2)

    if (!s.dropping) {
        ctx.fillStyle = '#232a33'
        ctx.fillRect(s.cur.x + s.cur.w / 2 - 1, s.cur.y + s.cam + BH, 2, HOVER)
    }
}

export default function Tower(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createTower, props, canvas, draw })
    return <canvas ref={canvas} />
}
