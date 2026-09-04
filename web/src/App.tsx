import { GAME_IDS, type GameId } from '../../shared/games.ts'
import { GameHost } from './shell/GameHost.tsx'
import { Menu } from './shell/Menu.tsx'
import { readParams } from './shell/params.ts'
import { useFocus } from './shell/useFocus.ts'
import { useState } from 'react'

const params = readParams()

function firstGame(): GameId | null {
    if (params.game) return params.game
    if (params.kiosk) return GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)]
    return null
}

export function App() {
    const [game, setGame] = useState<GameId | null>(firstGame)
    useFocus()

    if (!game) return <Menu onPick={setGame} />

    return <GameHost id={game} params={params} onBack={() => setGame(null)} />
}
