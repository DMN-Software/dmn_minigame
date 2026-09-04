import { useEffect, useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'

const W = 360
const H = 540
const GROUND = 64
const PIPE_W = 54
const SPACING = 184
const BIRD_X = 104
const BIRD_R = 11
const GRAVITY = 1250
const FLAP = -352

type Pipe = { x: number; y: number; half: number; passed: boolean }

type State = {
    y: number
    vy: number
    pipes: Pipe[]
    speed: number
    score: number
    started: boolean
    over: boolean
}

function init(): State {
    return { y: H / 2 - 40, vy: 0, pipes: [], speed: 134, score: 0, started: false, over: false }
}

function addPipe(s: State) {
    // die luecke schrumpft mit dem punktestand, bleibt aber ueber vier vogelhoehen
    const half = Math.max(52, 76 - s.score * 1.1)
    const min = half + 46
    const max = H - GROUND - half - 34
    const last = s.pipes[s.pipes.length - 1]
    let y = min + Math.random() * (max - min)
    // mehr als 150 px hoehenunterschied zur vorigen luecke schafft der vogel nicht rechtzeitig
    if (last) y = Math.max(last.y - 150, Math.min(last.y + 150, y))
    s.pipes.push({ x: last ? last.x + SPACING : W + 90, y, half, passed: false })
}

export default function Flappy({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useEffect(() => {
        return controls.on((a) => {
            if (a !== 'fire') return
            const s = state.current
            if (s.over) return
            s.started = true
            s.vy = FLAP
        })
    }, [controls])

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        // vor dem ersten flattern faellt nichts, sonst ist man beim laden schon tot
        if (s.started) {
            s.vy += GRAVITY * dt
            s.y += s.vy * dt

            for (const p of s.pipes) p.x -= s.speed * dt
            while (s.pipes.length && s.pipes[0].x + PIPE_W < -20) s.pipes.shift()

            const last = s.pipes[s.pipes.length - 1]
            if (!last || last.x < W - SPACING) addPipe(s)

            for (const p of s.pipes) {
                if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
                    p.passed = true
                    s.score += 1
                    s.speed = Math.min(210, s.speed + 1.6)
                    onScore(s.score)
                }
            }

            const top = s.y - BIRD_R
            const bottom = s.y + BIRD_R
            let hit = top < 0 || bottom > H - GROUND

            for (const p of s.pipes) {
                if (BIRD_X + BIRD_R < p.x || BIRD_X - BIRD_R > p.x + PIPE_W) continue
                if (top < p.y - p.half || bottom > p.y + p.half) hit = true
            }

            if (hit) {
                s.over = true
                onGameOver(s.score)
                return
            }
        }

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
        ctx.rotate(Math.max(-0.45, Math.min(1.1, s.vy / 620)))
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
    }, !paused)

    return <canvas ref={canvas} />
}
