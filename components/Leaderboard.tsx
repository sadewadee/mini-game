
import { useEffect, useState } from 'react';
import { supabase, Score } from '@/lib/supabase';
import { Trophy } from 'lucide-react';
import { PixelCard } from './ui/PixelCard';

export function Leaderboard({ gameId, refreshTrigger }: { gameId: string, refreshTrigger?: number }) {
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('scores')
                .select('*')
                .eq('game_id', gameId)
                .order('score', { ascending: false })
                .limit(10);

            if (data) setScores(data);
            setLoading(false);
        };

        fetchScores();
    }, [gameId, refreshTrigger]);

    return (
        <PixelCard className="w-full max-w-md mt-4 p-4 border-arcade-yellow">
            <div className="flex items-center gap-2 mb-4 text-arcade-yellow border-b border-arcade-yellow pb-2">
                <Trophy className="w-5 h-5" />
                <h3 className="font-press-start text-sm">TOP PLAYERS</h3>
            </div>

            {loading ? (
                <div className="text-center font-vt323 text-arcade-white">LOADING SCORES...</div>
            ) : scores.length === 0 ? (
                <div className="text-center font-vt323 text-arcade-gray">BE THE FIRST TO SCORE!</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {scores.map((s, i) => (
                        <div key={s.id} className="flex justify-between items-center font-vt323 text-xl">
                            <div className="flex items-center gap-3">
                                <span className={`${i < 3 ? 'text-arcade-yellow' : 'text-arcade-gray'}`}>#{i + 1}</span>
                                <span className="text-arcade-white">{s.username}</span>
                            </div>
                            <span className="text-arcade-green">{s.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </PixelCard>
    );
}
