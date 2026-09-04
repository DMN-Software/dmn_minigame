import type { ReactNode } from 'react'

type Props = {
    title: string
    text?: string
    action: string
    onAction: () => void
    children?: ReactNode
}

export function Overlay({ title, text, action, onAction, children }: Props) {
    return (
        <div className="overlay" data-noinput>
            <div className="card">
                <h2>{title}</h2>
                {text && <p>{text}</p>}
                <button className="btn" onClick={onAction} autoFocus>
                    {action}
                </button>
                {children}
            </div>
        </div>
    )
}
