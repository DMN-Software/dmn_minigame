import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles/tokens.css'
import './styles/shell.css'
import './styles/games.css'

createRoot(document.getElementById('app') as HTMLElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
