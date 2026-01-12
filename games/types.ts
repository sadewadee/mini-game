
// This interface defines how the React UI interacts with any Game Logic
export interface GameContext {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    setScore: (score: (prev: number) => number) => void;
    onGameOver: (finalScore: number) => void;
}

export interface GameInstance {
    // Called once when the game mounts
    init: () => void;
    // Called every frame. Return false to stop the loop.
    update: (deltaTime: number) => void;
    // Cleanup/Unmount
    destroy: () => void;
    // Handle inputs
    onInput: (code: string) => void;
    // Optional: Continuous input handling
    handleInputState?: (keys: Set<string>) => void;
}

export type GameFactory = (context: GameContext) => GameInstance;

export interface GameMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
}
