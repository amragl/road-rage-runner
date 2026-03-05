import { CAR, OBSTACLES } from './constants';
import type { Car, Obstacle, CanvasMetrics } from './types';
import { getCarX } from './car';

function getObstacleHitbox(obstacle: Obstacle, metrics: CanvasMetrics) {
  const { laneWidth, roadLeft } = metrics;
  const centerX = roadLeft + obstacle.lane * laneWidth + laneWidth / 2;
  const centerY = obstacle.y;

  let width: number;
  let height: number;

  switch (obstacle.type) {
    case 'POTHOLE': {
      const size = laneWidth * OBSTACLES.TYPES.POTHOLE.SIZE_RATIO;
      width = size;
      height = size * 0.8;
      break;
    }
    case 'TUMBLEWEED': {
      const size = laneWidth * OBSTACLES.TYPES.TUMBLEWEED.SIZE_RATIO;
      width = size;
      height = size;
      break;
    }
    case 'SPEED_BUMP': {
      width = laneWidth * OBSTACLES.TYPES.SPEED_BUMP.WIDTH_RATIO;
      height = OBSTACLES.TYPES.SPEED_BUMP.HEIGHT;
      break;
    }
    case 'SPEED_CAMERA': {
      width = OBSTACLES.TYPES.SPEED_CAMERA.BOX_WIDTH;
      height = OBSTACLES.TYPES.SPEED_CAMERA.POLE_HEIGHT;
      break;
    }
    case 'OIL_SLICK': {
      const size = laneWidth * OBSTACLES.TYPES.OIL_SLICK.SIZE_RATIO;
      width = size;
      height = size * 0.7;
      break;
    }
  }

  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY - height / 2,
    bottom: centerY + height / 2,
  };
}

function getCarHitbox(car: Car, metrics: CanvasMetrics) {
  const carWidth = metrics.laneWidth * CAR.WIDTH_RATIO;
  const carHeight = carWidth * CAR.HEIGHT_RATIO;
  const carX = getCarX(car, metrics);
  const carY = metrics.height * CAR.Y_POSITION_PERCENT;

  // Slightly smaller hitbox for forgiveness (80%)
  const hitWidth = carWidth * 0.8;
  const hitHeight = carHeight * 0.8;

  return {
    left: carX - hitWidth / 2,
    right: carX + hitWidth / 2,
    top: carY - hitHeight / 2,
    bottom: carY + hitHeight / 2,
  };
}

export function checkCollision(
  car: Car,
  obstacle: Obstacle,
  metrics: CanvasMetrics
): boolean {
  const carBox = getCarHitbox(car, metrics);
  const obsBox = getObstacleHitbox(obstacle, metrics);

  return (
    carBox.left < obsBox.right &&
    carBox.right > obsBox.left &&
    carBox.top < obsBox.bottom &&
    carBox.bottom > obsBox.top
  );
}
