'use client';

import { COLORS } from '@/game/constants';

interface StartScreenProps {
  onStart: () => void;
  onShowLeaderboard: () => void;
}

export default function StartScreen({ onStart, onShowLeaderboard }: StartScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-10">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md">
        {/* Title */}
        <h1
          className="text-xl md:text-2xl text-center leading-relaxed"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.NEON_CYAN,
            textShadow: `0 0 20px ${COLORS.NEON_CYAN}, 0 0 40px ${COLORS.NEON_CYAN}40`,
          }}
        >
          ROAD RAGE
          <br />
          <span
            style={{
              color: COLORS.NEON_MAGENTA,
              textShadow: `0 0 20px ${COLORS.NEON_MAGENTA}, 0 0 40px ${COLORS.NEON_MAGENTA}40`,
            }}
          >
            RUNNER
          </span>
        </h1>

        {/* Start button */}
        <button
          onClick={onStart}
          className="px-8 py-4 text-sm tracking-wider transition-all hover:scale-105 active:scale-95"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.NEON_CYAN,
            backgroundColor: 'transparent',
            border: `2px solid ${COLORS.NEON_CYAN}`,
            boxShadow: `0 0 10px ${COLORS.NEON_CYAN}40, inset 0 0 10px ${COLORS.NEON_CYAN}20`,
            borderRadius: '4px',
          }}
        >
          START GAME
        </button>

        {/* Leaderboard button */}
        <button
          onClick={onShowLeaderboard}
          className="px-6 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.NEON_YELLOW,
            backgroundColor: 'transparent',
            border: `1px solid ${COLORS.NEON_YELLOW}50`,
            borderRadius: '4px',
          }}
        >
          LEADERBOARD
        </button>

        {/* Controls */}
        <div
          className="text-[10px] text-center leading-6 mt-4 opacity-50"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.HUD_TEXT,
          }}
        >
          <p>ARROWS or A/D to move</p>
          <p>SWIPE or TAP on mobile</p>
          <p>ESC to pause</p>
        </div>
      </div>
    </div>
  );
}
