import { useEffect, useRef, useState } from 'react'

// quadratische spielflaeche im verfuegbaren platz. aspect-ratio bricht in chromium,
// sobald die hoehe der engpass ist, deshalb wird gemessen.
export function useSquare(max: number, min = 140) {
    const box = useRef<HTMLDivElement | null>(null)
    const [size, setSize] = useState(max)

    useEffect(() => {
        const el = box.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const r = entry.contentRect
            setSize(Math.max(min, Math.min(max, Math.floor(r.width), Math.floor(r.height))))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [max, min])

    return [box, size] as const
}
