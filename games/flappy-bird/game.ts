
import { GameFactory } from "../types";
import { playSfx } from "@/lib/sfx";

export const createFlappyBird: GameFactory = ({ canvas, ctx, width, height, setScore, onGameOver }) => {
    // Game Constants
    const GRAVITY = 0.5;
    const JUMP = -7;
    const PIPE_SPEED = 3;
    const PIPE_SPAWN_RATE = 110;
    const GAP_SIZE = 140;

    // Colors
    const COLORS = {
        bg: '#70c5ce',
        bird: '#ffec27',
        birdBorder: '#fa6a0a',
        pipe: '#00e436',
        pipeBorder: '#1a1c2c',
        text: '#F0E8D9',
        ground: '#dud89b',
        particle: ['#ffffff', '#ffec27', '#fa6a0a']
    };

    // Sprites (Virtual)
    // We will draw the bird using procedural drawing or simple rects for now,
    // but with more detail than a single box.

    // State
    let bird = { x: 50, y: height / 2, velocity: 0, rotation: 0, w: 30, h: 24 };
    let pipes: Array<{ x: number, topHeight: number, passed: boolean }> = [];
    let particles: Array<{ x: number, y: number, vx: number, vy: number, life: number, color: string }> = [];
    let clouds: Array<{ x: number, y: number, speed: number, scale: number }> = [];

    let frameCount = 0;
    let isGameOver = false;
    let hasStarted = false; // Waiting for first input
    let currentScore = 0;

    // Cloud gen
    for (let i = 0; i < 5; i++) {
        clouds.push({ x: Math.random() * width, y: Math.random() * (height / 2), speed: 0.5 + Math.random(), scale: 0.5 + Math.random() });
    }

    // --- Helpers ---
    const spawnParticles = (x: number, y: number, count: number = 8) => {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: COLORS.particle[Math.floor(Math.random() * COLORS.particle.length)]
            });
        }
    };

    const drawCloud = (x: number, y: number, scale: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x + 15 * scale, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 35 * scale, y, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    };

    const reset = () => {
        bird = { x: 50, y: height / 2, velocity: 0, rotation: 0, w: 30, h: 24 };
        pipes = [];
        frameCount = 0;
        isGameOver = false;
        hasStarted = false;
        currentScore = 0;
        setScore(() => 0);
    };

    return {
        init: () => {
            if (canvas) {
                canvas.width = width;
                canvas.height = height;
            }
            reset();
        },

        update: (_dt) => {
            // Background
            ctx.fillStyle = COLORS.bg;
            ctx.fillRect(0, 0, width, height);

            // Clouds
            clouds.forEach(c => {
                c.x -= c.speed;
                if (c.x < -100) c.x = width + 100;
                drawCloud(c.x, c.y, c.scale);
            });

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].x += particles[i].vx;
                particles[i].y += particles[i].vy;
                particles[i].life -= 0.05;

                ctx.fillStyle = particles[i].color;
                ctx.globalAlpha = particles[i].life;
                ctx.fillRect(particles[i].x, particles[i].y, 4, 4);
                ctx.globalAlpha = 1.0;

                if (particles[i].life <= 0) particles.splice(i, 1);
            }

            // Pipes
            // Update
            if (hasStarted && !isGameOver) {
                if (frameCount % PIPE_SPAWN_RATE === 0) {
                    const minPipe = 50;
                    const maxPipe = height - GAP_SIZE - minPipe - 50; // -50 for ground buffer
                    const topHeight = Math.floor(Math.random() * (maxPipe - minPipe + 1)) + minPipe;
                    pipes.push({ x: width, topHeight, passed: false });
                }

                for (let i = pipes.length - 1; i >= 0; i--) {
                    const pipe = pipes[i];
                    pipe.x -= PIPE_SPEED;

                    // Collision Check
                    // Hitbox slightly smaller than sprite
                    const bx = bird.x - 12;
                    const by = bird.y - 10;
                    const bw = 24;
                    const bh = 20;

                    // Top Pipe
                    if (bx + bw > pipe.x && bx < pipe.x + 50 && by < pipe.topHeight) {
                        isGameOver = true;
                    }
                    // Bottom Pipe
                    if (bx + bw > pipe.x && bx < pipe.x + 50 && by + bh > pipe.topHeight + GAP_SIZE) {
                        isGameOver = true;
                    }

                    // Score
                    if (!pipe.passed && bird.x > pipe.x + 50) {
                        currentScore++;
                        setScore(() => currentScore);
                        playSfx('score');
                        spawnParticles(bird.x, bird.y, 5);
                        pipe.passed = true;
                    }

                    if (pipe.x < -60) pipes.splice(i, 1);
                }
            }

            // Draw Pipes
            ctx.lineWidth = 3;
            ctx.strokeStyle = COLORS.pipeBorder;
            pipes.forEach(pipe => {
                const bottomY = pipe.topHeight + GAP_SIZE;

                // Top
                ctx.fillStyle = COLORS.pipe;
                ctx.fillRect(pipe.x, 0, 50, pipe.topHeight);
                ctx.strokeRect(pipe.x, 0, 50, pipe.topHeight);
                // Cap
                ctx.fillRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);
                ctx.strokeRect(pipe.x - 2, pipe.topHeight - 20, 54, 20);

                // Bottom
                ctx.fillStyle = COLORS.pipe;
                ctx.fillRect(pipe.x, bottomY, 50, height - bottomY);
                ctx.strokeRect(pipe.x, bottomY, 50, height - bottomY);
                // Cap
                ctx.fillRect(pipe.x - 2, bottomY, 54, 20);
                ctx.strokeRect(pipe.x - 2, bottomY, 54, 20);
            });

            // Physics & Bird
            if (hasStarted && !isGameOver) {
                bird.velocity += GRAVITY;
                bird.y += bird.velocity;
                bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.1)));

                if (bird.y >= height - 20) {
                    bird.y = height - 20;
                    isGameOver = true;
                }
                if (bird.y < 0) {
                    bird.y = 0;
                    bird.velocity = 0;
                }
                frameCount++;
            } else if (!hasStarted) {
                // Hovering
                bird.y = height / 2 + Math.sin(Date.now() / 300) * 10;
                bird.rotation = 0;
            }

            // Draw Bird
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.rotate(bird.rotation);

            // Bird Body
            ctx.fillStyle = COLORS.bird;
            ctx.fillRect(-15, -12, 30, 24);
            ctx.lineWidth = 2;
            ctx.strokeStyle = COLORS.birdBorder;
            ctx.strokeRect(-15, -12, 30, 24);

            // Eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(5, -8, 8, 8);
            ctx.fillStyle = '#000';
            ctx.fillRect(9, -6, 2, 2);

            // Beak
            ctx.fillStyle = COLORS.birdBorder;
            ctx.fillRect(5, 2, 12, 6);

            // Wing
            ctx.fillStyle = '#fff';
            ctx.fillRect(-8, 2, 12, 6);

            ctx.restore();

            // Ground
            ctx.fillStyle = '#ded895';
            ctx.fillRect(0, height - 20, width, 20);
            ctx.strokeStyle = '#654053';
            ctx.beginPath();
            ctx.moveTo(0, height - 20);
            ctx.lineTo(width, height - 20);
            ctx.stroke();

            // UI
            if (!hasStarted) {
                ctx.fillStyle = COLORS.text;
                ctx.font = '20px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText("TAP OR SPACE", width / 2, height / 2 + 60);
                ctx.fillText("TO FLY", width / 2, height / 2 + 90);
                ctx.textAlign = 'left';
            }

            if (isGameOver) {
                onGameOver(currentScore);
                // Also draw "Game Over" on canvas for polish
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = COLORS.text;
                ctx.textAlign = 'center';
                ctx.font = '30px "Press Start 2P"';
                ctx.fillText("GAME OVER", width / 2, height / 2);
                ctx.font = '15px "Press Start 2P"';
                ctx.fillText(`SCORE: ${currentScore}`, width / 2, height / 2 + 40);
                ctx.textAlign = 'left';
                return;
            }
        },

        destroy: () => { },

        onInput: (code) => {
            if (code === 'Space' || code === 'Click') {
                if (isGameOver) {
                    // Reset handled by React logic mostly, but if using 'R' key style:
                    reset();
                } else if (!hasStarted) {
                    hasStarted = true;
                    bird.velocity = JUMP;
                    playSfx('jump');
                } else {
                    bird.velocity = JUMP;
                    playSfx('jump');
                    spawnParticles(bird.x - 10, bird.y + 10, 4);
                }
            }
            if (code === 'KeyR' && isGameOver) {
                reset();
            }
        },

        // Add handleInputState compatibility if needed
        handleInputState: (keys: Set<string>) => {
            // For Flappy Bird we mostly care about single taps, handled in onInput.
            // But allow Space hold to fly up? No, that's bad game design for flappy bird.
        }
    };
};
