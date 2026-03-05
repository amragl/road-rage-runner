'use client';

import { useState, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import type { GameData } from '@/game/types';
import { initGameData } from '@/game/engine';

export default function GamePage() {
  const [gameData, setGameData] = useState<GameData>(initGameData());

  const handleGameDataUpdate = useCallback((data: GameData) => {
    setGameData(data);
  }, []);

  return (
    <div className="relative w-screen h-dvh overflow-hidden">
      <GameCanvas onGameDataUpdate={handleGameDataUpdate} />
      {gameData.gameState === 'PLAYING' && (
        <HUD gameData={gameData} />
      )}
    </div>
  );
}
