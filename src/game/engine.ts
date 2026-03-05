import { CAR, SPEED, EFFECTS, OBSTACLES } from './constants';
import { createCar, updateCar } from './car';
import { trySpawnObstacle, updateObstacles } from './obstacles';
import { checkCollision } from './collision';
import type { GameData, InputAction, CanvasMetrics, ActiveEffect } from './types';

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
  input: InputAction | null,
  metrics?: CanvasMetrics | null
): GameData {
  if (data.gameState !== 'PLAYING') return data;

  const updated = { ...data };
  const now = Date.now();

  // Update time (deltaTime is in ms, time is in seconds)
  updated.time += deltaTime / 1000;

  // Check for active speed effects
  const hasSpeedBump = updated.effects.some(
    (e) => e.type === 'SPEED_BUMP' && now - e.startTime < e.duration
  );

  // Speed acceleration
  updated.speed += SPEED.ACCELERATION * (deltaTime / 16.67);
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
    (e) => e.type === 'OIL_SLICK' && now - e.startTime < e.duration
  );

  // Update car (disable input if oil slick active)
  updated.car = updateCar(
    updated.car,
    hasOilSlick ? null : input,
    deltaTime
  );

  // Spawn obstacles
  const newObstacle = trySpawnObstacle(updated, now);
  if (newObstacle) {
    updated.obstacles = [...updated.obstacles, newObstacle];
    updated.lastObstacleSpawnTime = now;
  }

  // Update obstacles (move down, remove off-screen)
  const canvasHeight = metrics?.height ?? 800;
  updated.obstacles = updateObstacles(
    updated.obstacles,
    effectiveSpeed,
    deltaTime,
    canvasHeight
  );

  // Collision detection
  if (metrics) {
    updated.obstacles = updated.obstacles.map((obstacle) => {
      if (obstacle.hasCollided) return obstacle;
      if (!checkCollision(updated.car, obstacle, metrics)) return obstacle;

      const collided = { ...obstacle, hasCollided: true };

      // Skip if invincible (for damage-dealing obstacles)
      const isDamaging = obstacle.type === 'POTHOLE' || obstacle.type === 'SPEED_CAMERA';
      if (updated.car.isInvincible && isDamaging) return collided;

      switch (obstacle.type) {
        case 'POTHOLE':
          applyDamage(updated, now);
          break;

        case 'TUMBLEWEED':
          applyTumbleweedPush(updated, now);
          break;

        case 'SPEED_BUMP':
          updated.effects = [
            ...updated.effects,
            {
              type: 'SPEED_BUMP',
              startTime: now,
              duration: SPEED.SPEED_BUMP_DURATION_MS,
            } as ActiveEffect,
          ];
          break;

        case 'SPEED_CAMERA':
          if (effectiveSpeed > SPEED.CAMERA_THRESHOLD) {
            applyDamage(updated, now);
          } else {
            updated.bonusPoints += OBSTACLES.TYPES.SPEED_CAMERA.BONUS_POINTS;
          }
          break;

        case 'OIL_SLICK':
          updated.effects = [
            ...updated.effects,
            {
              type: 'OIL_SLICK',
              startTime: now,
              duration: OBSTACLES.TYPES.OIL_SLICK.DISABLE_DURATION_MS,
            } as ActiveEffect,
          ];
          break;
      }

      return collided;
    });
  }

  // Clean up expired effects
  updated.effects = updated.effects.filter(
    (e) => now - e.startTime < e.duration
  );

  // Update screen shake
  if (updated.screenShake > 0) {
    updated.screenShake = Math.max(0, updated.screenShake - deltaTime);
  }

  // Check game over
  if (updated.car.lives <= 0) {
    updated.gameState = 'GAME_OVER';
  }

  return updated;
}

function applyDamage(data: GameData, now: number): void {
  if (data.car.isInvincible) return;

  data.car = {
    ...data.car,
    lives: data.car.lives - 1,
    isInvincible: true,
    invincibilityTimer: CAR.INVINCIBILITY_DURATION_MS,
  };
  data.lastDamageTime = now;
  data.screenShake = EFFECTS.SCREEN_SHAKE_DURATION_MS;
}

function applyTumbleweedPush(data: GameData, now: number): void {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const newLane = data.car.lane + direction;

  if (newLane < 0 || newLane > 3) {
    // Pushed off edge — crash
    applyDamage(data, now);
  } else {
    data.car = {
      ...data.car,
      targetLane: newLane,
      tweenProgress: 0,
    };
  }
}
