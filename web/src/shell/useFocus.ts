import { useEffect } from 'react'

export function useFocus() {
    useEffect(() => {
        const grab = () => {
            window.focus()
            if (document.activeElement === document.body) return
            const tag = document.activeElement?.tagName
            if (tag === 'INPUT' || tag === 'TEXTAREA') return
            document.body.focus({ preventScroll: true })
        }

        grab()
        document.addEventListener('pointerdown', grab, true)
        return () => document.removeEventListener('pointerdown', grab, true)
    }, [])
}
