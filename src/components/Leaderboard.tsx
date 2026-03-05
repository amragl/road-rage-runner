'use client';

import { useEffect } from 'react';
import { COLORS } from '@/game/constants';
import { useLeaderboard } from '@/hooks/useLeaderboard';

interface LeaderboardProps {
  onClose: () => void;
  highlightName?: string;
}

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard({ onClose, highlightName }: LeaderboardProps) {
  const { scores, loading, error, fetchScores } = useLeaderboard();

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30">
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm w-full">
        <h2
          className="text-sm"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.NEON_YELLOW,
            textShadow: `0 0 15px ${COLORS.NEON_YELLOW}`,
          }}
        >
          LEADERBOARD
        </h2>

        {loading && (
          <div
            className="text-[10px] py-8"
            style={{ fontFamily: 'var(--font-press-start)', color: COLORS.HUD_TEXT }}
          >
            LOADING...
          </div>
        )}

        {error && (
          <div
            className="text-[10px] py-8"
            style={{ fontFamily: 'var(--font-press-start)', color: COLORS.NEON_MAGENTA }}
          >
            {error}
          </div>
        )}

        {!loading && !error && scores.length === 0 && (
          <div
            className="text-[10px] py-8 opacity-50"
            style={{ fontFamily: 'var(--font-press-start)', color: COLORS.HUD_TEXT }}
          >
            NO SCORES YET
          </div>
        )}

        {!loading && scores.length > 0 && (
          <div className="w-full space-y-1">
            {scores.map((entry) => {
              const isHighlighted = highlightName && entry.name === highlightName;
              const rankColor = RANK_COLORS[entry.rank - 1] || COLORS.HUD_TEXT;

              return (
                <div
                  key={`${entry.rank}-${entry.name}`}
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{
                    fontFamily: 'var(--font-press-start)',
                    backgroundColor: isHighlighted
                      ? `${COLORS.NEON_CYAN}20`
                      : 'rgba(255,255,255,0.03)',
                    border: isHighlighted
                      ? `1px solid ${COLORS.NEON_CYAN}50`
                      : '1px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] w-6"
                      style={{ color: rankColor }}
                    >
                      {entry.rank}.
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: isHighlighted ? COLORS.NEON_CYAN : COLORS.HUD_TEXT }}
                    >
                      {entry.name}
                    </span>
                  </div>
                  <span
                    className="text-[9px]"
                    style={{ color: isHighlighted ? COLORS.NEON_CYAN : COLORS.HUD_SCORE }}
                  >
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 px-6 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.HUD_TEXT,
            border: `1px solid rgba(255,255,255,0.2)`,
            backgroundColor: 'transparent',
            borderRadius: '4px',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
