
"use client";

import { useStore } from '@/lib/store';
import { useState } from 'react';
import { PixelCard } from './ui/PixelCard';

export function UserOnboarding() {
    const { username, setUsername } = useStore();
    const [inputName, setInputName] = useState('');

    if (username) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputName.trim().length > 0) {
            setUsername(inputName.trim().toUpperCase());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <PixelCard variant="neon" className="w-full max-w-md p-8 text-center animate-flicker">
                <h2 className="text-2xl font-press-start text-arcade-yellow mb-6">IDENTIFY YOURSELF</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        maxLength={12}
                        placeholder="ENTER INITIALS..."
                        className="w-full bg-arcade-black border-2 border-arcade-cyan p-4 text-center font-press-start text-arcade-white outline-none focus:border-arcade-pink"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-arcade-pink py-4 font-press-start text-white hover:bg-red-600 active:scale-95 transition-all"
                    >
                        INSERT COIN
                    </button>
                </form>
            </PixelCard>
        </div>
    );
}
