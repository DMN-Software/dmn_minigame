import { useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'

const W = 480
const H = 300
const PADDLE_W = 8
const PADDLE_H = 52
const PX = 18
const CX = W - 26
const HALF = 4
const PLAYER_SPEED = 420
const CPU_SPEED = 230
const AIM = 20
const WIDE_AIM = 40
const BASE = 280
const MAX_SPEED = 660
const WIN = 11

type State = {
    py: number
    cy: number
    bx: number
    by: number
    vx: number
    vy: number
    aim: number
    rally: number
    player: number
    cpu: number
    wait: number
    over: boolean
}

function aimError(): number {
    // meist zielt er nur knapp daneben. ohne die seltenen ausreisser kommt er an jeden
    // flachen ball heran und der ballwechsel hoert nie auf
    return (Math.random() * 2 - 1) * (Math.random() < 0.06 ? WIDE_AIM : AIM)
}

function serve(s: State, dir: number) {
    s.bx = W / 2
    s.by = H / 2
    s.vx = dir * BASE
    s.vy = (Math.random() - 0.5) * BASE * 0.6
    s.aim = aimError()
    s.rally = 0
    s.wait = 0.7
}

function init(): State {
    const s: State = {
        py: H / 2,
        cy: H / 2,
        bx: W / 2,
        by: H / 2,
        vx: 0,
        vy: 0,
        aim: 0,
        rally: 0,
        player: 0,
        cpu: 0,
        wait: 0,
        over: false,
    }
    serve(s, Math.random() < 0.5 ? -1 : 1)
    return s
}

function hit(s: State, paddleY: number, dir: number) {
    const off = Math.max(-1, Math.min(1, (s.by - paddleY) / (PADDLE_H / 2)))
    // ganz flache baelle laufen sonst ewig auf derselben hoehe hin und her
    const a = Math.abs(off) < 0.12 ? (s.by < H / 2 ? 0.12 : -0.12) : off * 0.8
    // jeder schlagabtausch wird schneller, sonst enden lange ballwechsel nie
    const speed = Math.min(BASE + s.rally * 80, MAX_SPEED)
    s.rally += 1
    s.vx = dir * speed * Math.cos(a)
    s.vy = speed * Math.sin(a)
    s.aim = aimError()
}

function advance(s: State, dt: number) {
    s.bx += s.vx * dt
    s.by += s.vy * dt

    if (s.by < HALF) {
        s.by = HALF
        s.vy = Math.abs(s.vy)
    }
    if (s.by > H - HALF) {
        s.by = H - HALF
        s.vy = -Math.abs(s.vy)
    }

    if (s.vx < 0 && s.bx - HALF <= PX + PADDLE_W && s.bx + HALF >= PX && Math.abs(s.by - s.py) <= PADDLE_H / 2 + HALF) {
        s.bx = PX + PADDLE_W + HALF
        hit(s, s.py, 1)
    }
    if (s.vx > 0 && s.bx + HALF >= CX && s.bx - HALF <= CX + PADDLE_W && Math.abs(s.by - s.cy) <= PADDLE_H / 2 + HALF) {
        s.bx = CX - HALF
        hit(s, s.cy, -1)
    }
}

export default function Pong({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        const axis = controls.axis()
        const step = PLAYER_SPEED * dt
        if (axis !== 0) {
            const d = ((axis + 1) / 2) * H - s.py
            s.py += Math.max(-step, Math.min(step, d))
        } else {
            s.py += ((controls.held('down') ? 1 : 0) - (controls.held('up') ? 1 : 0)) * step
        }
        s.py = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, s.py))

        // der rechner zielt nur grob und kommt bei steilen baellen nicht hinterher
        const chase = s.vx > 0 && s.bx > W * 0.35
        const target = chase ? s.by + s.aim : H / 2
        const reach = CPU_SPEED * (chase ? 1 : 0.5) * dt
        s.cy += Math.max(-reach, Math.min(reach, target - s.cy))
        s.cy = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, s.cy))

        if (s.wait > 0) {
            s.wait -= dt
        } else {
            const steps = Math.max(1, Math.ceil((Math.hypot(s.vx, s.vy) * dt) / 4))
            for (let i = 0; i < steps; i++) advance(s, dt / steps)

            if (s.bx < -HALF) {
                s.cpu += 1
                serve(s, -1)
            } else if (s.bx > W + HALF) {
                s.player += 1
                onScore(s.player)
                serve(s, 1)
            }

            if (s.player >= WIN || s.cpu >= WIN) {
                s.over = true
                onGameOver(s.player)
                return
            }
        }

        ctx.fillStyle = '#0d1014'
        ctx.fillRect(0, 0, W, H)

        ctx.fillStyle = '#232a33'
        for (let y = 10; y < H - 10; y += 22) ctx.fillRect(W / 2 - 1, y, 2, 12)

        ctx.fillStyle = '#4ade80'
        ctx.fillRect(PX, s.py - PADDLE_H / 2, PADDLE_W, PADDLE_H)
        ctx.fillStyle = '#f472b6'
        ctx.fillRect(CX, s.cy - PADDLE_H / 2, PADDLE_W, PADDLE_H)

        ctx.fillStyle = '#e6ebf2'
        ctx.fillRect(s.bx - HALF, s.by - HALF, HALF * 2, HALF * 2)

        ctx.font = '600 16px system-ui, sans-serif'
        ctx.fillStyle = '#8b97a6'
        ctx.textAlign = 'right'
        ctx.fillText(String(s.player), W / 2 - 16, 30)
        ctx.textAlign = 'left'
        ctx.fillText(String(s.cpu), W / 2 + 16, 30)
    }, !paused)

    return <canvas ref={canvas} />
}
