import { BIT, randInt, type Input, type Rng, type Sim } from '../engine.ts'

export const CELLS = 20

export type Point = { x: number; y: number }

export type SnakeSim = Sim & {
    body: Point[]
    food: Point
}

export function createSnake(rng: Rng): SnakeSim {
    const body: Point[] = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
    ]

    let dir = { x: 1, y: 0 }
    let next = { x: 1, y: 0 }
    let wait = 0
    let every = 10

    function spawn(): Point {
        let p: Point
        do {
            p = { x: randInt(rng, CELLS), y: randInt(rng, CELLS) }
        } while (body.some((s) => s.x === p.x && s.y === p.y))
        return p
    }

    const sim: SnakeSim = {
        body,
        food: spawn(),
        score: 0,
        over: false,

        step(input: Input) {
            if (sim.over) return

            if (input.pressed & BIT.up && dir.y === 0) next = { x: 0, y: -1 }
            if (input.pressed & BIT.down && dir.y === 0) next = { x: 0, y: 1 }
            if (input.pressed & BIT.left && dir.x === 0) next = { x: -1, y: 0 }
            if (input.pressed & BIT.right && dir.x === 0) next = { x: 1, y: 0 }

            wait += 1
            if (wait < every) return
            wait = 0
            dir = next

            const head = { x: body[0].x + dir.x, y: body[0].y + dir.y }
            if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS) {
                sim.over = true
                return
            }
            if (body.some((p) => p.x === head.x && p.y === head.y)) {
                sim.over = true
                return
            }

            body.unshift(head)
            if (head.x === sim.food.x && head.y === sim.food.y) {
                sim.score += 1
                sim.food = spawn()
                // alle vier futter ein tick schneller, unter vier ticks je feld waere es unfair
                if (sim.score % 4 === 0 && every > 4) every -= 1
            } else {
                body.pop()
            }
        },
    }

    return sim
}
