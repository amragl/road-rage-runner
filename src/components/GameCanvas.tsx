'use client';

import { useRef, useEffect, useCallback } from 'react';
import { CANVAS, SPEED } from '@/game/constants';
import { drawRoad, getCanvasMetrics } from '@/game/road';
import { drawCar, createCar, updateCar } from '@/game/car';
import { useInput } from '@/hooks/useInput';
import type { CanvasMetrics } from '@/game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffsetRef = useRef(0);
  const carRef = useRef(createCar());
  const animFrameRef = useRef<number>(0);
  const metricsRef = useRef<CanvasMetrics | null>(null);
  const lastTimeRef = useRef<number>(0);
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

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    function tick(timestamp: number) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      // Update car with input
      const input = consumeInput();
      carRef.current = updateCar(carRef.current, input, deltaTime);

      // Scroll road
      scrollOffsetRef.current += SPEED.INITIAL;

      // Render
      const canvas = canvasRef.current;
      const metrics = metricsRef.current;
      if (canvas && metrics) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, metrics.width, metrics.height);
          drawRoad(ctx, metrics, scrollOffsetRef.current);
          drawCar(ctx, carRef.current, metrics);
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
    };
  }, [resizeCanvas, consumeInput]);

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
