import { describe, test, expect } from 'vitest';
import { checkCollision } from '@/game/collision';
import type { Car, Obstacle, CanvasMetrics } from '@/game/types';
import { CAR } from '@/game/constants';

const metrics: CanvasMetrics = {
  width: 400,
  height: 711,
  laneWidth: 80,
  roadLeft: 40,
  roadWidth: 320,
};

function makeCar(lane: number): Car {
  return {
    lane,
    targetLane: lane,
    tweenProgress: 1,
    lives: 3,
    isInvincible: false,
    invincibilityTimer: 0,
  };
}

function makeObstacle(lane: number, y: number, type: Obstacle['type'] = 'POTHOLE'): Obstacle {
  return {
    type,
    lane,
    y,
    id: 'test',
    hasWarned: false,
    hasCollided: false,
  };
}

describe('Collision', () => {
  test('detects collision when car and obstacle overlap', () => {
    const car = makeCar(1);
    const carY = metrics.height * CAR.Y_POSITION_PERCENT;
    const obstacle = makeObstacle(1, carY);
    expect(checkCollision(car, obstacle, metrics)).toBe(true);
  });

  test('no collision when in different lanes', () => {
    const car = makeCar(0);
    const carY = metrics.height * CAR.Y_POSITION_PERCENT;
    const obstacle = makeObstacle(2, carY);
    expect(checkCollision(car, obstacle, metrics)).toBe(false);
  });

  test('no collision when obstacle is far above car', () => {
    const car = makeCar(1);
    const obstacle = makeObstacle(1, 50);
    expect(checkCollision(car, obstacle, metrics)).toBe(false);
  });

  test('detects collision for all obstacle types', () => {
    const car = makeCar(2);
    const carY = metrics.height * CAR.Y_POSITION_PERCENT;
    const types: Obstacle['type'][] = ['POTHOLE', 'TUMBLEWEED', 'SPEED_BUMP', 'SPEED_CAMERA', 'OIL_SLICK'];

    for (const type of types) {
      const obstacle = makeObstacle(2, carY, type);
      expect(checkCollision(car, obstacle, metrics)).toBe(true);
    }
  });
});
