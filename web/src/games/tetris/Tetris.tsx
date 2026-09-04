import { useEffect, useRef } from 'react'
import { useCanvas } from '../../shell/useCanvas.ts'
import { useGameLoop } from '../../shell/useGameLoop.ts'
import type { GameProps } from '../../shell/types.ts'
import { PIECES, width } from './pieces.ts'

const COLS = 10
const ROWS = 20
const CELL = 30
const W = COLS * CELL
const H = ROWS * CELL
const LINE_SCORE = [0, 100, 300, 500, 800]

type Active = { piece: number; rot: number; x: number; y: number }

type State = {
    grid: (string | null)[]
    active: Active
    next: number
    bag: number[]
    lines: number
    level: number
    score: number
    fall: number
    over: boolean
}

function pull(bag: number[]): number {
    if (bag.length === 0) {
        for (let i = 0; i < PIECES.length; i++) bag.push(i)
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const t = bag[i]
            bag[i] = bag[j]
            bag[j] = t
        }
    }
    return bag.pop() as number
}

function collides(grid: (string | null)[], a: Active): boolean {
    for (const c of PIECES[a.piece].rotations[a.rot]) {
        const x = a.x + c.x
        const y = a.y + c.y
        if (x < 0 || x >= COLS || y >= ROWS) return true
        if (y >= 0 && grid[y * COLS + x]) return true
    }
    return false
}

function move(s: State, dx: number, dy: number): boolean {
    const a: Active = { piece: s.active.piece, rot: s.active.rot, x: s.active.x + dx, y: s.active.y + dy }
    if (collides(s.grid, a)) return false
    s.active = a
    return true
}

function spin(s: State) {
    // ohne wandkick: passt die drehung nicht, bleibt das stueck einfach stehen
    const a: Active = { ...s.active, rot: (s.active.rot + 1) % 4 }
    if (!collides(s.grid, a)) s.active = a
}

function spawn(s: State) {
    const piece = s.next
    s.next = pull(s.bag)
    s.active = { piece, rot: 0, x: Math.floor((COLS - width(piece)) / 2), y: 0 }
    if (collides(s.grid, s.active)) s.over = true
}

function sweep(grid: (string | null)[]): number {
    let cleared = 0
    for (let y = ROWS - 1; y >= 0; y--) {
        let full = true
        for (let x = 0; x < COLS; x++) {
            if (!grid[y * COLS + x]) {
                full = false
                break
            }
        }
        if (!full) continue

        grid.splice(y * COLS, COLS)
        grid.unshift(...new Array(COLS).fill(null))
        cleared += 1
        y += 1
    }
    return cleared
}

function lock(s: State): number {
    const p = PIECES[s.active.piece]
    for (const c of p.rotations[s.active.rot]) {
        const y = s.active.y + c.y
        if (y >= 0) s.grid[y * COLS + s.active.x + c.x] = p.color
    }

    const cleared = sweep(s.grid)
    if (cleared > 0) {
        s.score += LINE_SCORE[cleared] * s.level
        s.lines += cleared
        s.level = Math.floor(s.lines / 10) + 1
    }
    spawn(s)
    return cleared
}

function init(): State {
    const bag: number[] = []
    const s: State = {
        grid: new Array(COLS * ROWS).fill(null),
        active: { piece: 0, rot: 0, x: 0, y: 0 },
        next: pull(bag),
        bag,
        lines: 0,
        level: 1,
        score: 0,
        fall: 0,
        over: false,
    }
    spawn(s)
    return s
}

function block(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2)
}

function preview(ctx: CanvasRenderingContext2D, piece: number) {
    const x = W - 104
    const y = 8
    ctx.fillStyle = '#161b22'
    ctx.fillRect(x, y, 96, 72)
    ctx.strokeStyle = '#232a33'
    ctx.strokeRect(x + 0.5, y + 0.5, 95, 71)

    const cells = PIECES[piece].rotations[0]
    let minX = COLS
    let maxX = 0
    let minY = ROWS
    let maxY = 0
    for (const c of cells) {
        minX = Math.min(minX, c.x)
        maxX = Math.max(maxX, c.x)
        minY = Math.min(minY, c.y)
        maxY = Math.max(maxY, c.y)
    }

    const ox = x + (96 - (maxX - minX + 1) * 16) / 2 - minX * 16
    const oy = y + (72 - (maxY - minY + 1) * 16) / 2 - minY * 16
    for (const c of cells) block(ctx, ox + c.x * 16, oy + c.y * 16, 16, PIECES[piece].color)
}

export default function Tetris({ paused, controls, onScore, onGameOver }: GameProps) {
    const canvas = useCanvas(W, H)
    const state = useRef<State>(init())

    useEffect(() => {
        return controls.on((a) => {
            const s = state.current
            if (s.over) return

            if (a === 'left') move(s, -1, 0)
            if (a === 'right') move(s, 1, 0)
            if (a === 'up') spin(s)
            if (a === 'down' && move(s, 0, 1)) s.fall = 0
            if (a === 'alt') {
                while (move(s, 0, 1)) {}
                // verriegelt wird erst im naechsten tick, damit alles an einer stelle passiert
                s.fall = 99
            }
        })
    }, [controls])

    useGameLoop((dt) => {
        const s = state.current
        const ctx = canvas.current?.getContext('2d')
        if (!ctx || s.over) return

        const interval = Math.max(0.08, 0.9 - (s.level - 1) * 0.08)
        s.fall += dt
        if (s.fall >= (controls.held('down') ? Math.min(interval, 0.05) : interval)) {
            s.fall = 0
            if (!move(s, 0, 1)) {
                if (lock(s) > 0) onScore(s.score)
                if (s.over) {
                    onGameOver(s.score)
                    return
                }
            }
        }

        ctx.fillStyle = '#0d1014'
        ctx.fillRect(0, 0, W, H)

        ctx.strokeStyle = '#232a33'
        ctx.beginPath()
        for (let x = 1; x < COLS; x++) {
            ctx.moveTo(x * CELL + 0.5, 0)
            ctx.lineTo(x * CELL + 0.5, H)
        }
        for (let y = 1; y < ROWS; y++) {
            ctx.moveTo(0, y * CELL + 0.5)
            ctx.lineTo(W, y * CELL + 0.5)
        }
        ctx.stroke()

        for (let i = 0; i < s.grid.length; i++) {
            const color = s.grid[i]
            if (color) block(ctx, (i % COLS) * CELL, ((i / COLS) | 0) * CELL, CELL, color)
        }

        const p = PIECES[s.active.piece]
        const ghost: Active = { ...s.active }
        while (!collides(s.grid, { ...ghost, y: ghost.y + 1 })) ghost.y += 1

        ctx.save()
        ctx.globalAlpha = 0.22
        for (const c of p.rotations[ghost.rot]) block(ctx, (ghost.x + c.x) * CELL, (ghost.y + c.y) * CELL, CELL, p.color)
        ctx.restore()

        for (const c of p.rotations[s.active.rot]) {
            const y = s.active.y + c.y
            if (y >= 0) block(ctx, (s.active.x + c.x) * CELL, y * CELL, CELL, p.color)
        }

        preview(ctx, s.next)

        ctx.font = '600 16px system-ui, sans-serif'
        ctx.fillStyle = '#8b97a6'
        ctx.textAlign = 'left'
        ctx.fillText('Level ' + s.level + ' · ' + s.lines + ' Reihen', 10, 28)
    }, !paused)

    return <canvas ref={canvas} />
}
