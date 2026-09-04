import type { Scheme } from '../../../shared/games.ts'
import type { Action } from './types.ts'

type Props = {
    scheme: Scheme
    onPress: (action: Action) => void
}

function Key({ action, label, cls, onPress }: { action: Action; label: string; cls?: string; onPress: (a: Action) => void }) {
    return (
        <button
            className={cls ? `pad__key ${cls}` : 'pad__key'}
            onPointerDown={(e) => {
                e.preventDefault()
                onPress(action)
            }}
        >
            {label}
        </button>
    )
}

// nur fuer dpad und tap. schlaeger folgen dem zeiger, klickgesteuerte spiele brauchen
// ohnehin nichts.
export function Pad({ scheme, onPress }: Props) {
    if (scheme === 'dpad') {
        return (
            <div className="pad" data-noinput>
                <div className="pad__dpad">
                    <span />
                    <Key action="up" label="▲" onPress={onPress} />
                    <span />
                    <Key action="left" label="◀" onPress={onPress} />
                    <span />
                    <Key action="right" label="▶" onPress={onPress} />
                    <span />
                    <Key action="down" label="▼" onPress={onPress} />
                    <span />
                </div>
            </div>
        )
    }

    if (scheme === 'tap') {
        return (
            <div className="pad" style={{ justifyContent: 'center' }} data-noinput>
                <Key action="fire" label="●" cls="pad__fire" onPress={onPress} />
            </div>
        )
    }

    return null
}
