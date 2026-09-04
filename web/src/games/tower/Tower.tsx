import { BH, H, W, createTower, type Block, type TowerSim } from '../../../../shared/games/tower.ts'
import { verticalFade } from '../../shell/paint.ts'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useSim } from '../../shell/useSim.ts'
import type { GameProps } from '../../shell/types.ts'

const BG_TOP = '#0f1523'
const BG_BOTTOM = '#080b12'
const SCORE = 'rgba(255, 255, 255, .13)'

const HUE_BASE = 200
const HUE_STEP = 8
const SAT = 62
const L_FACE = 58
const L_TOP = 71
const L_SIDE = 43

const TOP_H = 6
const SIDE_W = 8
const CHIP_FALL = 620

// der abgesaegte streifen lebt nur im bild, der zustand kennt ihn nicht mehr.
// aus zwei benachbarten bloecken laesst sich seine breite ableiten, den startzeitpunkt
// liefert der wechsel der stapelhoehe
let chip: { x: number; w: number; y: number; idx: number; at: number } | null = null
let seen = 0

function tone(i: number, light: number) {
    return `hsl(${(i * HUE_STEP + HUE_BASE) % 360}, ${SAT}%, ${light}%)`
}

function drawBlock(ctx: CanvasRenderingContext2D, b: Block, y: number, i: number) {
    ctx.fillStyle = tone(i, L_FACE)
    ctx.fillRect(b.x, y, b.w, BH - 1)
    ctx.fillStyle = tone(i, L_TOP)
    ctx.fillRect(b.x, y, b.w, TOP_H)
    ctx.fillStyle = tone(i, L_SIDE)
    ctx.fillRect(b.x + b.w - Math.min(SIDE_W, b.w), y, Math.min(SIDE_W, b.w), BH - 1)
}

function trackChip(s: TowerSim) {
    if (s.stack.length === seen) return
    if (s.stack.length < seen) chip = null
    seen = s.stack.length

    const i = s.stack.length - 1
    if (i < 1) return
    const b = s.stack[i]
    const prev = s.stack[i - 1]
    const cut = prev.w - b.w
    if (cut < 1) return

    chip = {
        x: b.x > prev.x ? b.x + b.w : b.x - cut,
        w: cut,
        y: b.y,
        idx: i,
        at: performance.now(),
    }
}

function drawChip(ctx: CanvasRenderingContext2D, cam: number) {
    if (!chip) return
    const age = (performance.now() - chip.at) / 1000
    const y = chip.y + cam + CHIP_FALL * age * age
    if (y > H) {
        chip = null
        return
    }
    ctx.save()
    ctx.globalAlpha = Math.max(0, 1 - age * 0.8)
    ctx.fillStyle = tone(chip.idx, L_FACE)
    ctx.fillRect(chip.x, y, chip.w, BH - 1)
    ctx.fillStyle = tone(chip.idx, L_TOP)
    ctx.fillRect(chip.x, y, chip.w, TOP_H)
    ctx.restore()
}

function draw(ctx: CanvasRenderingContext2D, s: TowerSim) {
    ctx.fillStyle = verticalFade(ctx, 0, 0, H, BG_TOP, BG_BOTTOM)
    ctx.fillRect(0, 0, W, H)

    ctx.font = '800 76px system-ui, -apple-system, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = SCORE
    ctx.fillText(String(s.score), W / 2, H / 3)
    ctx.textAlign = 'left'

    trackChip(s)
    drawChip(ctx, s.cam)

    for (let i = 0; i < s.stack.length; i++) {
        const y = s.stack[i].y + s.cam
        if (y > H || y + BH < 0) continue
        drawBlock(ctx, s.stack[i], y, i)
    }

    drawBlock(ctx, s.cur, s.cur.y + s.cam, s.stack.length)
}

export default function Tower(props: GameProps) {
    const canvas = useCanvas(W, H)
    useSim({ create: createTower, props, canvas, draw })
    return <canvas ref={canvas} />
}
