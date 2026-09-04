import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { BIT } from '../../../shared/engine.ts'
import type { Action, Controls } from './types.ts'

const KEYS: Record<string, Action> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    // wasd liegt daneben, weil in cef die pfeiltasten je nach build vom spiel geschluckt werden
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    Space: 'fire',
    Enter: 'fire',
    KeyJ: 'fire',
    KeyK: 'alt',
}

const SWALLOW = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'PageUp', 'PageDown'])

const SWIPE_MIN = 24

type Store = {
    held: number
    // was seit dem letzten tick gedrueckt wurde, aber schon wieder los ist
    latched: number
    pick: number
    pointer: { x: number; y: number } | null
}

export function useControls(stage: RefObject<HTMLElement | null>, active: boolean) {
    const store = useRef<Store>({ held: 0, latched: 0, pick: -1, pointer: null })

    const controls = useMemo<Controls & { tap: (a: Action) => void }>(() => {
        const s = store.current
        return {
            mask() {
                const m = s.held | s.latched
                s.latched = 0
                return m
            },
            pointer: () => s.pointer,
            choose(value) {
                s.pick = value
            },
            takePick() {
                const p = s.pick
                s.pick = -1
                return p
            },
            // bildschirmpad und wischgesten sind nur ein kurzer impuls, der bis zum
            // naechsten tick ueberleben muss
            tap(a) {
                s.latched |= BIT[a]
            },
        }
    }, [])

    useEffect(() => {
        const s = store.current
        if (!active) {
            s.held = 0
            s.latched = 0
            return
        }

        const down = (e: KeyboardEvent) => {
            if (SWALLOW.has(e.code)) e.preventDefault()
            if (e.repeat) return
            const a = KEYS[e.code]
            if (!a) return
            s.held |= BIT[a]
            s.latched |= BIT[a]
        }

        const up = (e: KeyboardEvent) => {
            const a = KEYS[e.code]
            if (a) s.held &= ~BIT[a]
        }

        const blur = () => {
            s.held = 0
        }

        window.addEventListener('keydown', down)
        window.addEventListener('keyup', up)
        window.addEventListener('blur', blur)
        return () => {
            window.removeEventListener('keydown', down)
            window.removeEventListener('keyup', up)
            window.removeEventListener('blur', blur)
            s.held = 0
        }
    }, [active])

    useEffect(() => {
        const el = stage.current
        const s = store.current
        if (!el || !active) return

        const track = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect()
            s.pointer = {
                x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
                y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
            }
        }

        let startX = 0
        let startY = 0

        const down = (e: PointerEvent) => {
            if ((e.target as HTMLElement).closest('[data-noinput]')) return
            track(e)
            startX = e.clientX
            startY = e.clientY
            s.latched |= BIT.fire
        }

        const up = (e: PointerEvent) => {
            if ((e.target as HTMLElement).closest('[data-noinput]')) return
            const dx = e.clientX - startX
            const dy = e.clientY - startY
            if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) return
            if (Math.abs(dx) > Math.abs(dy)) s.latched |= dx > 0 ? BIT.right : BIT.left
            else s.latched |= dy > 0 ? BIT.down : BIT.up
        }

        const stop = (e: Event) => e.preventDefault()

        el.addEventListener('pointerdown', down)
        el.addEventListener('pointermove', track)
        el.addEventListener('pointerup', up)
        el.addEventListener('wheel', stop, { passive: false })
        el.addEventListener('touchmove', stop, { passive: false })
        return () => {
            el.removeEventListener('pointerdown', down)
            el.removeEventListener('pointermove', track)
            el.removeEventListener('pointerup', up)
            el.removeEventListener('wheel', stop)
            el.removeEventListener('touchmove', stop)
            s.pointer = null
        }
    }, [stage, active])

    return controls
}
