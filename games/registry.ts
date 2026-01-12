
import { GameFactory, GameMetadata } from "./types";
import { createFlappyBird } from "./flappy-bird/game";
import { createSpaceInvaders } from "./space-invaders/game";

export const GAMES: Record<string, { meta: GameMetadata, factory: GameFactory }> = {
    'flappy-bird': {
        meta: {
            id: 'flappy-bird',
            name: 'FLAPPY PIXEL',
            description: 'DODGE THE PIPES!',
            version: '1.0.0',
            author: 'PERNGANUAN CORP'
        },
        factory: createFlappyBird
    },
    'space-invaders': {
        meta: {
            id: 'space-invaders',
            name: 'CLAUDE INVADERS',
            description: 'DEBUG THE BUGS!',
            version: '1.0.0',
            author: 'PERNGANUAN CORP'
        },
        factory: createSpaceInvaders
    }
};

export function getGame(id: string) {
    return GAMES[id] || null;
}
