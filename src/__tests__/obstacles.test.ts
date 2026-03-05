import { describe, test, expect, beforeEach } from 'vitest';
import { trySpawnObstacle, updateObstacles, resetObstacleIdCounter } from '@/game/obstacles';
import { initGameData } from '@/game/engine';

describe('Obstacles', () => {
  beforeEach(() => {
    resetObstacleIdCounter();
  });

  test('spawns obstacle above canvas', () => {
    const data = initGameData();
    data.gameState = 'PLAYING';
    data.lastObstacleSpawnTime = 0; // long ago

    const obstacle = trySpawnObstacle(data, Date.now());
    if (obstacle) {
      expect(obstacle.y).toBeLessThan(0);
    }
  });

  test('respects max simultaneous limit', () => {
    const data = initGameData();
    data.gameState = 'PLAYING';
    data.time = 0; // phase 0: max 1

    // Add one obstacle manually
    data.obstacles = [
      { type: 'POTHOLE', lane: 0, y: 100, id: 'test1', hasWarned: false, hasCollided: false },
    ];

    const result = trySpawnObstacle(data, Date.now());
    expect(result).toBeNull();
  });

  test('respects minimum gap time', () => {
    const data = initGameData();
    data.gameState = 'PLAYING';
    data.lastObstacleSpawnTime = Date.now(); // just spawned

    const result = trySpawnObstacle(data, Date.now());
    expect(result).toBeNull();
  });

  test('obstacles move down over time', () => {
    const obstacles = [
      { type: 'POTHOLE' as const, lane: 1, y: 100, id: 'test1', hasWarned: false, hasCollided: false },
    ];

    const updated = updateObstacles(obstacles, 3, 16, 800);
    expect(updated[0].y).toBeGreaterThan(100);
  });

  test('removes obstacles below canvas', () => {
    const obstacles = [
      { type: 'POTHOLE' as const, lane: 1, y: 950, id: 'test1', hasWarned: false, hasCollided: false },
    ];

    const updated = updateObstacles(obstacles, 3, 16, 800);
    expect(updated.length).toBe(0);
  });

  test('difficulty phases unlock correctly', () => {
    const data = initGameData();
    data.gameState = 'PLAYING';
    data.lastObstacleSpawnTime = 0;

    // At time 0, only POTHOLE and TUMBLEWEED
    data.time = 0;
    const spawnedTypes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const obs = trySpawnObstacle({ ...data, obstacles: [] }, Date.now() - 10000);
      if (obs) spawnedTypes.add(obs.type);
    }
    expect(spawnedTypes.has('POTHOLE') || spawnedTypes.has('TUMBLEWEED')).toBe(true);
    expect(spawnedTypes.has('SPEED_CAMERA')).toBe(false);
    expect(spawnedTypes.has('OIL_SLICK')).toBe(false);
  });
});
