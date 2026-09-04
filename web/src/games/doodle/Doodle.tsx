import { H, PH, PLAT_H, PLAT_W, PW, W, createDoodle, type DoodleSim } from '../../../../shared/games/doodle.ts'
import { fillRound, label, roundRect } from '../../shell/paint.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const PAPER = '#f3efe0'
const RULE = 'rgba(120, 110, 80, .18)'
const GRID = 24

const PLAT = '#7ab648'
const PLAT_EDGE = '#5d8f36'

const BODY = '#8ed14f'
const INK = '#3f3a2a'
const LINE = '#2f3a1e'
const TAU = Math.PI * 2

function drawPaper(ctx: CanvasRenderingContext2D, cam: number) {
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = RULE
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = GRID; x < W; x += GRID) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
    }
    // das karo haengt an der welt, sonst steht der block beim scrollen still
    const start = ((-cam % GRID) + GRID) % GRID
    for (let y = start; y < H; y += GRID) {
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
    }
    ctx.stroke()
}

function drawFigure(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = LINE

    ctx.beginPath()
    ctx.moveTo(x - 7, y + PH / 2 - 3)
    ctx.lineTo(x - 9, y + PH / 2 + 4)
    ctx.moveTo(x + 6, y + PH / 2 - 3)
    ctx.lineTo(x + 8, y + PH / 2 + 4)
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(x, y + 1, PW / 2 - 1, PH / 2 - 2, 0, 0, TAU)
    ctx.fillStyle = BODY
    ctx.fill()
    ctx.stroke()

    // ruessel nach rechts, daran erkennt man die figur ueberhaupt erst
    ctx.beginPath()
    ctx.moveTo(x + 4, y - 1)
    ctx.quadraticCurveTo(x + 16, y - 2, x + 15, y + 5)
    ctx.quadraticCurveTo(x + 10, y + 6, x + 6, y + 4)
    ctx.fillStyle = BODY
    ctx.fill()
    ctx.stroke()

    for (const eye of [-4, 5]) {
        ctx.beginPath()
        ctx.arc(x + eye, y - 8, 4.5, 0, TAU)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x + eye + 1, y - 7, 1.8, 0, TAU)
        ctx.fillStyle = LINE
        ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(x, y + 1, 7, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()
}

function draw(ctx: CanvasRenderingContext2D, s: DoodleSim) {
    drawPaper(ctx, s.cam)

    for (const p of s.plats) {
        const y = p.y - s.cam
        if (y < -PLAT_H || y > H) continue
        fillRound(ctx, p.x, y, PLAT_W, PLAT_H, 4, PLAT_EDGE)
        fillRound(ctx, p.x, y, PLAT_W, PLAT_H - 3, 4, PLAT)
        roundRect(ctx, p.x, y, PLAT_W, PLAT_H, 4)
        ctx.strokeStyle = 'rgba(47, 58, 30, .35)'
        ctx.lineWidth = 1
        ctx.stroke()
    }

    const sy = s.y - s.cam
    drawFigure(ctx, s.x, sy)
    if (s.x < PW) drawFigure(ctx, s.x + W, sy)
    if (s.x > W - PW) drawFigure(ctx, s.x - W, sy)

    label(ctx, String(s.score), 14, 12, 22, INK)
}

export default function Doodle(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createDoodle, props, canvas, draw })
    return <canvas ref={canvas} />
}
