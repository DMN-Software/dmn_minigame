import type { Log } from '../../../shared/engine.ts'

export type Action = 'up' | 'down' | 'left' | 'right' | 'fire' | 'alt'

export type Controls = {
    /** bitmaske der gehaltenen aktionen, einmalige tipper sind bis zum naechsten tick gehalten */
    mask(): number
    /** zeigerposition, 0 bis 1 relativ zur spielflaeche. null, wenn kein zeiger da war. */
    pointer(): { x: number; y: number } | null
    /** klickspiele melden hier das gewaehlte feld an, der treiber holt es im naechsten tick ab */
    choose(value: number): void
    takePick(): number
}

export type GameProps = {
    /** vom server ausgegeben und an die sitzung gebunden, damit der lauf nachspielbar bleibt */
    seed: number
    paused: boolean
    controls: Controls
    onScore: (score: number) => void
    onGameOver: (score: number, log: Log) => void
}
