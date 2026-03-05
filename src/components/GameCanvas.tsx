'use client';

import { useRef, useEffect, useCallback } from 'react';
import { CANVAS, EFFECTS } from '@/game/constants';
import { drawRoad, getCanvasMetrics } from '@/game/road';
import { drawCar } from '@/game/car';
import { drawObstacle } from '@/game/obstacles';
import { drawWarnings } from '@/game/warnings';
import { initGameData, updateGame } from '@/game/engine';
import { useInput } from '@/hooks/useInput';
import { useGameLoop } from '@/hooks/useGameLoop';
import type { CanvasMetrics, GameData } from '@/game/types';

interface GameCanvasProps {
  onGameDataUpdate?: (data: GameData) => void;
}

export default function GameCanvas({ onGameDataUpdate }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameDataRef = useRef<GameData>(initGameData());
  const metricsRef = useRef<CanvasMetrics | null>(null);
  const { consumeInput } = useInput();

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    let canvasWidth = containerHeight * CANVAS.ASPECT_RATIO;
    let canvasHeight = containerHeight;

    if (canvasWidth > containerWidth) {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / CANVAS.ASPECT_RATIO;
    }

    canvasWidth = Math.min(canvasWidth, CANVAS.MAX_WIDTH);
    canvasWidth = Math.max(canvasWidth, CANVAS.MIN_WIDTH);
    canvasHeight = canvasWidth / CANVAS.ASPECT_RATIO;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    metricsRef.current = getCanvasMetrics(canvasWidth, canvasHeight);
  }, []);

  useEffect(() => {
    resizeCanvas();
    const observer = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  // Start the game immediately for now
  useEffect(() => {
    gameDataRef.current = { ...gameDataRef.current, gameState: 'PLAYING' };
  }, []);

  const handleUpdate = useCallback(
    (deltaTime: number) => {
      const input = consumeInput();
      gameDataRef.current = updateGame(gameDataRef.current, deltaTime, input, metricsRef.current);
      onGameDataUpdate?.(gameDataRef.current);
    },
    [consumeInput, onGameDataUpdate]
  );

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current;
    const metrics = metricsRef.current;
    const data = gameDataRef.current;
    if (!canvas || !metrics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, metrics.width, metrics.height);

    // Screen shake
    if (data.screenShake > 0) {
      const shakeIntensity = (data.screenShake / EFFECTS.SCREEN_SHAKE_DURATION_MS) * EFFECTS.SCREEN_SHAKE_AMPLITUDE;
      const shakeX = (Math.random() - 0.5) * 2 * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * 2 * shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }

    drawRoad(ctx, metrics, data.scrollOffset);

    // Draw obstacles
    for (const obstacle of data.obstacles) {
      drawObstacle(ctx, obstacle, metrics);
    }

    drawCar(ctx, data.car, metrics);

    // Draw warnings on top
    drawWarnings(ctx, data.warnings, metrics);
  }, []);

  useGameLoop(handleUpdate, handleRender, true);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
