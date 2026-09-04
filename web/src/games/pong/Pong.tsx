import { CX, H, HALF, PADDLE_H, PADDLE_W, PX, W, createPong, type PongSim } from '../../../../shared/games/pong.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const BG = '#000000'
const INK = '#ffffff'
const RAIL = 6
const DIGIT_W = 30
const DIGIT_H = 54
const STROKE = 9
const DIGIT_GAP = 12

// segmente a b c d e f g als bits, wie auf den ziffernanzeigen des originals
const SEGMENTS = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f]

function digit(ctx: CanvasRenderingContext2D, n: number, x: number, y: number) {
    const m = SEGMENTS[n]
    const half = DIGIT_H / 2
    if (m & 0x01) ctx.fillRect(x, y, DIGIT_W, STROKE)
    if (m & 0x02) ctx.fillRect(x + DIGIT_W - STROKE, y, STROKE, half)
    if (m & 0x04) ctx.fillRect(x + DIGIT_W - STROKE, y + half, STROKE, half)
    if (m & 0x08) ctx.fillRect(x, y + DIGIT_H - STROKE, DIGIT_W, STROKE)
    if (m & 0x10) ctx.fillRect(x, y + half, STROKE, half)
    if (m & 0x20) ctx.fillRect(x, y, STROKE, half)
    if (m & 0x40) ctx.fillRect(x, y + (DIGIT_H - STROKE) / 2, DIGIT_W, STROKE)
}

function score(ctx: CanvasRenderingContext2D, value: number, x: number, y: number, toRight: boolean) {
    const text = String(value)
    const w = text.length * DIGIT_W + (text.length - 1) * DIGIT_GAP
    let cur = toRight ? x : x - w
    for (let i = 0; i < text.length; i++) {
        digit(ctx, text.charCodeAt(i) - 48, cur, y)
        cur += DIGIT_W + DIGIT_GAP
    }
}

function draw(ctx: CanvasRenderingContext2D, s: PongSim) {
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = INK
    ctx.fillRect(0, 0, W, RAIL)
    ctx.fillRect(0, H - RAIL, W, RAIL)

    for (let y = RAIL + 10; y < H - RAIL - 10; y += 24) ctx.fillRect(W / 2 - 3, y, 6, 14)

    score(ctx, s.score, W / 2 - 34, 26, false)
    score(ctx, s.cpu, W / 2 + 34, 26, true)

    ctx.fillRect(PX, s.py - PADDLE_H / 2, PADDLE_W, PADDLE_H)
    ctx.fillRect(CX, s.cy - PADDLE_H / 2, PADDLE_W, PADDLE_H)
    ctx.fillRect(s.bx - HALF, s.by - HALF, HALF * 2, HALF * 2)
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
