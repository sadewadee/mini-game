
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PlayerState = {
  username: string | null;
  highScores: Record<string, number>;
  volume: number;
  setUsername: (name: string) => void;
  setScore: (gameId: string, score: number) => void;
  toggleMute: () => void;
};

export const useStore = create<PlayerState>()(
  persist(
    (set) => ({
      username: null,
      highScores: {},
      volume: 0.5,
      setUsername: (name) => set({ username: name }),
      setScore: (gameId, score) =>
        set((state) => ({
          highScores: {
            ...state.highScores,
            [gameId]: Math.max(score, state.highScores[gameId] || 0),
          },
        })),
      toggleMute: () => set((state) => ({ volume: state.volume === 0 ? 0.5 : 0 })),
    }),
    {
      name: 'pernganuan-storage',
    }
  )
);
