'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { InputAction } from '@/game/types';

const SWIPE_THRESHOLD = 30;

export function useInput() {
  const inputQueueRef = useRef<InputAction[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const consumeInput = useCallback((): InputAction | null => {
    if (inputQueueRef.current.length > 0) {
      return inputQueueRef.current.shift() ?? null;
    }
    return null;
  }, []);

  const enqueue = useCallback((action: InputAction) => {
    // Max 1 buffered input
    if (inputQueueRef.current.length < 2) {
      inputQueueRef.current.push(action);
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        enqueue('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        enqueue('right');
      }
    }

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
    }

    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault();
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Check if it's a swipe (horizontal movement > threshold and > vertical)
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        enqueue(dx > 0 ? 'right' : 'left');
        tryHaptic();
      } else if (Math.abs(dx) <= SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        // Tap — use left/right half of screen
        const screenMid = window.innerWidth / 2;
        enqueue(touch.clientX < screenMid ? 'left' : 'right');
        tryHaptic();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enqueue]);

  return { consumeInput };
}

function tryHaptic(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {
    // Vibration API not available
  }
}
