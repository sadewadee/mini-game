
import { PixelCard } from "@/components/ui/PixelCard";
import { UserOnboarding } from "@/components/UserOnboarding";
import { Gamepad2, Trophy, Users } from "lucide-react";
import Link from "next/link";

const GAMES = [
  {
    id: 'flappy-bird',
    title: 'FLAPPY PIXEL',
    description: 'DODGE THE PIPES!',
    players: 128,
    color: 'text-arcade-yellow'
  },
  {
    id: 'space-invaders',
    title: 'CLAUDE INVADERS',
    description: 'DEBUG THE BUGS!',
    players: 42,
    color: 'text-arcade-cyan'
  },
  {
    id: 'snake',
    title: 'SNAKE XENIA',
    description: 'EAT. GROW. DIE.',
    players: 310,
    color: 'text-arcade-green'
  }
];

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto">
      <UserOnboarding />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-arcade-gray pb-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-press-start text-arcade-pink text-shadow-retro mb-2">
            PERNGANUAN
          </h1>
          <h2 className="text-2xl md:text-4xl font-press-start text-arcade-cyan">
            DUNIAWI
          </h2>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-arcade-green text-xl font-vt323">SERVER STATUS: ONLINE</span>
            <span className="text-arcade-yellow text-xl font-vt323 animate-pulse">INSERT COIN TO PLAY</span>
          </div>
        </div>
      </header>

      {/* Marquee */}
      <div className="bg-arcade-purple border-2 border-arcade-cyan p-2 overflow-hidden whitespace-nowrap">
        <div className="animate-[scanline_10s_linear_infinite_horizontal] inline-block w-full">
          <span className="mx-4 text-arcade-white font-vt323 text-xl">
            ★ HIGH SCORE ALERT: SADEWADEE JUST SCORED 9999 IN SPACE INVADERS ★
            NEW GAME ADDED: FLAPPY PIXEL ★
            WELCOME TO THE ARCADE ★
          </span>
        </div>
      </div>

      {/* Game Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <Link href={`/play/${game.id}`} key={game.id}>
            <PixelCard className="h-full hover:-translate-y-2 hover:border-arcade-yellow transition-all cursor-pointer group">
              <div className="aspect-video bg-black mb-4 relative overflow-hidden border-2 border-arcade-gray group-hover:border-arcade-white">
                {/* Placeholder Art */}
                <div className={`absolute inset-0 opacity-20 ${game.id === 'flappy-bird' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-white opacity-50" />
                </div>
                {game.id === 'flappy-bird' && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-arcade-pink text-white text-xs font-press-start animate-bounce">
                    NEW!
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-press-start text-sm ${game.color}`}>{game.title}</h3>
                <div className="flex items-center gap-1 text-arcade-gray text-sm">
                  <Users className="w-4 h-4" />
                  <span>{game.players}</span>
                </div>
              </div>

              <p className="text-arcade-white/80 font-vt323 text-xl">{game.description}</p>
            </PixelCard>
          </Link>
        ))}
      </section>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-arcade-gray font-vt323">
        <p>EST. 2026 • PERNGANUAN DUNIAWI CORP • NO COPYRIGHT INTENDED</p>
      </footer>
    </main>
  );
}
