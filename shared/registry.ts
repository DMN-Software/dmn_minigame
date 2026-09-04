import type { GameId } from './games.ts'
import type { Rng, Sim } from './engine.ts'
import { createSnake } from './games/snake.ts'
import { createFlappy } from './games/flappy.ts'
import { createTicTacToe } from './games/tictactoe.ts'
import { createTower } from './games/tower.ts'
import { create2048 } from './games/g2048.ts'
import { createBreakout } from './games/breakout.ts'
import { createMinesweeper } from './games/minesweeper.ts'
import { createMemory } from './games/memory.ts'
import { createTetris } from './games/tetris.ts'
import { createPong } from './games/pong.ts'
import { createSimon } from './games/simon.ts'
import { createDoodle } from './games/doodle.ts'

export const SIMS: Record<GameId, (rng: Rng) => Sim> = {
    snake: createSnake,
    flappy: createFlappy,
    tictactoe: createTicTacToe,
    tower: createTower,
    g2048: create2048,
    breakout: createBreakout,
    minesweeper: createMinesweeper,
    memory: createMemory,
    tetris: createTetris,
    pong: createPong,
    simon: createSimon,
    doodle: createDoodle,
}
