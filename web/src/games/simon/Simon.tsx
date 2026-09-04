import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '../../shell/types.ts'
import './simon.css'

type Phase = 'show' | 'input' | 'grow' | 'over'

const PADS = [0, 1, 2, 3]

function rnd() {
    return Math.floor(Math.random() * PADS.length)
}

export default function Simon({ paused, onScore, onGameOver }: GameProps) {
    const [seq, setSeq] = useState<number[]>(() => [rnd()])
    const [phase, setPhase] = useState<Phase>('show')
    const [pos, setPos] = useState(0)
    const [lit, setLit] = useState(-1)
    const timers = useRef<number[]>([])
    const flash = useRef(0)

    function stop() {
        for (const id of timers.current) clearTimeout(id)
        timers.current = []
        clearTimeout(flash.current)
    }

    useEffect(() => stop, [])

    useEffect(() => {
        if (!paused) return
        stop()
        setLit(-1)
    }, [paused])

    useEffect(() => {
        if (paused || phase !== 'show') return

        // unter 250 ms je glied kann sich das keiner mehr merken
        const gap = Math.max(250, 640 - seq.length * 25)
        const wait = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

        seq.forEach((pad, i) => {
            wait(() => setLit(pad), 420 + i * gap)
            wait(() => setLit(-1), 420 + i * gap + gap * 0.55)
        })
        wait(() => {
            setPos(0)
            setPhase('input')
        }, 420 + seq.length * gap)

        return stop
    }, [paused, phase, seq])

    useEffect(() => {
        if (paused || phase !== 'grow') return
        const t = window.setTimeout(() => {
            setSeq((s) => [...s, rnd()])
            setPhase('show')
        }, 620)
        timers.current.push(t)
        return () => clearTimeout(t)
    }, [paused, phase])

    function press(pad: number) {
        if (paused || phase !== 'input') return

        clearTimeout(flash.current)
        setLit(pad)
        flash.current = window.setTimeout(() => setLit(-1), 180)

        if (seq[pos] !== pad) {
            setPhase('over')
            onGameOver(seq.length - 1)
            return
        }
        if (pos + 1 === seq.length) {
            onScore(seq.length)
            setPhase('grow')
        } else {
            setPos(pos + 1)
        }
    }

    return (
        <div className="simon__board">
            {PADS.map((pad) => (
                <button
                    key={pad}
                    type="button"
                    className={'simon__pad simon__pad--' + pad + (lit === pad ? ' simon__pad--lit' : '')}
                    onClick={() => press(pad)}
                />
            ))}
        </div>
    )
}
