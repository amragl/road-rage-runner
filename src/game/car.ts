import { CAR, COLORS } from './constants';
import type { Car, CanvasMetrics, InputAction } from './types';
import { getLaneX } from './road';

export function createCar(): Car {
  return {
    lane: CAR.STARTING_LANE,
    targetLane: CAR.STARTING_LANE,
    tweenProgress: 1,
    lives: CAR.STARTING_LIVES,
    isInvincible: false,
    invincibilityTimer: 0,
  };
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function updateCar(
  car: Car,
  input: InputAction | null,
  deltaTime: number
): Car {
  const updated = { ...car };

  // Process tween
  if (updated.tweenProgress < 1) {
    updated.tweenProgress += deltaTime / CAR.LANE_CHANGE_DURATION_MS;
    if (updated.tweenProgress >= 1) {
      updated.tweenProgress = 1;
      updated.lane = updated.targetLane;
    }
  }

  // Process input (only when tween is complete)
  if (input && updated.tweenProgress >= 1) {
    if (input === 'left' && updated.lane > 0) {
      updated.targetLane = updated.lane - 1;
      updated.tweenProgress = 0;
    } else if (input === 'right' && updated.lane < 3) {
      updated.targetLane = updated.lane + 1;
      updated.tweenProgress = 0;
    }
  }

  // Update invincibility
  if (updated.isInvincible) {
    updated.invincibilityTimer -= deltaTime;
    if (updated.invincibilityTimer <= 0) {
      updated.isInvincible = false;
      updated.invincibilityTimer = 0;
    }
  }

  return updated;
}

export function getCarX(car: Car, metrics: CanvasMetrics): number {
  if (car.tweenProgress >= 1) {
    return getLaneX(car.lane, metrics);
  }
  const fromX = getLaneX(car.lane, metrics);
  const toX = getLaneX(car.targetLane, metrics);
  const t = easeOutQuad(car.tweenProgress);
  return fromX + (toX - fromX) * t;
}

export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: Car,
  metrics: CanvasMetrics
): void {
  const carWidth = metrics.laneWidth * CAR.WIDTH_RATIO;
  const carHeight = carWidth * CAR.HEIGHT_RATIO;
  const carX = getCarX(car, metrics);
  const carY = metrics.height * CAR.Y_POSITION_PERCENT;

  // Handle invincibility flashing
  if (car.isInvincible) {
    const flashPhase = Math.floor(car.invincibilityTimer / CAR.FLASH_INTERVAL_MS) % 2;
    ctx.globalAlpha = flashPhase === 0 ? 0.3 : 1.0;
  }

  const left = carX - carWidth / 2;
  const top = carY - carHeight / 2;

  // Car body
  ctx.fillStyle = COLORS.CAR_BODY;
  ctx.beginPath();
  ctx.roundRect(left, top, carWidth, carHeight, 4);
  ctx.fill();

  // Windshield
  const windshieldWidth = carWidth * 0.7;
  const windshieldHeight = carHeight * 0.15;
  const windshieldX = carX - windshieldWidth / 2;
  const windshieldY = top + carHeight * 0.2;
  ctx.fillStyle = COLORS.CAR_WINDSHIELD;
  ctx.beginPath();
  ctx.roundRect(windshieldX, windshieldY, windshieldWidth, windshieldHeight, 2);
  ctx.fill();

  // Wheels
  const wheelWidth = carWidth * 0.15;
  const wheelHeight = carHeight * 0.18;
  ctx.fillStyle = COLORS.CAR_WHEELS;

  // Top-left wheel
  ctx.fillRect(left - wheelWidth * 0.3, top + carHeight * 0.08, wheelWidth, wheelHeight);
  // Top-right wheel
  ctx.fillRect(left + carWidth - wheelWidth * 0.7, top + carHeight * 0.08, wheelWidth, wheelHeight);
  // Bottom-left wheel
  ctx.fillRect(left - wheelWidth * 0.3, top + carHeight * 0.74, wheelWidth, wheelHeight);
  // Bottom-right wheel
  ctx.fillRect(left + carWidth - wheelWidth * 0.7, top + carHeight * 0.74, wheelWidth, wheelHeight);

  // Rear window
  const rearWidth = carWidth * 0.5;
  const rearHeight = carHeight * 0.1;
  const rearX = carX - rearWidth / 2;
  const rearY = top + carHeight * 0.7;
  ctx.fillStyle = COLORS.CAR_WINDSHIELD;
  ctx.globalAlpha = ctx.globalAlpha * 0.7;
  ctx.beginPath();
  ctx.roundRect(rearX, rearY, rearWidth, rearHeight, 2);
  ctx.fill();

  // Reset alpha
  ctx.globalAlpha = 1.0;
}
