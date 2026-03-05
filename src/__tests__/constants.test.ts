import { describe, test, expect } from 'vitest';
import * as constants from '@/game/constants';

describe('Constants', () => {
  test('all constant groups are exported', () => {
    expect(constants.CANVAS).toBeDefined();
    expect(constants.CAR).toBeDefined();
    expect(constants.SPEED).toBeDefined();
    expect(constants.OBSTACLES).toBeDefined();
    expect(constants.SCORING).toBeDefined();
    expect(constants.EFFECTS).toBeDefined();
    expect(constants.COLORS).toBeDefined();
  });

  test('speed values are sane', () => {
    expect(constants.SPEED.INITIAL).toBeLessThan(constants.SPEED.MAX);
    expect(constants.SPEED.ACCELERATION).toBeGreaterThan(0);
    expect(constants.SPEED.MIN_FLOOR).toBeGreaterThan(0);
  });

  test('lane count is 4', () => {
    expect(constants.CANVAS.LANE_COUNT).toBe(4);
  });

  test('obstacle spawn weights sum to 100', () => {
    const types = constants.OBSTACLES.TYPES;
    const totalWeight = Object.values(types).reduce(
      (sum: number, t) => sum + t.SPAWN_WEIGHT,
      0
    );
    expect(totalWeight).toBe(100);
  });
});
