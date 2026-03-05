'use client';

import { useRef, useEffect } from 'react';

export function useGameLoop(
  onUpdate: (deltaTime: number) => void,
  onRender: () => void,
  running: boolean
) {
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const onUpdateRef = useRef(onUpdate);
  const onRenderRef = useRef(onRender);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onRenderRef.current = onRender;
  }, [onUpdate, onRender]);

  useEffect(() => {
    if (!running) {
      lastTimeRef.current = 0;
      return;
    }

    function tick(timestamp: number) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      onUpdateRef.current(deltaTime);
      onRenderRef.current();

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [running]);
}
