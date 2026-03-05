'use client';

import { SPEED, COLORS } from '@/game/constants';
import type { GameData } from '@/game/types';

interface HUDProps {
  gameData: GameData;
  onPause?: () => void;
}

export default function HUD({ gameData, onPause }: HUDProps) {
  const speedKmh = Math.round(gameData.speed * SPEED.DISPLAY_MULTIPLIER);
  const distanceM = Math.floor(gameData.distance / 10);
  const score = gameData.score;

  const hasSpeedBump = gameData.effects.some((e) => e.type === 'SPEED_BUMP');
  const hasOilSlick = gameData.effects.some((e) => e.type === 'OIL_SLICK');

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ fontFamily: 'var(--font-press-start)' }}
    >
      {/* Score - top left */}
      <div
        className="absolute top-3 left-3 text-xs"
        style={{
          color: COLORS.HUD_SCORE,
          textShadow: `0 0 8px ${COLORS.NEON_CYAN}`,
        }}
      >
        <div className="text-[8px] opacity-60 mb-1">SCORE</div>
        <div>{score.toLocaleString()}</div>
      </div>

      {/* Speed - top right */}
      <div
        className="absolute top-3 right-3 text-xs text-right"
        style={{
          color: COLORS.HUD_SPEED,
          textShadow: `0 0 8px ${COLORS.NEON_YELLOW}`,
        }}
      >
        <div className="text-[8px] opacity-60 mb-1">SPEED</div>
        <div>{speedKmh} km/h</div>
      </div>

      {/* Distance - top center */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 text-xs text-center"
        style={{
          color: COLORS.HUD_TEXT,
          textShadow: '0 0 4px rgba(255,255,255,0.5)',
        }}
      >
        <div className="text-[8px] opacity-60 mb-1">DIST</div>
        <div>{distanceM}m</div>
      </div>

      {/* Lives - bottom left */}
      <div className="absolute bottom-3 left-3 flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className="text-sm"
            style={{
              color: i < gameData.car.lives ? COLORS.HUD_LIVES : '#333',
              textShadow:
                i < gameData.car.lives
                  ? `0 0 6px ${COLORS.NEON_MAGENTA}`
                  : 'none',
            }}
          >
            {i < gameData.car.lives ? '♥' : '♡'}
          </span>
        ))}
      </div>

      {/* Active effects - bottom center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {hasSpeedBump && (
          <div
            className="px-2 py-1 rounded text-[8px]"
            style={{
              backgroundColor: 'rgba(255, 214, 0, 0.2)',
              color: COLORS.NEON_YELLOW,
              border: `1px solid ${COLORS.NEON_YELLOW}`,
            }}
          >
            SLOW
          </div>
        )}
        {hasOilSlick && (
          <div
            className="px-2 py-1 rounded text-[8px]"
            style={{
              backgroundColor: 'rgba(153, 51, 255, 0.2)',
              color: '#9933FF',
              border: '1px solid #9933FF',
            }}
          >
            SLICK
          </div>
        )}
      </div>

      {/* Pause button - top right corner (pointer events enabled) */}
      {onPause && (
        <button
          onClick={onPause}
          className="absolute top-3 right-3 mt-8 pointer-events-auto w-8 h-8 flex items-center justify-center rounded"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          ⏸
        </button>
      )}
    </div>
  );
}
