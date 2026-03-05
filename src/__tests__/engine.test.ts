import { describe, test, expect } from 'vitest';
import { initGameData, updateGame } from '@/game/engine';
import { SPEED } from '@/game/constants';

describe('Engine', () => {
  test('initializes with correct defaults', () => {
    const data = initGameData();
    expect(data.speed).toBe(SPEED.INITIAL);
    expect(data.distance).toBe(0);
    expect(data.time).toBe(0);
    expect(data.car.lives).toBe(3);
    expect(data.gameState).toBe('MENU');
  });

  test('does not update when not PLAYING', () => {
    const data = initGameData();
    const updated = updateGame(data, 16, null);
    expect(updated.speed).toBe(SPEED.INITIAL);
    expect(updated.distance).toBe(0);
  });

  test('speed increases over time', () => {
    let data = initGameData();
    data = { ...data, gameState: 'PLAYING' };
    for (let i = 0; i < 100; i++) {
      data = updateGame(data, 16, null);
    }
    expect(data.speed).toBeGreaterThan(SPEED.INITIAL);
  });

  test('speed never exceeds MAX', () => {
    let data = initGameData();
    data = { ...data, gameState: 'PLAYING', speed: SPEED.MAX };
    data = updateGame(data, 16, null);
    expect(data.speed).toBeLessThanOrEqual(SPEED.MAX);
  });

  test('distance accumulates', () => {
    let data = initGameData();
    data = { ...data, gameState: 'PLAYING' };
    data = updateGame(data, 16, null);
    expect(data.distance).toBeGreaterThan(0);
  });

  test('time accumulates in seconds', () => {
    let data = initGameData();
    data = { ...data, gameState: 'PLAYING' };
    data = updateGame(data, 1000, null);
    expect(data.time).toBeCloseTo(1, 1);
  });
});
