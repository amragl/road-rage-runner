'use client';

import { useRef, useEffect, useCallback } from 'react';
import { CANVAS, EFFECTS } from '@/game/constants';
import { drawRoad, getCanvasMetrics } from '@/game/road';
import { drawCar } from '@/game/car';
import { drawObstacle } from '@/game/obstacles';
import { drawWarnings } from '@/game/warnings';
import { updateGame } from '@/game/engine';
import {
  spawnDustParticles,
  updateParticles,
  drawParticles,
  drawSpeedLines,
  drawVignette,
  clearParticles,
} from '@/game/effects';
import { useInput } from '@/hooks/useInput';
import { useGameLoop } from '@/hooks/useGameLoop';
import type { CanvasMetrics, GameData, GameState } from '@/game/types';

interface GameCanvasProps {
  gameState: GameState;
  onGameDataUpdate: (data: GameData) => void;
  gameDataRef: React.MutableRefObject<GameData>;
}

export default function GameCanvas({ gameState, onGameDataUpdate, gameDataRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    return () => {
      observer.disconnect();
      clearParticles();
    };
  }, [resizeCanvas]);

  const handleUpdate = useCallback(
    (deltaTime: number) => {
      const input = consumeInput();
      gameDataRef.current = updateGame(gameDataRef.current, deltaTime, input, metricsRef.current);
      onGameDataUpdate(gameDataRef.current);

      // Update visual effects
      const metrics = metricsRef.current;
      if (metrics) {
        spawnDustParticles(metrics, gameDataRef.current.speed);
        updateParticles(deltaTime);
      }
    },
    [consumeInput, onGameDataUpdate, gameDataRef]
  );

  const renderScene = useCallback((ctx: CanvasRenderingContext2D, metrics: CanvasMetrics, data: GameData) => {
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

    // Speed lines in margins
    drawSpeedLines(ctx, metrics, data.speed, data.scrollOffset);

    for (const obstacle of data.obstacles) {
      drawObstacle(ctx, obstacle, metrics);
    }

    drawCar(ctx, data.car, metrics);

    // Particles
    drawParticles(ctx);

    // Warnings
    drawWarnings(ctx, data.warnings, metrics);

    // Vignette at high speed
    drawVignette(ctx, metrics, data.speed);
  }, []);

  const handleRender = useCallback(() => {
    const canvas = canvasRef.current;
    const metrics = metricsRef.current;
    const data = gameDataRef.current;
    if (!canvas || !metrics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderScene(ctx, metrics, data);
  }, [gameDataRef, renderScene]);

  const isRunning = gameState === 'PLAYING';
  useGameLoop(handleUpdate, handleRender, isRunning);

  // Render static frame when not running
  useEffect(() => {
    if (!isRunning) {
      const canvas = canvasRef.current;
      const metrics = metricsRef.current;
      const data = gameDataRef.current;
      if (!canvas || !metrics) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderScene(ctx, metrics, data);
    }
  }, [isRunning, gameDataRef, renderScene]);

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
