import { useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'

const W = 360
const H = 540
const PW = 26
const PH = 26
const PLAT_W = 66
const PLAT_H = 10
const GRAVITY = 1500
const JUMP = -660
const MOVE = 300
const START_Y = H - 80
const BASE_Y = START_Y - PH / 2
const UNIT = 10

type Plat = { x: number; y: number }

type State = {
    x: number
    y: number
    vy: number
    plats: Plat[]
    cam: number
    top: number
    score: number
    over: boolean
}

function addPlat(s: State) {
    const last = s.plats[s.plats.length - 1]
    // der sprung schafft 145 px, mehr als 122 laesst sich seitlich nicht mehr ausgleichen
    const reach = Math.min(122, 96 + (START_Y - last.y) / 90)
    s.plats.push({ x: Math.random() * (W - PLAT_W), y: last.y - (58 + Math.random() * (reach - 58)) })
}

function init(): State {
    const s: State = {
        x: W / 2,
        y: BASE_Y,
        vy: 0,
        plats: [{ x: (W - PLAT_W) / 2, y: START_Y }],
        cam: 0,
        top: BASE_Y,
        score: 0,
        over: false,
    }
    while (s.plats[s.plats.length - 1].y > -H) addPlat(s)
    return s
}

function drawFigure(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(x - PW / 2, y - PH / 2, PW, PH)
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(x - 7, y - 6, 4, 4)
    ctx.fillRect(x + 3, y - 6, 4, 4)
}

export default function Doodle({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        const axis = controls.axis()
        // der zeiger liegt selten genau in der mitte, darum ein kleiner totbereich
        const dir =
            Math.abs(axis) > 0.12
                ? Math.max(-1, Math.min(1, axis))
                : (controls.held('right') ? 1 : 0) - (controls.held('left') ? 1 : 0)

        s.x += dir * MOVE * dt
        if (s.x < 0) s.x += W
        if (s.x > W) s.x -= W

        const was = s.y + PH / 2
        s.vy += GRAVITY * dt
        s.y += s.vy * dt
        const now = s.y + PH / 2

        if (s.vy > 0) {
            for (const p of s.plats) {
                if (was > p.y || now < p.y) continue
                let dx = s.x - (p.x + PLAT_W / 2)
                if (dx > W / 2) dx -= W
                if (dx < -W / 2) dx += W
                if (Math.abs(dx) < (PLAT_W + PW) / 2 - 3) {
                    s.y = p.y - PH / 2
                    s.vy = JUMP
                    break
                }
            }
        }

        if (s.y - s.cam < 220) s.cam = s.y - 220
        if (s.y < s.top) {
            s.top = s.y
            const height = Math.floor((BASE_Y - s.top) / UNIT)
            if (height > s.score) {
                s.score = height
                onScore(height)
            }
        }

        while (s.plats[s.plats.length - 1].y > s.cam - 40) addPlat(s)
        while (s.plats[0].y > s.cam + H + 60) s.plats.shift()

        if (s.y - s.cam > H + PH) {
            s.over = true
            onGameOver(s.score)
            return
        }

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
    }, !paused)

    return <canvas ref={canvas} />
}
