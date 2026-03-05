'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import StartScreen from '@/components/StartScreen';
import GameOver from '@/components/GameOver';
import { initGameData } from '@/game/engine';
import { COLORS } from '@/game/constants';
import type { GameData } from '@/game/types';

export default function GamePage() {
  const [displayData, setDisplayData] = useState<GameData>(initGameData());
  const gameDataRef = useRef<GameData>(initGameData());

  const handleGameDataUpdate = useCallback((data: GameData) => {
    setDisplayData(data);
  }, []);

  const handleStart = useCallback(() => {
    const fresh = initGameData();
    fresh.gameState = 'PLAYING';
    gameDataRef.current = fresh;
    setDisplayData(fresh);
  }, []);

  const handleRetry = useCallback(() => {
    const fresh = initGameData();
    fresh.gameState = 'PLAYING';
    gameDataRef.current = fresh;
    setDisplayData(fresh);
  }, []);

  const handleMenu = useCallback(() => {
    const fresh = initGameData();
    gameDataRef.current = fresh;
    setDisplayData(fresh);
  }, []);

  const handlePause = useCallback(() => {
    const updated = { ...gameDataRef.current, gameState: 'PAUSED' as const };
    gameDataRef.current = updated;
    setDisplayData(updated);
  }, []);

  const handleResume = useCallback(() => {
    const updated = { ...gameDataRef.current, gameState: 'PLAYING' as const };
    gameDataRef.current = updated;
    setDisplayData(updated);
  }, []);

  const handleSubmitScore = useCallback(async (name: string) => {
    const updated = { ...gameDataRef.current, gameState: 'SUBMITTING_SCORE' as const };
    gameDataRef.current = updated;
    setDisplayData(updated);

    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score: gameDataRef.current.score }),
      });
    } catch {
      // Silently fail — score submission is best-effort
    }

    const done = { ...gameDataRef.current, gameState: 'GAME_OVER' as const };
    gameDataRef.current = done;
    setDisplayData(done);
  }, []);

  // Handle keyboard shortcuts for pause/resume/start
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (gameDataRef.current.gameState === 'PLAYING') {
          handlePause();
        } else if (gameDataRef.current.gameState === 'PAUSED') {
          handleResume();
        }
      }
      if ((e.key === ' ' || e.key === 'Enter') && gameDataRef.current.gameState === 'MENU') {
        e.preventDefault();
        handleStart();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePause, handleResume, handleStart]);

  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitScoreWithState = useCallback(
    async (name: string) => {
      setIsSubmitting(true);
      await handleSubmitScore(name);
      setIsSubmitting(false);
      setScoreSubmitted(true);
    },
    [handleSubmitScore]
  );

  const handleRetryWithReset = useCallback(() => {
    setScoreSubmitted(false);
    handleRetry();
  }, [handleRetry]);

  const handleMenuWithReset = useCallback(() => {
    setScoreSubmitted(false);
    handleMenu();
  }, [handleMenu]);

  return (
    <div className="relative w-screen h-dvh overflow-hidden">
      <GameCanvas
        gameState={displayData.gameState}
        onGameDataUpdate={handleGameDataUpdate}
        gameDataRef={gameDataRef}
      />

      {/* Menu */}
      {displayData.gameState === 'MENU' && (
        <StartScreen
          onStart={handleStart}
          onShowLeaderboard={() => {}}
        />
      )}

      {/* HUD during gameplay */}
      {(displayData.gameState === 'PLAYING' || displayData.gameState === 'PAUSED') && (
        <HUD gameData={displayData} onPause={handlePause} />
      )}

      {/* Pause overlay */}
      {displayData.gameState === 'PAUSED' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="flex flex-col items-center gap-6">
            <h2
              className="text-lg"
              style={{
                fontFamily: 'var(--font-press-start)',
                color: COLORS.NEON_YELLOW,
                textShadow: `0 0 15px ${COLORS.NEON_YELLOW}`,
              }}
            >
              PAUSED
            </h2>
            <button
              onClick={handleResume}
              className="px-8 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                fontFamily: 'var(--font-press-start)',
                color: COLORS.NEON_CYAN,
                border: `2px solid ${COLORS.NEON_CYAN}`,
                backgroundColor: 'transparent',
                borderRadius: '4px',
              }}
            >
              RESUME
            </button>
            <button
              onClick={handleMenuWithReset}
              className="px-8 py-3 text-xs tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                fontFamily: 'var(--font-press-start)',
                color: COLORS.HUD_TEXT,
                border: `1px solid rgba(255,255,255,0.2)`,
                backgroundColor: 'transparent',
                borderRadius: '4px',
              }}
            >
              QUIT
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {(displayData.gameState === 'GAME_OVER' || displayData.gameState === 'SUBMITTING_SCORE') && (
        <GameOver
          gameData={displayData}
          onRetry={handleRetryWithReset}
          onMenu={handleMenuWithReset}
          onSubmitScore={handleSubmitScoreWithState}
          isSubmitting={isSubmitting}
          submitted={scoreSubmitted}
        />
      )}
    </div>
  );
}
