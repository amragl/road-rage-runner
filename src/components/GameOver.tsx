'use client';

import { useState } from 'react';
import { COLORS, SPEED, SCORING } from '@/game/constants';
import type { GameData } from '@/game/types';

interface GameOverProps {
  gameData: GameData;
  onRetry: () => void;
  onMenu: () => void;
  onSubmitScore: (name: string) => void;
  isSubmitting: boolean;
  submitted: boolean;
}

export default function GameOver({
  gameData,
  onRetry,
  onMenu,
  onSubmitScore,
  isSubmitting,
  submitted,
}: GameOverProps) {
  const [name, setName] = useState('');

  const distanceM = Math.floor(gameData.distance / 10);
  const timeSurvived = Math.floor(gameData.time);
  const topSpeedKmh = Math.round(gameData.topSpeed * SPEED.DISPLAY_MULTIPLIER);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, SCORING.NAME_MAX_LENGTH);
    setName(value);
  };

  const handleSubmit = () => {
    if (name.trim().length > 0 && !isSubmitting && !submitted) {
      onSubmitScore(name.trim());
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full">
        {/* Title */}
        <h2
          className="text-lg"
          style={{
            fontFamily: 'var(--font-press-start)',
            color: COLORS.NEON_MAGENTA,
            textShadow: `0 0 20px ${COLORS.NEON_MAGENTA}`,
          }}
        >
          GAME OVER
        </h2>

        {/* Score */}
        <div className="text-center">
          <div
            className="text-[10px] opacity-60 mb-2"
            style={{ fontFamily: 'var(--font-press-start)', color: COLORS.HUD_TEXT }}
          >
            FINAL SCORE
          </div>
          <div
            className="text-2xl"
            style={{
              fontFamily: 'var(--font-press-start)',
              color: COLORS.NEON_CYAN,
              textShadow: `0 0 15px ${COLORS.NEON_CYAN}`,
            }}
          >
            {gameData.score.toLocaleString()}
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-4 text-center w-full"
          style={{ fontFamily: 'var(--font-press-start)' }}
        >
          <div>
            <div className="text-[7px] opacity-40 mb-1" style={{ color: COLORS.HUD_TEXT }}>
              DIST
            </div>
            <div className="text-[10px]" style={{ color: COLORS.HUD_TEXT }}>
              {distanceM}m
            </div>
          </div>
          <div>
            <div className="text-[7px] opacity-40 mb-1" style={{ color: COLORS.HUD_TEXT }}>
              TIME
            </div>
            <div className="text-[10px]" style={{ color: COLORS.HUD_TEXT }}>
              {timeSurvived}s
            </div>
          </div>
          <div>
            <div className="text-[7px] opacity-40 mb-1" style={{ color: COLORS.HUD_TEXT }}>
              TOP SPD
            </div>
            <div className="text-[10px]" style={{ color: COLORS.HUD_TEXT }}>
              {topSpeedKmh}
            </div>
          </div>
        </div>

        {/* Name input */}
        {!submitted && (
          <div className="flex flex-col items-center gap-3 w-full">
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="YOUR NAME"
              maxLength={SCORING.NAME_MAX_LENGTH}
              className="w-full px-4 py-3 text-center text-sm bg-transparent outline-none"
              style={{
                fontFamily: 'var(--font-press-start)',
                color: COLORS.NEON_YELLOW,
                border: `1px solid ${COLORS.NEON_YELLOW}50`,
                borderRadius: '4px',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={name.trim().length === 0 || isSubmitting}
              className="px-6 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
              style={{
                fontFamily: 'var(--font-press-start)',
                color: COLORS.NEON_YELLOW,
                border: `1px solid ${COLORS.NEON_YELLOW}`,
                backgroundColor: 'transparent',
                borderRadius: '4px',
              }}
            >
              {isSubmitting ? 'SAVING...' : 'SUBMIT SCORE'}
            </button>
          </div>
        )}

        {submitted && (
          <div
            className="text-xs"
            style={{
              fontFamily: 'var(--font-press-start)',
              color: COLORS.NEON_YELLOW,
            }}
          >
            SCORE SAVED!
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={onRetry}
            className="px-6 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95 w-full"
            style={{
              fontFamily: 'var(--font-press-start)',
              color: COLORS.NEON_CYAN,
              border: `2px solid ${COLORS.NEON_CYAN}`,
              backgroundColor: 'transparent',
              borderRadius: '4px',
              boxShadow: `0 0 10px ${COLORS.NEON_CYAN}40`,
            }}
          >
            RETRY
          </button>
          <button
            onClick={onMenu}
            className="px-6 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95 w-full"
            style={{
              fontFamily: 'var(--font-press-start)',
              color: COLORS.HUD_TEXT,
              border: `1px solid rgba(255,255,255,0.2)`,
              backgroundColor: 'transparent',
              borderRadius: '4px',
            }}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
