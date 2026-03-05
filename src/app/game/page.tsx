'use client';

import GameCanvas from '@/components/GameCanvas';

export default function GamePage() {
  return (
    <div className="w-screen h-dvh overflow-hidden">
      <GameCanvas />
    </div>
  );
}
