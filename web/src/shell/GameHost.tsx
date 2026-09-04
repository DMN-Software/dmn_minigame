import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gameMeta, type GameId } from '../../../shared/games.ts'
import type { Log } from '../../../shared/engine.ts'
import { Hud } from './Hud.tsx'
import { Leaderboard } from './Leaderboard.tsx'
import { Overlay } from './Overlay.tsx'
import { Pad } from './Pad.tsx'
import { api } from './api.ts'
import { LOADERS } from './registry.ts'
import { useControls } from './useControls.ts'
import type { Params } from './params.ts'

type Phase = 'start' | 'wait' | 'running' | 'paused' | 'over'

function bestKey(id: GameId) {
    return 'dmn.best.' + id
}

function readBest(id: GameId): number {
    const raw = Number(localStorage.getItem(bestKey(id)))
    return Number.isFinite(raw) ? raw : 0
}

export function GameHost({ id, params, onBack }: { id: GameId; params: Params; onBack: () => void }) {
    const meta = gameMeta(id)
    const Game = useMemo(() => lazy(LOADERS[id]), [id])

    const [phase, setPhase] = useState<Phase>('start')
    const [run, setRun] = useState(0)
    const [seed, setSeed] = useState(0)
    const [score, setScore] = useState(0)
    const [best, setBest] = useState(() => readBest(id))
    const [pending, setPending] = useState<{ token: string; log: Log } | null>(null)
    const [narrow, setNarrow] = useState(false)
    const [tight, setTight] = useState(false)

    const stage = useRef<HTMLDivElement | null>(null)
    const root = useRef<HTMLDivElement | null>(null)
    const token = useRef<string | null>(null)

    const controls = useControls(stage, phase === 'running')

    const showPad = params.pad ?? matchMedia('(pointer: coarse)').matches

    const start = useCallback(async () => {
        setScore(0)
        setPending(null)
        setPhase('wait')

        // der server gibt den startwert aus und merkt sich ihn zur sitzung. ohne ihn
        // laesst sich der lauf nicht nachspielen, dann gibt es eben keinen eintrag.
        try {
            const s = await api.session(id)
            token.current = s.token
            setSeed(s.seed)
        } catch {
            token.current = null
            setSeed((Math.random() * 0xffffffff) >>> 0)
        }

        setRun((n) => n + 1)
        setPhase('running')
    }, [id])

    const onScore = useCallback((value: number) => setScore((prev) => (prev === value ? prev : value)), [])

    const onGameOver = useCallback(
        (final: number, log: Log) => {
            setScore(final)
            setPhase('over')
            if (final > readBest(id)) {
                localStorage.setItem(bestKey(id), String(final))
                setBest(final)
            }
            if (token.current && final > 0) setPending({ token: token.current, log })
        },
        [id],
    )

    useEffect(() => {
        if (params.autostart) void start()
    }, [params.autostart, start])

    useEffect(() => {
        const el = root.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            setNarrow(entry.contentRect.width < 760)
            setTight(entry.contentRect.height < 360 || entry.contentRect.width < 480)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const pause = () => setPhase((p) => (p === 'running' ? 'paused' : p))
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Escape' || e.code === 'KeyP') pause()
        }
        const onHidden = () => {
            if (document.hidden) pause()
        }

        window.addEventListener('blur', pause)
        window.addEventListener('keydown', onKey)
        document.addEventListener('visibilitychange', onHidden)
        return () => {
            window.removeEventListener('blur', pause)
            window.removeEventListener('keydown', onKey)
            document.removeEventListener('visibilitychange', onHidden)
        }
    }, [])

    const playing = phase === 'running' || phase === 'paused' || phase === 'over'

    return (
        <div ref={root} className={narrow ? 'app app--narrow' : 'app'}>
            <Hud
                meta={meta}
                score={score}
                best={best}
                paused={phase === 'paused'}
                tight={tight}
                kiosk={params.kiosk}
                onBack={onBack}
                onPause={() => setPhase((p) => (p === 'running' ? 'paused' : p === 'paused' ? 'running' : p))}
            />

            <div className="body">
                <div className="stage" ref={stage}>
                    <div className="stage__inner">
                        {playing && (
                            <Suspense fallback={<p className="board__empty">Lädt …</p>}>
                                <Game
                                    key={run}
                                    seed={seed}
                                    paused={phase !== 'running'}
                                    controls={controls}
                                    onScore={onScore}
                                    onGameOver={onGameOver}
                                />
                            </Suspense>
                        )}
                    </div>

                    {phase === 'running' && showPad && <Pad scheme={meta.scheme} onPress={controls.tap} />}

                    {phase === 'start' && (
                        <Overlay title={meta.title} text={meta.hint} action="Starten" onAction={() => void start()} />
                    )}

                    {phase === 'wait' && <p className="board__empty">Startet …</p>}

                    {phase === 'paused' && (
                        <Overlay
                            title="Pause"
                            text="Klicken, um weiterzuspielen"
                            action="Weiter"
                            onAction={() => setPhase('running')}
                        />
                    )}

                    {phase === 'over' && (
                        <Overlay title="Vorbei" text={score + ' Punkte'} action="Nochmal" onAction={() => void start()}>
                            {!params.kiosk && (
                                <button className="btn btn--ghost" style={{ marginTop: 8 }} onClick={onBack}>
                                    Anderes Spiel
                                </button>
                            )}
                        </Overlay>
                    )}
                </div>

                {params.board && !tight && (
                    <div className="side">
                        <Leaderboard game={id} pending={pending} presetName={params.name} onSubmitted={() => setPending(null)} />
                    </div>
                )}
            </div>
        </div>
    )
}
