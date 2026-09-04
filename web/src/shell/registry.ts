import type { ComponentType } from 'react'
import type { GameId } from '../../../shared/games.ts'
import type { GameProps } from './types.ts'

type Loader = () => Promise<{ default: ComponentType<GameProps> }>

export const LOADERS: Record<GameId, Loader> = {
    snake: () => import('../games/snake/Snake.tsx'),
    flappy: () => import('../games/flappy/Flappy.tsx'),
    tictactoe: () => import('../games/tictactoe/TicTacToe.tsx'),
    tower: () => import('../games/tower/Tower.tsx'),
    g2048: () => import('../games/g2048/G2048.tsx'),
    breakout: () => import('../games/breakout/Breakout.tsx'),
    minesweeper: () => import('../games/minesweeper/Minesweeper.tsx'),
    memory: () => import('../games/memory/Memory.tsx'),
    tetris: () => import('../games/tetris/Tetris.tsx'),
    pong: () => import('../games/pong/Pong.tsx'),
    simon: () => import('../games/simon/Simon.tsx'),
    doodle: () => import('../games/doodle/Doodle.tsx'),
}

export function prefetch(id: GameId) {
    void LOADERS[id]().catch(() => {})
}
