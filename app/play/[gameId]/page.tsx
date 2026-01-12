"use client";

import { useStore } from '@/lib/store';
import { use, useEffect, useRef, useState } from 'react';
import { PixelCard } from '@/components/ui/PixelCard';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { getGame } from '@/games/registry';
import { GameInstance } from '@/games/types';
import { supabase } from '@/lib/supabase';
import { Leaderboard } from '@/components/Leaderboard';

export default function GameRunnerPage({ params }: { params: Promise<{ gameId: string }> }) {
    const router = useRouter();
    const { gameId } = use(params);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameInstance = useRef<GameInstance | null>(null);
    const requestRef = useRef<number | null>(null);
    const keysPressed = useRef<Set<string>>(new Set());

    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER'>('START');
    const { username, setScore: saveHighScore } = useStore();
    const [submitStatus, setSubmitStatus] = useState<'IDLE' | 'SUBMITTING' | 'DONE'>('IDLE');

    const gameConfig = getGame(gameId);

    useEffect(() => {
        console.log(`[GameRunner] Loading gameId: ${gameId}`, gameConfig);
    }, [gameId, gameConfig]);

    // Submit Score Logic
    const submitScoreToSupabase = async (finalScore: number) => {
        if (!username) return;
        setSubmitStatus('SUBMITTING');
        try {
            const { error } = await supabase.from('scores').insert({
                username,
                game_id: gameId,
                score: finalScore
            });
            if (error) console.error("Supabase Error:", error);
            setSubmitStatus('DONE');
        } catch (e) {
            console.error(e);
            setSubmitStatus('IDLE');
        }
    };

    // Initialize Game Loop
    useEffect(() => {
        if (!gameConfig || !canvasRef.current) return;

        const canvas = canvasRef.current;

        // Set High Res/Retro Scaling
        canvas.width = 400;
        canvas.height = 600;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Instantiate State-less Game Logic
        gameInstance.current = gameConfig.factory({
            canvas,
            ctx,
            width: canvas.width,
            height: canvas.height,
            setScore: setScore,
            onGameOver: (finalScore) => {
                setGameState('GAME_OVER');
                saveHighScore(gameId, finalScore);
                submitScoreToSupabase(finalScore);
            }
        });

        return () => {
            gameInstance.current?.destroy();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameId, gameConfig, saveHighScore, username]);

    // Handle Game Loop (Ticking)
    useEffect(() => {
        let lastTime = performance.now();

        const tick = (time: number) => {
            const deltaTime = time - lastTime;
            lastTime = time;

            // Allow updates during GAME_OVER for visual effects (stars, particles)
            if ((gameState === 'PLAYING' || gameState === 'GAME_OVER') && gameInstance.current) {
                // Poll continuous input
                if (gameState === 'PLAYING' && gameInstance.current.handleInputState) {
                    gameInstance.current.handleInputState(keysPressed.current);
                }
                gameInstance.current.update(deltaTime);
            } else if (gameState === 'START' && gameInstance.current) {
                gameInstance.current.update(0); // Draw once background
            }

            requestRef.current = requestAnimationFrame(tick);
        };

        requestRef.current = requestAnimationFrame(tick);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState]);

    // Controls
    const handleInput = () => {
        // Initialize Audio Context on first interaction
        import('@/lib/sfx').then(mod => mod.initAudio());

        if (gameState === 'START') {
            setGameState('PLAYING');
            gameInstance.current?.init();
        } else if (gameState === 'PLAYING') {
            // Deprecated: onInput is now handled primarily by the event listener below for general inputs
            // But we keep this for click handlers
            gameInstance.current?.onInput('Space');
        } else if (gameState === 'GAME_OVER') {
            setGameState('PLAYING');
            setSubmitStatus('IDLE');
            setScore(0);
            gameInstance.current?.init();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current.add(e.code);

            // Global Restart
            if (gameState === 'GAME_OVER' && e.code === 'KeyR') {
                handleInput();
                return;
            }

            // Start Game
            if (gameState === 'START' && (e.code === 'Space' || e.code === 'Enter')) {
                handleInput();
                return;
            }

            // Pass discrete inputs to game
            if (gameState === 'PLAYING') {
                gameInstance.current?.onInput(e.code);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current.delete(e.code);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    if (!gameConfig) return <div className="p-10 text-center text-red-500 font-press-start">GAME NOT FOUND 404</div>;

    return (
        <main className="min-h-screen bg-arcade-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg mb-4 flex justify-between items-center text-arcade-white">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:text-arcade-pink font-press-start text-xs">
                    <ArrowLeft /> BACK TO ARCADE
                </button>
                <div className="font-press-start text-arcade-yellow">
                    Playing: {gameConfig.meta.name}
                </div>
            </div>

            <PixelCard variant="screen" className="relative p-0 border-8 border-arcade-gray rounded-xl shadow-2xl">
                <canvas
                    ref={canvasRef}
                    onClick={handleInput}
                    className="block w-full h-full cursor-pointer max-h-[70vh] bg-black"
                />

                {/* HUD Layer (React) */}
                <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-20">
                    <span className="font-press-start text-4xl text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        {score}
                    </span>
                </div>

                {gameState === 'START' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
                        <div className="text-center animate-pulse">
                            <h2 className="font-press-start text-2xl text-arcade-yellow mb-4">READY?</h2>
                            <p className="font-vt323 text-xl text-white">ARROW KEYS TO MOVE / SPACE TO SHOOT</p>
                        </div>
                    </div>
                )}

                {gameState === 'GAME_OVER' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 p-4">
                        <PixelCard variant="neon" className="p-6 text-center bg-arcade-black w-full max-w-sm mb-4">
                            <h2 className="font-press-start text-2xl text-arcade-pink mb-2">GAME OVER</h2>
                            <p className="font-vt323 text-2xl text-white mb-4">SCORE: {score}</p>

                            {submitStatus === 'SUBMITTING' && <p className="text-arcade-yellow font-vt323 mb-2">Submitting score...</p>}
                            {submitStatus === 'DONE' && <p className="text-arcade-green font-vt323 mb-2">Score Submitted!</p>}

                            <button
                                onClick={handleInput}
                                className="flex items-center justify-center gap-2 w-full bg-arcade-green py-3 font-press-start text-black hover:bg-white text-sm"
                            >
                                <RotateCcw className="w-4 h-4" /> RESTART
                            </button>
                        </PixelCard>

                        <Leaderboard gameId={gameId} refreshTrigger={submitStatus === 'DONE' ? Date.now() : 0} />
                    </div>
                )}
            </PixelCard>
        </main>
    );
}
