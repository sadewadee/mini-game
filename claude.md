
# 🤖 Claude's Arcade Memory
*Specific context for the "Pernganuan Duniawi" project.*

## Project Context
We are building a **Retro Arcade Platform** accessible via web (Next.js) and generic enough to be deployed anywhere (Docker).
*   **Repo**: https://github.com/sadewadee/project-pernganuan-duniawi (Assumed)
*   **Stack**: Next.js 15, Tailwind, Canvas API, Supabase, Tone.js.

## Current Games Roster
| ID | Name | Status | Key Features |
| :--- | :--- | :--- | :--- |
| `flappy-bird` | Flappy Pixel | 🟢 Live | Procedural assets, Jump physics, Clouds. |
| `space-invaders` | Claude Invaders | 🟢 Live | Boss fights, Powerups, Minions, Particle System. |

## Development Rules (The Playbook)
Refer to `AGENTS.md` for the technical "Game Builder's Playbook".

### Quick Tasks Reference
*   **New Game?** -> check `games/registry.ts`.
*   **New SFX?** -> check `lib/sfx.ts`.
*   **Database Schema?** -> Table: `scores (username, game_id, score)`.

### Common Gotchas
1.  **Canvas Scaling**: We use a fixed logical resolution (e.g. 400x600) scaled up by CSS. Ensure `canvas.width` is set in `init()`.
2.  **Sound Context**: Audio only starts after first user interaction. `GameRunnerPage` handles this via `initAudio()`.
3.  **Supabase**: Credentials must be in `.env.local` (local) or Dokploy Env Vars (prod). NEVER commit them.
4.  **Loop Safety**: Always check `if (!gameInstance.current)` in React effects before updating.

## Deployment
*   **Docker**: Uses `standalone` output.
*   **Command**: `git push origin main`.
