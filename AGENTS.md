
# 🕹️ Game Builder's Playbook
> *The official guide to building retro arcade games in the Pernganuan Duniawi engine.*
> *Optimize for: Speed, Nostalgia, and "Juice".*

## 1. Core Philosophy
*   **Mobile & Offline First:** The game must be playable on a shaky 3G connection or in Airplane mode. Code must be lightweight, and assets procedural.
*   **Procedural Over Static:** Do not use `.png` or `.jpg` assets. Draw everything using `ctx.fillRect()` or `ctx.arc()`. It keeps the bundle small and the aesthetic consistent.
*   **Juice is Mandatory:** Every action needs feedback. Screen shake, particles, standard SFX, or floating text.

## 2. Directory Structure
To add a new game, you touch exactly these locations:
1.  `games/[game-id]/game.ts` -> Main logic.
2.  `games/registry.ts` -> Register the game ID and metadata.
3.  `app/page.tsx` -> Add the game card to the menu (optional, for visibility).

## 3. The Template (Start Here)
Copy-paste this boilerplate into `games/[new-game]/game.ts`:

```typescript
import { GameFactory } from "../types";
import { playSfx } from "@/lib/sfx";

export const createMyGame: GameFactory = ({ canvas, ctx, width, height, setScore, onGameOver }) => {
    // 1. Constants & Configuration
    const COLORS = {
        bg: '#1a1c2c',
        primary: '#ffec27',
        danger: '#ff004d',
        text: '#F0E8D9'
    };

    // 2. State
    let isGameOver = false;
    let score = 0;

    // 3. Reset Function
    const reset = () => {
        isGameOver = false;
        score = 0;
        setScore(() => 0);
    };

    return {
        init: () => {
            canvas.width = width;
            canvas.height = height;
            reset();
        },

        update: (dt: number) => {
            // A. Clear Screen
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, width, height);

            if (isGameOver) return;

            // B. Update Logic (Movement, Collision)

            // C. Draw Entities
            ctx.fillStyle = COLORS.primary;
            ctx.fillRect(100, 100, 20, 20);
        },

        // D. Trigger Inputs (Press)
        onInput: (code) => {
            if (code === 'Space' || code === 'Click') {
                if (isGameOver) reset();
                else {
                    playSfx('jump'); // or 'shoot'
                }
            }
        },

        // E. Continuous Inputs (Hold)
        handleInputState: (keys) => {
            if (keys.has('ArrowRight')) { /* Move Right */ }
        },

        destroy: () => {}
    };
};
```

## 4. Standard Systems Cheat Sheet

### 🔊 Audio (SFX) Dictionary
Use `playSfx(type)` for consistent feedback.
*   **Shoot/Attack** -> `'shoot'` (High blip)
*   **Hit/Damage** -> `'explode'` (Noise crash / dull thud)
*   **Powerup/Good** -> `'powerup'` (Ascending major arpeggio)
*   **Jump/Flap** -> `'jump'` (Short hop tone)
*   **Score/Coin** -> `'score'` (High ping, rewarding)
*   **Deflect/Armor** -> `'shield'` (Metallic pong)
*   **Big Explosion** -> `'missile'` (Deep boom)
*   **Boss Hurt** -> `'boss_hit'` (Low rumbling thud)

**Suggested Mappings:**
*   *Game Over / Lose*: Rapid `'explode'` or low pitch sequence.
*   *Win / Level Clear*: Sequence of `'score'` or `'powerup'`.
*   *Fooled / Error*: `'shield'` (dull metallic sound implies nothing happened).

### 🎨 Asset & Sprite Standards
We use **Procedural Pixel Art** (Arrays of 0/1) to ensure "Crisp" rendering at any resolution.

**Standard 8x8 Grid (Example: Player Ship)**
```typescript
const SPRITE_SHIP = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,0,0,1,1,0,0,1]
]; // Render with ctx.fillRect() loop
```

**Common Visual Metaphors:**
*   **Player**: Standard Orange/White/Cyan.
*   **Enemy**: Red/Yellow/Green (scaled by HP).
*   **Powerup**: Flashing Green/Gold.
*   **Particles**: Always use simple squares (`fillRect`).
    *   *Fire/Explosion*: Red -> Orange -> Yellow fade.
    *   *Magic/Score*: White -> Cyan fade.

### 🎨 Standard Palette (Pico-8 Inspired)
Keep colors consistent across games:
```typescript
const PALETTE = {
    black: '#1a1c2c',
    purple: '#5d275d',
    red: '#b13e53',
    orange: '#ef7d57',
    yellow: '#ffcd75',
    green: '#a7f070',
    blue: '#38b764',
    slate: '#257179',
    pink: '#29366f',
    white: '#f4f4f4'
};
```

### 🏆 Leaderboards & Game Over
The system handles Supabase submission automatically.
You ONLY need to call:
```typescript
isGameOver = true;
onGameOver(currentScore); // This triggers the UI and Database submit
```

### 🎮 Input Mapping
The `GameRunner` automatically maps inputs. You just handle the codes:
*   **Action**: `'Space'` or `'Click'` (Mouse/Touch).
*   **Movement**: `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'`.
*   **Restart**: `'KeyR'` (Handled globally by wrapper, but you can listen if needed).

### 📱 Mobile & Offline First Standards
To ensure playable on Phones, Tablets, and without Internet:

1.  **Universal Input Mapping**:
    *   Map `touchstart` / `mousedown` to the **SAME** action code as `Space` or `Enter`.
    *   *Example*: Tapping screen = Jumping (Flappy Bird) or Shooting (Space Invaders).

2.  **Touch Zones (Virtual D-Pad)**:
    *   **Left Half Tap** -> Move Left.
    *   **Right Half Tap** -> Move Right.
    *   **Bottom Center** -> Action/Shoot.

3.  **Logical Resolution**:
    *   Game logic always assumes `width = 400`, `height = 600`. The `GameRunner` handles CSS scaling.

4.  **Offline Capability**:
    *   **No External Assets**: Since we use procedural drawing and Tone.js synth, the game has ZERO network dependency for assets.
    *   **Graceful Leaderboard Failure**: If `onGameOver` is called while offline, the game must NOT crash. The UI handles the API failure silently.
    *   **State Recovery**: (Optional) Use `localStorage` for high scores so players see their personal best even offline.

## 5. Developer Tools & "Standard Library"
Don't reinvent the wheel. Import these standard tools from `@/lib/game-utils`:

```typescript
import {
    checkCollision,   // AABB Rect vs Rect
    randomRange,      // Float min-max
    randomChoice,     // Pick array item
    clamp,            // Keep player on screen
    lerp              // Smooth movement
} from "@/lib/game-utils";
```

### 🍹 Juice Recipes (Copy-Paste Polish)
Use these patterns to make your game feel "Premium":

**1. Screen Shake**
```typescript
// State
let shake = 0;
// Update
if (shake > 0) shake *= 0.9; // Decay
// Draw
ctx.save();
ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
// ... Draw World ...
ctx.restore();
// Trigger
shake = 20; // On Hit
```

**2. Flash Effect (Hit)**
```typescript
// Draw function
if (entity.hitTimer > 0) {
    ctx.fillStyle = '#ffffff'; // Flash White
    entity.hitTimer--;
} else {
    ctx.fillStyle = COLORS.enemy;
}
```

**3. Floating Text**
```typescript
// Standard Float Entity
floats.push({ x, y, text: "+100", life: 1.0 });
// Loop
floats.forEach(f => {
    f.y -= 1; // Float Up
    f.life -= 0.05; // Fade
    ctx.globalAlpha = f.life;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1.0;
});
```

## 6. Open Source & Contributions
Planning to submit a game? Follow these **Golden Rules**:

1.  **Isolation**: Your game resides **ONLY** in `games/[your-game-id]/`. Do not modify other files (except `registry.ts`).
2.  **Zero Dependencies**: Do NOT `npm install` anything. Use what's available (Standard Lib, Tone.js).
3.  **Strict Typing**: No `any`. Define your interfaces.
4.  **Performance**:
    *   Max Object Count: ~500 particles/entities active at once.
    *   No memory leaks (Clear arrays in `reset()` and `destroy()`).
5.  **Submission Format**:
    *   Create PR with title: `feat(game): add [game-name]`
    *   Include a screenshot or GIF in the PR description.
    *   Verify mobile controls work (Touch = Action).

## 7. Deployment Checklist
1.  **Register**: Add to `GAMES` object in `registry.ts`.
2.  **Test**: `bun run dev`.
3.  **Deploy**: Push to main. Dockerfile handles the `standalone` build.
