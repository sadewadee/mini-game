
import { GameFactory } from "../types";
import { playSfx } from "@/lib/sfx";

export const createSpaceInvaders: GameFactory = ({ canvas, ctx, width, height, setScore, onGameOver }) => {
    const COLORS = {
        bg: '#1a1c2c',
        player: '#D9795C',
        playerShield: '#29adff',
        enemy1: '#cc5c5c',
        enemy2: '#cccc5c',
        boss: '#ff004d',
        bullet: '#ffffff',
        missile: '#ffec27',
        enemyBullet: '#ff004d',
        text: '#F0E8D9',
        powerup: '#00e436',
        hp: '#ff004d',
        particle: ['#ff004d', '#ffec27', '#ffffff']
    };

    // Constants
    const PLAYER_SPEED = 4;
    const BULLET_SPEED = 8;
    const ENEMY_BULLET_SPEED = 4;
    const FIRE_RATE_DEFAULT = 150;

    // Game Entities
    type Bullet = { x: number, y: number, type: 'NORMAL' | 'MISSILE', radius: number };
    type PowerupType = 'RAPID' | 'MULTI' | 'SHIELD' | 'LIFE' | 'MISSILE';

    // State
    let player = { x: width / 2, y: height - 40, w: 30, h: 20, hp: 3, maxHp: 3, shield: 0 };
    let bullets: Bullet[] = [];
    let enemyBullets: Array<{ x: number, y: number, variant?: 'NORMAL' | 'ZIGZAG' | 'FAST' }> = [];
    let enemies: Array<{ x: number, y: number, r: number, c: number, active: boolean, type: number, hp: number, maxHp: number, isBoss: boolean, hasDrop?: boolean }> = [];
    let powerups: Array<{ x: number, y: number, type: PowerupType }> = [];
    let particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, color: string }> = [];
    let floats: Array<{ x: number, y: number, text: string, life: number }> = [];
    let stars: Array<{ x: number, y: number, s: number }> = [];

    // Mechanics
    let enemyDir = 1;
    let currentEnemySpeed = 0.5;
    let isGameOver = false;
    let currentScore = 0;
    let lastFireTime = 0;
    let enemyFireTimer = 0;

    // Buffs
    let rapidFireActive = false;
    let multiShotActive = false; // "Auto Cannon" spread
    let missileActive = false;
    let bossMinionTimer = 0;
    let powerupTimer = 0;

    let level = 1;
    let isLevelTransition = false;

    // --- Helpers ---
    const spawnParticles = (x: number, y: number, count: number = 8, color?: string) => {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color || COLORS.particle[Math.floor(Math.random() * COLORS.particle.length)]
            });
        }
    };

    const spawnFloat = (x: number, y: number, text: string) => {
        floats.push({ x, y, text, life: 1.0 });
    };

    const initLevel = (lvl: number) => {
        enemies = [];
        bullets = [];
        enemyBullets = [];
        powerups = [];
        enemyDir = 1;
        enemyFireTimer = 3000;
        bossMinionTimer = 10000; // 10s initial delay for minions
        isLevelTransition = false;

        const isBossLevel = lvl % 5 === 0;
        const isSuperBoss = lvl % 10 === 0;

        if (isBossLevel) {
            const bossHp = isSuperBoss ? 200 * (lvl / 5) * 1.5 : 100 * (lvl / 5);
            enemies.push({
                x: width / 2 - 40,
                y: 60,
                r: 0, c: 0,
                active: true,
                type: 99,
                hp: bossHp,
                maxHp: bossHp,
                isBoss: true
            });
            currentEnemySpeed = 1.5;
            spawnFloat(width / 2, height / 2, isSuperBoss ? "SUPER BOSS WARNING!" : "BOSS WARNING!");
        } else {
            // New Scaling: Start with 4, add 1 every 2 levels
            const totalEnemies = 4 + Math.floor((lvl - 1) / 2);

            // Layout: Max 8 cols
            const cols = Math.min(8, totalEnemies);
            const rows = Math.ceil(totalEnemies / 8);

            const totalWidth = cols * 40;
            const startX = (width - totalWidth) / 2 + 10;
            const startY = 50;

            let created = 0;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (created >= totalEnemies) break;

                    enemies.push({
                        x: startX + c * 40,
                        y: startY + r * 30,
                        r, c,
                        active: true,
                        type: r % 2,
                        hp: 1,
                        maxHp: 1,
                        isBoss: false
                    });
                    created++;
                }
            }

            currentEnemySpeed = 0.5 + (Math.min(lvl, 10) * 0.05);
        }
    };

    const spawnPowerup = (x: number, y: number, force: boolean = false) => {
        if (force || Math.random() < 0.12) { // 12% Drop Rate (or Forced)
            const rand = Math.random();
            let type: PowerupType = 'RAPID';
            if (rand < 0.25) type = 'RAPID';
            else if (rand < 0.50) type = 'MULTI'; // Cannons
            else if (rand < 0.65) type = 'MISSILE';
            else if (rand < 0.85) type = 'SHIELD';
            else type = 'LIFE';

            powerups.push({ x, y, type });
        }
    };

    const takeDamage = () => {
        if (player.shield > 0) {
            player.shield--;
            playSfx('shield'); // Deflect sound
            spawnFloat(player.x, player.y, "SHIELD HIT!");
            return;
        }

        player.hp--;
        playSfx('explode');
        spawnParticles(player.x, player.y, 30, COLORS.player);
        if (player.hp <= 0) {
            isGameOver = true;
            onGameOver(currentScore);
        } else {
            spawnFloat(player.x, player.y, "-1 HP");
        }
    };

    // --- Sprites ---
    const drawSprite = (x: number, y: number, pattern: number[][], color: string, scale: number = 2) => {
        ctx.fillStyle = color;
        pattern.forEach((row, dy) => {
            row.forEach((pixel, dx) => {
                if (pixel) ctx.fillRect(x + dx * scale, y + dy * scale, scale, scale);
            });
        });
    };

    // Patterns
    const CLAUDE_SHIP = [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [1, 1, 0, 1, 1, 0, 1, 1], [1, 0, 0, 1, 1, 0, 0, 1]];
    const BUG_1 = [[0, 0, 1, 0, 0, 1, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 0, 0, 1, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 1, 0, 0, 1, 0, 1], [0, 0, 1, 0, 0, 1, 0, 0]];
    const BUG_2 = [[0, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 1, 1, 1, 0], [1, 0, 0, 1, 1, 0, 0, 1], [0, 1, 0, 0, 0, 0, 1, 0]];
    // 16x8 Boss Sprite
    const BOSS_BUG = [
        [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
        [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0]
    ];

    return {
        init: () => {
            if (canvas) {
                canvas.width = width;
                canvas.height = height;
            }
            player = { x: width / 2 - 15, y: height - 50, w: 30, h: 20, hp: 3, maxHp: 5, shield: 0 };
            bullets = []; enemyBullets = []; powerups = []; particles = []; floats = []; isGameOver = false; currentScore = 0; level = 1; setScore(() => 0);

            // Stars
            stars = []; for (let i = 0; i < 50; i++) stars.push({ x: Math.random() * width, y: Math.random() * height, s: Math.random() * 2 + 0.5 });

            initLevel(1);
        },

        update: (dt) => {
            if (isGameOver) {
                ctx.fillStyle = COLORS.bg;
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = COLORS.text;
                ctx.font = '20px "Press Start 2P"';
                ctx.fillText("GAME OVER", width / 2 - 80, height / 2);
                ctx.font = '10px "Press Start 2P"';
                ctx.fillText(`SCORE: ${currentScore}`, width / 2 - 50, height / 2 + 30);
                ctx.fillText("PRESS R TO RESTART", width / 2 - 80, height / 2 + 60);
                return;
            }

            // Always animate stars to show game is running
            stars.forEach(s => {
                s.y += s.s;
                if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
            });

            // Draw Background
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#ffffff';
            stars.forEach(s => {
                ctx.globalAlpha = Math.random() * 0.5 + 0.3;
                ctx.fillRect(s.x, s.y, 1, 1);
            });
            ctx.globalAlpha = 1.0;

            // Draw Game Entities (Always draw so we can see them even if paused)
            drawSprite(player.x, player.y, CLAUDE_SHIP, multiShotActive ? COLORS.powerup : COLORS.player, 4);

            if (player.shield > 0) {
                ctx.strokeStyle = COLORS.playerShield;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(player.x + 15, player.y + 10, 25, 0, Math.PI * 2);
                ctx.stroke();
            }

            const wobbleY = Math.sin(Date.now() / 200) * 2;
            enemies.forEach(e => {
                if (!e.active) return;
                if (e.isBoss) {
                    drawSprite(e.x, e.y + wobbleY, BOSS_BUG, COLORS.boss, 5);
                    const hpPercent = e.hp / e.maxHp;
                    ctx.fillStyle = 'red';
                    ctx.fillRect(e.x, e.y - 10, 80 * hpPercent, 5);
                } else {
                    drawSprite(e.x, e.y + wobbleY, e.type === 0 ? BUG_1 : BUG_2, e.type === 0 ? COLORS.enemy1 : COLORS.enemy2, 3);
                }
            });

            bullets.forEach(b => {
                ctx.fillStyle = b.type === 'MISSILE' ? COLORS.missile : (multiShotActive ? COLORS.powerup : COLORS.bullet);
                if (b.type === 'MISSILE') ctx.fillRect(b.x - 2, b.y, 8, 8);
                else ctx.fillRect(b.x, b.y, 4, 10);
            });

            ctx.fillStyle = COLORS.enemyBullet;
            enemyBullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 8));

            particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, 3, 3);
            });
            ctx.globalAlpha = 1.0;

            powerups.forEach(p => {
                ctx.fillStyle = p.type === 'MISSILE' ? COLORS.missile : COLORS.powerup;
                ctx.font = '10px "Press Start 2P"';
                let symbol = 'P';
                if (p.type === 'RAPID') symbol = 'R';
                if (p.type === 'MULTI') symbol = 'M';
                if (p.type === 'MISSILE') symbol = '🚀';
                if (p.type === 'SHIELD') symbol = 'S';
                if (p.type === 'LIFE') symbol = '♥';
                ctx.fillText(symbol, p.x, p.y);
                ctx.strokeStyle = COLORS.powerup;
                ctx.strokeRect(p.x - 2, p.y - 10, 14, 14);
            });

            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = COLORS.text;
            floats.forEach(f => {
                ctx.globalAlpha = f.life;
                ctx.fillText(f.text, f.x, f.y);
            });
            ctx.globalAlpha = 1.0;

            // HUD
            ctx.fillStyle = COLORS.text;
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText(`LVL ${level}`, 10, 20);
            ctx.fillStyle = COLORS.hp;
            for (let i = 0; i < player.hp; i++) ctx.fillText('♥', 10 + (i * 15), 40);
            if (player.shield > 0) {
                ctx.fillStyle = COLORS.playerShield;
                for (let i = 0; i < player.shield; i++) ctx.fillText('🛡', 10 + (player.hp * 15) + (i * 15), 40);
            }

            if (powerupTimer > 0) {
                ctx.fillStyle = COLORS.powerup;
                const typeText = rapidFireActive ? "RAPID" : (multiShotActive ? "CANNON" : "MISSILE");
                ctx.fillText(`${typeText} ${(powerupTimer / 1000).toFixed(1)}`, width - 100, 20);
            }

            // PAUSE LOGIC: If transitioning, stop here (don't update positions/collisions)
            if (isLevelTransition) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = COLORS.powerup;
                ctx.font = '15px "Press Start 2P"';
                ctx.fillText(`LEVEL ${level - 1} CLEARED`, width / 2 - 100, height / 2 - 20);
                ctx.fillStyle = COLORS.text;
                ctx.font = '10px "Press Start 2P"';
                ctx.fillText("NEXT WAVE INCOMING...", width / 2 - 80, height / 2 + 10);
                return;
            }

            // --- GAME LOOP UPDATES (Only runs when NOT paused) ---

            // Visual FX updates
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].x += particles[i].vx;
                particles[i].y += particles[i].vy;
                particles[i].life -= 0.05;
                if (particles[i].life <= 0) particles.splice(i, 1);
            }
            for (let i = floats.length - 1; i >= 0; i--) {
                floats[i].y -= 1;
                floats[i].life -= 0.02;
                if (floats[i].life <= 0) floats.splice(i, 1);
            }

            if (powerupTimer > 0) {
                powerupTimer -= dt;
                if (powerupTimer <= 0) {
                    rapidFireActive = false;
                    multiShotActive = false;
                    missileActive = false;
                }
            }

            // Player Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].y -= BULLET_SPEED;
                if (bullets[i].y < 0) bullets.splice(i, 1);
            }

            // Enemy Bullets
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const eb = enemyBullets[i];
                if (eb.variant === 'ZIGZAG') {
                    eb.y += ENEMY_BULLET_SPEED * 0.8;
                    eb.x += Math.sin(eb.y * 0.05) * 2;
                } else if (eb.variant === 'FAST') {
                    eb.y += ENEMY_BULLET_SPEED * 1.5;
                } else {
                    eb.y += ENEMY_BULLET_SPEED;
                }

                if (
                    eb.x > player.x &&
                    eb.x < player.x + player.w &&
                    eb.y > player.y &&
                    eb.y < player.y + player.h
                ) {
                    takeDamage();
                    enemyBullets.splice(i, 1);
                } else if (eb.y > height) {
                    enemyBullets.splice(i, 1);
                }
            }

            // Powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                powerups[i].y += 2;
                if (
                    powerups[i].x < player.x + player.w &&
                    powerups[i].x + 10 > player.x &&
                    powerups[i].y < player.y + player.h &&
                    powerups[i].y + 10 > player.y
                ) {
                    playSfx('powerup');
                    const p = powerups[i];
                    if (p.type === 'RAPID') { rapidFireActive = true; spawnFloat(player.x, player.y, "RAPID FIRE"); powerupTimer = 5000; }
                    if (p.type === 'MULTI') { multiShotActive = true; spawnFloat(player.x, player.y, "AUTO CANNON"); powerupTimer = 5000; }
                    if (p.type === 'MISSILE') { missileActive = true; spawnFloat(player.x, player.y, "MISSILES"); powerupTimer = 5000; }
                    if (p.type === 'SHIELD') { player.shield = Math.min(player.shield + 1, 3); spawnFloat(player.x, player.y, "SHIELD UP"); }
                    if (p.type === 'LIFE') { player.hp = Math.min(player.hp + 1, player.maxHp); spawnFloat(player.x, player.y, "HP UP"); }

                    powerups.splice(i, 1);
                    continue;
                }
                if (powerups[i].y > height) powerups.splice(i, 1);
            }

            // Enemy Logic
            if (enemyFireTimer > 0) enemyFireTimer -= dt;

            let activeCount = 0;
            let hitEdge = false;
            const activeEnemies: typeof enemies = [];

            enemies.forEach(e => {
                if (!e.active) return;
                activeCount++;
                activeEnemies.push(e);

                if (e.isBoss) {
                    e.x += currentEnemySpeed * enemyDir;
                    if (e.x <= 10 || e.x >= width - 80) hitEdge = true;
                } else {
                    e.x += currentEnemySpeed * enemyDir;
                    if (e.x <= 10 || e.x >= width - 30) hitEdge = true;
                    if (e.y + 20 >= player.y) takeDamage();
                }
            });

            if (hitEdge) {
                enemyDir *= -1;
                enemies.forEach(e => {
                    if (!e.isBoss) e.y += 20;
                });
            }

            // Boss Minion Spawning
            if (activeEnemies.some(e => e.isBoss)) {
                if (bossMinionTimer > 0) bossMinionTimer -= dt;
                else {
                    // Spawn 5 minions
                    const startX = Math.random() * (width - 200) + 20; // Random start X
                    const dropIndex = Math.floor(Math.random() * 5); // Which one has powerup

                    for (let i = 0; i < 5; i++) {
                        enemies.push({
                            x: startX + (i * 30),
                            y: 30, // Top
                            r: -1, c: -1,
                            active: true,
                            type: 0, // Bug 1
                            hp: 1,
                            maxHp: 1,
                            isBoss: false,
                            hasDrop: i === dropIndex // One guaranteed drop
                        } as any);
                    }
                    spawnFloat(startX + 60, 30, "REINFORCEMENTS!");
                    bossMinionTimer = 8000 + Math.random() * 4000; // 8-12s interval
                }
            }

            if (enemyFireTimer <= 0 && activeEnemies.length > 0) {
                const shooter = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];

                if (shooter.isBoss) {
                    playSfx('shoot');
                    const pattern = Math.random();
                    if (pattern < 0.5) {
                        enemyBullets.push({ x: shooter.x + 40, y: shooter.y + 40, variant: 'NORMAL' });
                        enemyBullets.push({ x: shooter.x + 20, y: shooter.y + 40, variant: 'ZIGZAG' });
                        enemyBullets.push({ x: shooter.x + 60, y: shooter.y + 40, variant: 'ZIGZAG' });
                    } else {
                        enemyBullets.push({ x: shooter.x + 10, y: shooter.y + 40, variant: 'FAST' });
                        enemyBullets.push({ x: shooter.x + 70, y: shooter.y + 40, variant: 'FAST' });
                    }
                    enemyFireTimer = Math.max(800, 2000 - (level * 100));
                } else {
                    playSfx('shoot');
                    const variantRoll = Math.random();
                    let variant: 'NORMAL' | 'ZIGZAG' | 'FAST' = 'NORMAL';
                    if (variantRoll < 0.2 + (level * 0.02)) variant = 'ZIGZAG';
                    if (variantRoll > 0.9 - (level * 0.01)) variant = 'FAST';
                    enemyBullets.push({ x: shooter.x + 10, y: shooter.y + 20, variant });
                    enemyFireTimer = 3000 + (Math.random() * 2000);
                    if (level > 10) enemyFireTimer -= Math.min(1000, (level - 10) * 100);
                }
            }

            // Level Clear
            if (activeCount === 0 && !isLevelTransition) {
                isLevelTransition = true;
                level++;
                playSfx('score');
                spawnFloat(width / 2 - 40, height / 2, "LEVEL CLEARED!");
                currentScore += 2000;
                setScore(() => currentScore);

                bullets = [];
                enemyBullets = [];

                setTimeout(() => initLevel(level), 2000); // 2s pause
            }

            // Bullets vs Enemies
            bullets.forEach((b, bIdx) => {
                for (const e of enemies) {
                    if (!e.active) continue;
                    const w = e.isBoss ? 80 : 20;
                    const h = e.isBoss ? 40 : 20;

                    if (b.x > e.x && b.x < e.x + w && b.y > e.y && b.y < e.y + h) {
                        bullets.splice(bIdx, 1);
                        if (b.type === 'MISSILE') {
                            playSfx('missile');
                            spawnParticles(b.x, b.y, 10, COLORS.missile);
                            const radius = 60;
                            enemies.forEach(nearby => {
                                if (!nearby.active) return;
                                const dx = nearby.x - b.x;
                                const dy = nearby.y - b.y;
                                if (Math.sqrt(dx * dx + dy * dy) < radius) {
                                    nearby.hp -= 2;
                                    spawnFloat(nearby.x, nearby.y, "2");
                                    if (nearby.hp <= 0) killEnemy(nearby);
                                    else playSfx('boss_hit');
                                }
                            });
                        } else {
                            e.hp -= 1;
                            if (e.hp <= 0) {
                                killEnemy(e);
                            } else {
                                playSfx('boss_hit');
                                spawnParticles(b.x, b.y, 2, '#fff');
                            }
                        }
                        return;
                    }
                }
            });

            function killEnemy(e: any) {
                e.active = false;
                playSfx('explode');
                spawnParticles(e.x + (e.isBoss ? 40 : 10), e.y + (e.isBoss ? 20 : 10), e.isBoss ? 50 : 8, e.type === 0 ? COLORS.enemy1 : COLORS.enemy2);
                const points = e.isBoss ? 5000 : (100 + (level * 10));
                currentScore += points;
                spawnFloat(e.x, e.y, `+${points}`);
                setScore(() => currentScore);
                if (e.isBoss || e.hasDrop) spawnPowerup(e.x, e.y, true);
                else spawnPowerup(e.x, e.y, false);
            }
        },

        destroy: () => { },

        onInput: (code) => {
            if (isGameOver && code === 'KeyR') {
                player = { x: width / 2 - 15, y: height - 50, w: 30, h: 20, hp: 3, maxHp: 5, shield: 0 };
                isGameOver = false;
                currentScore = 0;
                level = 1;
                setScore(() => 0);
                initLevel(1);
            }
        },

        handleInputState: (keys: Set<string>) => {
            const speed = rapidFireActive ? PLAYER_SPEED * 1.5 : PLAYER_SPEED;
            if (keys.has('ArrowLeft') || keys.has('KeyA')) {
                player.x = Math.max(0, player.x - speed);
            }
            if (keys.has('ArrowRight') || keys.has('KeyD')) {
                player.x = Math.min(width - player.w, player.x + speed);
            }
            if (keys.has('Space')) {
                const now = Date.now();
                const rate = rapidFireActive ? 80 : FIRE_RATE_DEFAULT;
                if (now - lastFireTime > rate) {
                    playSfx('shoot');

                    if (missileActive) {
                        bullets.push({ x: player.x + 12, y: player.y, type: 'MISSILE', radius: 30 });
                    } else if (multiShotActive) {
                        bullets.push({ x: player.x, y: player.y + 5, type: 'NORMAL', radius: 5 });
                        bullets.push({ x: player.x + 12, y: player.y, type: 'NORMAL', radius: 5 });
                        bullets.push({ x: player.x + 24, y: player.y + 5, type: 'NORMAL', radius: 5 });
                    } else {
                        bullets.push({ x: player.x + 12, y: player.y, type: 'NORMAL', radius: 5 });
                    }

                    lastFireTime = now;
                }
            }
        }
    };
};
