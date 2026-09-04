import { useEffect, useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'

const W = 360
const H = 540
const BH = 26
const BASE_W = 168
const BASE_Y = H - 96
const HOVER = 88
const FALL = 1150
const VIEW = 152

const COLORS = ['#4ade80', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c']

type Block = { x: number; w: number; y: number }

type State = {
    stack: Block[]
    cur: Block
    dir: number
    speed: number
    dropping: boolean
    cam: number
    score: number
    over: boolean
}

function hover(top: Block): Block {
    return { x: Math.random() < 0.5 ? 0 : W - top.w, w: top.w, y: top.y - BH - HOVER }
}

function init(): State {
    const base = { x: (W - BASE_W) / 2, w: BASE_W, y: BASE_Y }
    return { stack: [base], cur: hover(base), dir: 1, speed: 148, dropping: false, cam: 0, score: 0, over: false }
}

export default function Tower({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useEffect(() => {
        return controls.on((a) => {
            if (a !== 'fire') return
            const s = state.current
            if (s.over || s.dropping) return
            s.dropping = true
        })
    }, [controls])

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        const top = s.stack[s.stack.length - 1]

        if (s.dropping) {
            s.cur.y += FALL * dt
            if (s.cur.y >= top.y - BH) {
                const left = Math.max(top.x, s.cur.x)
                const right = Math.min(top.x + top.w, s.cur.x + s.cur.w)

                // unter zwei pixel bleibt nichts stehen, worauf der naechste block passt
                if (right - left < 2) {
                    s.over = true
                    onGameOver(s.score)
                    return
                }

                const placed = { x: left, w: right - left, y: top.y - BH }
                s.stack.push(placed)
                s.score += 1
                onScore(s.score)
                s.speed = Math.min(330, s.speed + 7)
                s.dropping = false
                s.cur = hover(placed)
            }
        } else {
            s.cur.x += s.dir * s.speed * dt
            if (s.cur.x <= 0) {
                s.cur.x = 0
                s.dir = 1
            } else if (s.cur.x + s.cur.w >= W) {
                s.cur.x = W - s.cur.w
                s.dir = -1
            }
        }

        const wanted = Math.max(0, VIEW - (s.stack[s.stack.length - 1].y - BH - HOVER))
        s.cam += (wanted - s.cam) * Math.min(1, dt * 5)

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
    }, !paused)

    return <canvas ref={canvas} />
}
