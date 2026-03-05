import { CAR, SPEED } from './constants';
import { createCar, updateCar } from './car';
import type { GameData, InputAction } from './types';

export function initGameData(): GameData {
  return {
    car: createCar(),
    obstacles: [],
    warnings: [],
    effects: [],
    speed: SPEED.INITIAL,
    distance: 0,
    time: 0,
    score: 0,
    bonusPoints: 0,
    gameState: 'MENU',
    scrollOffset: 0,
    lastObstacleSpawnTime: 0,
    lastDamageTime: -CAR.INVINCIBILITY_DURATION_MS,
    screenShake: 0,
    topSpeed: SPEED.INITIAL,
    survivalBonus30s: false,
    survivalBonus60s: false,
  };
}

export function updateGame(
  data: GameData,
  deltaTime: number,
  input: InputAction | null
): GameData {
  if (data.gameState !== 'PLAYING') return data;

  const updated = { ...data };

  // Update time (deltaTime is in ms, time is in seconds)
  updated.time += deltaTime / 1000;

  // Check for active speed effects
  const hasSpeedBump = updated.effects.some(
    (e) => e.type === 'SPEED_BUMP' && Date.now() - e.startTime < e.duration
  );

  // Speed acceleration
  updated.speed += SPEED.ACCELERATION * (deltaTime / 16.67); // normalize to ~60fps
  if (updated.speed > SPEED.MAX) {
    updated.speed = SPEED.MAX;
  }

  // Apply effective speed (with debuffs)
  let effectiveSpeed = updated.speed;
  if (hasSpeedBump) {
    effectiveSpeed *= 1 - SPEED.SPEED_BUMP_REDUCTION;
  }
  if (effectiveSpeed < SPEED.MIN_FLOOR) {
    effectiveSpeed = SPEED.MIN_FLOOR;
  }

  // Track top speed
  if (effectiveSpeed > updated.topSpeed) {
    updated.topSpeed = effectiveSpeed;
  }

  // Update distance and scroll
  const frameDistance = effectiveSpeed * (deltaTime / 16.67);
  updated.distance += frameDistance;
  updated.scrollOffset += frameDistance;

  // Check oil slick effect for lane change disable
  const hasOilSlick = updated.effects.some(
    (e) => e.type === 'OIL_SLICK' && Date.now() - e.startTime < e.duration
  );

  // Update car (disable input if oil slick active)
  updated.car = updateCar(
    updated.car,
    hasOilSlick ? null : input,
    deltaTime
  );

  // Clean up expired effects
  updated.effects = updated.effects.filter(
    (e) => Date.now() - e.startTime < e.duration
  );

  // Update screen shake
  if (updated.screenShake > 0) {
    updated.screenShake = Math.max(0, updated.screenShake - deltaTime);
  }

  return updated;
}
