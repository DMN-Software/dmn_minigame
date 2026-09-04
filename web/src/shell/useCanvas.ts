import { useEffect, useRef } from 'react'

// feste logische aufloesung: gezeichnet wird in einheiten von 0..width und 0..height,
// skaliert wird hier. ein spiel darf die transformation nicht selbst zuruecksetzen.
export function useCanvas(width: number, height: number) {
    const ref = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = ref.current
        const box = canvas?.parentElement
        if (!canvas || !box) return

        const fit = () => {
            const rect = box.getBoundingClientRect()
            if (rect.width < 1 || rect.height < 1) return

            // groesstmoegliche flaeche im eltern-element, seitenverhaeltnis bleibt erhalten
            const scale = Math.min(rect.width / width, rect.height / height)
            const w = Math.floor(width * scale)
            const h = Math.floor(height * scale)
            canvas.style.width = w + 'px'
            canvas.style.height = h + 'px'

            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)

            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.setTransform(canvas.width / width, 0, 0, canvas.width / width, 0, 0)
        }

        fit()
        const ro = new ResizeObserver(fit)
        ro.observe(box)
        return () => ro.disconnect()
    }, [width, height])

    return ref
}
