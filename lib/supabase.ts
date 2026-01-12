
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate env vars to prevent confusing errors later
if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing! Leaderboards will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Score = {
    id: string;
    username: string;
    score: number;
    game_id: string;
    created_at: string;
};
