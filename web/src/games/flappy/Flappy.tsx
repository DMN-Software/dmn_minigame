import { BIRD_R, BIRD_X, GROUND, H, PIPE_W, W, createFlappy, type FlappySim } from '../../../../shared/games/flappy.ts'
import { verticalFade } from '../../shell/paint.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

// vy zaehlt je tick, die neigung war auf px je sekunde geeicht
const TILT = 620 / 60
const TAU = Math.PI * 2

const SKY_TOP = '#4ec0ca'
const SKY_BOTTOM = '#71c5cf'
const CLOUD = 'rgba(255, 255, 255, .55)'

const PIPE_BODY = '#74bf2e'
const PIPE_LIGHT = '#96d43f'
const PIPE_DARK = '#4a8a1c'
const PIPE_EDGE = '#3f6f14'
const CAP_H = 26
const CAP_OUT = 4

const DIRT = '#ded895'
const DIRT_EDGE = '#c4bb6a'
const DIRT_STRIPE = 'rgba(196, 187, 106, .5)'
const EDGE_H = 9
const STRIPE = 16

const BIRD_BODY = '#f7d51d'
const BIRD_BELLY = '#f2a33a'
const BEAK = '#f97316'
const OUTLINE = '#3d3218'

const CLOUDS = [
    { x: 24, y: 92, r: 22 },
    { x: 148, y: 148, r: 17 },
    { x: 268, y: 74, r: 25 },
    { x: 372, y: 174, r: 19 },
]
const CLOUD_SPAN = W + 160

function drawClouds(ctx: CanvasRenderingContext2D, t: number) {
    ctx.fillStyle = CLOUD
    for (const c of CLOUDS) {
        const x = ((c.x - t * 9) % CLOUD_SPAN + CLOUD_SPAN) % CLOUD_SPAN - 80
        ctx.beginPath()
        ctx.arc(x, c.y, c.r, 0, TAU)
        ctx.arc(x + c.r, c.y + c.r * 0.35, c.r * 0.78, 0, TAU)
        ctx.arc(x - c.r * 0.95, c.y + c.r * 0.4, c.r * 0.68, 0, TAU)
        ctx.arc(x + c.r * 1.9, c.y + c.r * 0.55, c.r * 0.5, 0, TAU)
        ctx.fill()
    }
}

function drawTube(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    if (h <= 0) return
    ctx.fillStyle = PIPE_BODY
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = PIPE_LIGHT
    ctx.fillRect(x + 5, y, 9, h)
    ctx.fillStyle = PIPE_DARK
    ctx.fillRect(x + w - 15, y, 12, h)
    ctx.fillStyle = PIPE_EDGE
    ctx.fillRect(x, y, 3, h)
    ctx.fillRect(x + w - 3, y, 3, h)
}

function drawPipes(ctx: CanvasRenderingContext2D, s: FlappySim) {
    const floor = H - GROUND
    for (const p of s.pipes) {
        const top = p.y - p.half
        const bottom = p.y + p.half
        drawTube(ctx, p.x, 0, PIPE_W, top - CAP_H)
        drawTube(ctx, p.x - CAP_OUT, top - CAP_H, PIPE_W + CAP_OUT * 2, CAP_H)
        drawTube(ctx, p.x, bottom + CAP_H, PIPE_W, floor - bottom - CAP_H)
        drawTube(ctx, p.x - CAP_OUT, bottom, PIPE_W + CAP_OUT * 2, CAP_H)
    }
}

function drawGround(ctx: CanvasRenderingContext2D, t: number) {
    const y = H - GROUND
    ctx.fillStyle = DIRT
    ctx.fillRect(0, y, W, GROUND)
    ctx.fillStyle = DIRT_EDGE
    ctx.fillRect(0, y, W, EDGE_H)

    ctx.save()
    ctx.beginPath()
    ctx.rect(0, y + EDGE_H, W, GROUND - EDGE_H)
    ctx.clip()
    ctx.strokeStyle = DIRT_STRIPE
    ctx.lineWidth = 7
    ctx.beginPath()
    const shift = (t * 70) % (STRIPE * 2)
    for (let x = -GROUND; x < W + GROUND; x += STRIPE * 2) {
        ctx.moveTo(x - shift, H)
        ctx.lineTo(x - shift + GROUND, y)
    }
    ctx.stroke()
    ctx.restore()
}

function drawBird(ctx: CanvasRenderingContext2D, s: FlappySim, t: number) {
    ctx.save()
    ctx.translate(BIRD_X, s.y)
    ctx.rotate(Math.max(-0.45, Math.min(1.1, s.vy / TILT)))

    ctx.beginPath()
    ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R - 0.5, 0, 0, TAU)
    ctx.save()
    ctx.clip()
    ctx.fillStyle = BIRD_BODY
    ctx.fillRect(-14, -12, 28, 24)
    ctx.fillStyle = BIRD_BELLY
    ctx.fillRect(-14, 2, 28, 12)
    ctx.restore()
    ctx.lineWidth = 1.6
    ctx.strokeStyle = OUTLINE
    ctx.stroke()

    // fluegelschlag laeuft ueber die uhr, der zustand kennt keine phase
    const wing = Math.sin(t * 11) * 3.5
    ctx.beginPath()
    ctx.ellipse(-3, 1 + wing, 7, 4.5, 0, 0, TAU)
    ctx.fillStyle = BIRD_BELLY
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = BEAK
    ctx.beginPath()
    ctx.moveTo(8, -3)
    ctx.lineTo(18, 0)
    ctx.lineTo(8, 4)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(5.5, -4, 4.2, 0, TAU)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(7, -4, 1.9, 0, TAU)
    ctx.fillStyle = OUTLINE
    ctx.fill()

    ctx.restore()
}

function bigText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
    ctx.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size / 8
    ctx.strokeStyle = '#31200f'
    ctx.strokeText(text, x, y)
    ctx.fillStyle = '#fff'
    ctx.fillText(text, x, y)
    ctx.textAlign = 'left'
}

function draw(ctx: CanvasRenderingContext2D, s: FlappySim) {
    const t = performance.now() / 1000

    ctx.fillStyle = verticalFade(ctx, 0, 0, H, SKY_TOP, SKY_BOTTOM)
    ctx.fillRect(0, 0, W, H)

    drawClouds(ctx, t)
    drawPipes(ctx, s)
    drawGround(ctx, t)
    drawBird(ctx, s, t)

    bigText(ctx, String(s.score), W / 2, 76, 44)
    if (!s.started) bigText(ctx, 'Tippen', W / 2, H / 2 + 96, 22)
}

export default function Flappy(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createFlappy, props, canvas, draw })
    return <canvas ref={canvas} />
}
