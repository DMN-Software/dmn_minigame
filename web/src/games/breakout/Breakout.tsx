import { useEffect, useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'

const W = 480
const H = 360
const COLS = 10
const ROWS = 5
const BRICK_W = 42
const BRICK_H = 16
const GAP = 4
const MARGIN = 12
const TOP = 48
const PADDLE_W = 72
const PADDLE_H = 10
const PADDLE_Y = H - 26
const PADDLE_SPEED = 620
const R = 5
const BASE = 210
const ROW_COLORS = ['#f472b6', '#a78bfa', '#38bdf8', '#4ade80', '#fbbf24']

type State = {
    bricks: boolean[]
    px: number
    x: number
    y: number
    vx: number
    vy: number
    stuck: boolean
    lives: number
    round: number
    score: number
    over: boolean
}

function init(): State {
    return {
        bricks: new Array(COLS * ROWS).fill(true),
        px: W / 2,
        x: W / 2,
        y: PADDLE_Y - R - 1,
        vx: 0,
        vy: 0,
        stuck: true,
        lives: 3,
        round: 1,
        score: 0,
        over: false,
    }
}

function launch(s: State) {
    const speed = BASE * Math.pow(1.12, s.round - 1)
    const a = (Math.random() - 0.5) * 0.7
    s.vx = Math.sin(a) * speed
    s.vy = -Math.cos(a) * speed
    s.stuck = false
}

function bricks(s: State): number {
    for (let i = 0; i < s.bricks.length; i++) {
        if (!s.bricks[i]) continue

        const col = i % COLS
        const row = (i / COLS) | 0
        const bx = MARGIN + col * (BRICK_W + GAP)
        const by = TOP + row * (BRICK_H + GAP)
        if (s.x + R < bx || s.x - R > bx + BRICK_W) continue
        if (s.y + R < by || s.y - R > by + BRICK_H) continue

        s.bricks[i] = false
        // die flachere ueberdeckung verraet, ueber welche kante der ball gekommen ist
        const ox = Math.min(s.x + R - bx, bx + BRICK_W - (s.x - R))
        const oy = Math.min(s.y + R - by, by + BRICK_H - (s.y - R))
        if (ox < oy) s.vx = -s.vx
        else s.vy = -s.vy
        return ROWS - row
    }
    return 0
}

function advance(s: State, dt: number): number {
    s.x += s.vx * dt
    s.y += s.vy * dt

    if (s.x < R) {
        s.x = R
        s.vx = Math.abs(s.vx)
    }
    if (s.x > W - R) {
        s.x = W - R
        s.vx = -Math.abs(s.vx)
    }
    if (s.y < R) {
        s.y = R
        s.vy = Math.abs(s.vy)
    }

    if (s.vy > 0 && s.y + R >= PADDLE_Y && s.y - R <= PADDLE_Y + PADDLE_H && Math.abs(s.x - s.px) <= PADDLE_W / 2 + R) {
        const off = Math.max(-1, Math.min(1, (s.x - s.px) / (PADDLE_W / 2)))
        const speed = Math.hypot(s.vx, s.vy)
        const a = off * 1.05
        s.vx = Math.sin(a) * speed
        s.vy = -Math.cos(a) * speed
        s.y = PADDLE_Y - R
    }

    return bricks(s)
}

function serve(s: State) {
    s.stuck = true
    s.vx = 0
    s.vy = 0
    s.x = s.px
    s.y = PADDLE_Y - R - 1
}

export default function Breakout({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useEffect(() => {
        return controls.on((a) => {
            const s = state.current
            if (a === 'fire' && s.stuck && !s.over) launch(s)
        })
    }, [controls])

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        const axis = controls.axis()
        if (axis !== 0) {
            const step = PADDLE_SPEED * dt
            const d = ((axis + 1) / 2) * W - s.px
            s.px += Math.max(-step, Math.min(step, d))
        } else {
            const dir = (controls.held('right') ? 1 : 0) - (controls.held('left') ? 1 : 0)
            s.px += dir * PADDLE_SPEED * dt
        }
        s.px = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, s.px))

        if (s.stuck) {
            s.x = s.px
            s.y = PADDLE_Y - R - 1
        } else {
            // bei hohem tempo passt der ball sonst zwischen zwei frames durch einen stein
            const steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 4))
            for (let i = 0; i < steps; i++) {
                const points = advance(s, dt / steps)
                if (points > 0) {
                    s.score += points
                    onScore(s.score)
                }
                if (s.y - R > H) {
                    s.lives -= 1
                    if (s.lives <= 0) {
                        s.over = true
                        onGameOver(s.score)
                        return
                    }
                    serve(s)
                    break
                }
            }

            if (s.bricks.every((b) => !b)) {
                s.round += 1
                s.bricks = new Array(COLS * ROWS).fill(true)
                serve(s)
            }
        }

        ctx.fillStyle = '#0d1014'
        ctx.fillRect(0, 0, W, H)

        for (let i = 0; i < s.bricks.length; i++) {
            if (!s.bricks[i]) continue
            const row = (i / COLS) | 0
            ctx.fillStyle = ROW_COLORS[row]
            ctx.fillRect(MARGIN + (i % COLS) * (BRICK_W + GAP), TOP + row * (BRICK_H + GAP), BRICK_W, BRICK_H)
        }

        ctx.fillStyle = '#e6ebf2'
        ctx.fillRect(s.px - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H)

        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(s.x, s.y, R, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = '600 16px system-ui, sans-serif'
        ctx.fillStyle = '#8b97a6'
        ctx.textAlign = 'left'
        ctx.fillText('Leben ' + s.lives, MARGIN, 28)
        ctx.textAlign = 'right'
        ctx.fillText('Runde ' + s.round, W - MARGIN, 28)

        if (s.stuck) {
            ctx.textAlign = 'center'
            ctx.fillText('Leertaste oder tippen', W / 2, PADDLE_Y - 34)
        }
    }, !paused)

    return <canvas ref={canvas} />
}
