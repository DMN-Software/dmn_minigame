import { BIRD_R, BIRD_X, GROUND, H, PIPE_W, W, createFlappy, type FlappySim } from '../../../../shared/games/flappy.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

// vy zaehlt je tick, die neigung war auf px je sekunde geeicht
const TILT = 620 / 60

function draw(ctx: CanvasRenderingContext2D, s: FlappySim) {
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(0, 0, W, H)

    for (const p of s.pipes) {
        const gapTop = p.y - p.half
        const gapBottom = p.y + p.half
        ctx.fillStyle = '#22683f'
        ctx.fillRect(p.x, 0, PIPE_W, gapTop)
        ctx.fillRect(p.x, gapBottom, PIPE_W, H - GROUND - gapBottom)
        ctx.fillStyle = '#4ade80'
        ctx.fillRect(p.x - 3, gapTop - 15, PIPE_W + 6, 15)
        ctx.fillRect(p.x - 3, gapBottom, PIPE_W + 6, 15)
    }

    ctx.fillStyle = '#161b22'
    ctx.fillRect(0, H - GROUND, W, GROUND)
    ctx.fillStyle = '#232a33'
    ctx.fillRect(0, H - GROUND, W, 3)

    ctx.save()
    ctx.translate(BIRD_X, s.y)
    ctx.rotate(Math.max(-0.45, Math.min(1.1, s.vy / TILT)))
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fb923c'
    ctx.fillRect(BIRD_R - 4, -2, 8, 4)
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(1, -6, 4, 4)
    ctx.restore()

    if (!s.started) {
        ctx.font = '600 16px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#8b97a6'
        ctx.fillText('Zum Starten tippen', W / 2, H / 2 + 90)
        ctx.textAlign = 'left'
    }
}

export default function Flappy(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createFlappy, props, canvas, draw })
    return <canvas ref={canvas} />
}
