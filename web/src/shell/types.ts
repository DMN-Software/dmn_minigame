import type { Log } from '../../../shared/engine.ts'

export type Action = 'up' | 'down' | 'left' | 'right' | 'fire' | 'alt'

export type Controls = {
    mask(): number
    pointer(): { x: number; y: number } | null
    choose(value: number): void
    takePick(): number
}

export type GameProps = {
    seed: number
    paused: boolean
    controls: Controls
    onScore: (score: number) => void
    onGameOver: (score: number, log: Log) => void
}
