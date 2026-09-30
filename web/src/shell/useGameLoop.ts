import { useEffect, useRef } from 'react'

export function useGameLoop(step: (dt: number, now: number) => void, active: boolean) {
    const fn = useRef(step)
    fn.current = step

    useEffect(() => {
        if (!active) return

        let raf = 0
        let last = performance.now()

        const tick = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1)
            last = now
            fn.current(dt, now)
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [active])
}
