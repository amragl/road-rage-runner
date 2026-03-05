import { OBSTACLES, CAR } from './constants';
import type { Warning, GameData, CanvasMetrics, ObstacleType } from './types';

const WARNING_LABELS: Record<ObstacleType, string> = {
  POTHOLE: 'POTHOLE',
  TUMBLEWEED: 'TUMBLEWEED',
  SPEED_BUMP: 'SPEED BUMP',
  SPEED_CAMERA: 'SPEED CAM',
  OIL_SLICK: 'OIL SLICK',
};

function getWarningColor(type: ObstacleType): string {
  return OBSTACLES.TYPES[type].WARNING_COLOR;
}

export function updateWarnings(data: GameData, metrics: CanvasMetrics): Warning[] {
  const now = Date.now();
  const carY = metrics.height * CAR.Y_POSITION_PERCENT;
  const warnings = [...data.warnings];

  // Check each obstacle for warning generation
  for (const obstacle of data.obstacles) {
    if (obstacle.hasWarned) continue;

    // Calculate time until obstacle reaches car
    const distanceToReach = carY - obstacle.y;
    if (distanceToReach <= 0) continue;

    const framesNeeded = distanceToReach / Math.max(data.speed, 1);
    const timeToReach = framesNeeded * 16.67; // approximate ms

    if (timeToReach <= OBSTACLES.WARNING_LEAD_TIME_MS) {
      // Mark obstacle as warned
      obstacle.hasWarned = true;

      // Don't add duplicate warnings
      if (!warnings.some((w) => w.obstacleId === obstacle.id)) {
        warnings.push({
          obstacleId: obstacle.id,
          lane: obstacle.lane,
          type: obstacle.type,
          startTime: now,
          opacity: 0,
        });
      }
    }
  }

  // Update warning opacities and remove old ones
  return warnings
    .map((w) => {
      const age = now - w.startTime;
      const totalDuration = OBSTACLES.WARNING_LEAD_TIME_MS + OBSTACLES.WARNING_FADE_OUT_MS;
      let opacity: number;

      if (age < OBSTACLES.WARNING_FADE_IN_MS) {
        // Fade in
        opacity = age / OBSTACLES.WARNING_FADE_IN_MS;
      } else if (age < OBSTACLES.WARNING_LEAD_TIME_MS) {
        // Pulse
        const pulsePhase = ((age - OBSTACLES.WARNING_FADE_IN_MS) / 400) % 1;
        opacity = 0.7 + 0.3 * Math.sin(pulsePhase * Math.PI * 2);
      } else if (age < totalDuration) {
        // Fade out
        const fadeProgress = (age - OBSTACLES.WARNING_LEAD_TIME_MS) / OBSTACLES.WARNING_FADE_OUT_MS;
        opacity = 1 - fadeProgress;
      } else {
        opacity = 0;
      }

      return { ...w, opacity };
    })
    .filter((w) => w.opacity > 0);
}

export function drawWarnings(
  ctx: CanvasRenderingContext2D,
  warnings: Warning[],
  metrics: CanvasMetrics
): void {
  for (const warning of warnings) {
    drawWarning(ctx, warning, metrics);
  }
}

function drawWarning(
  ctx: CanvasRenderingContext2D,
  warning: Warning,
  metrics: CanvasMetrics
): void {
  const { laneWidth, roadLeft } = metrics;
  const laneCenter = roadLeft + warning.lane * laneWidth + laneWidth / 2;
  const bannerY = 30;
  const bannerWidth = laneWidth * 0.95;
  const bannerHeight = 28;
  const color = getWarningColor(warning.type);

  ctx.save();
  ctx.globalAlpha = warning.opacity;

  // Banner background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(
    laneCenter - bannerWidth / 2,
    bannerY - bannerHeight / 2,
    bannerWidth,
    bannerHeight,
    4
  );
  ctx.fill();

  // Colored border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(
    laneCenter - bannerWidth / 2,
    bannerY - bannerHeight / 2,
    bannerWidth,
    bannerHeight,
    4
  );
  ctx.stroke();

  // Warning text
  ctx.fillStyle = color;
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`⚠ ${WARNING_LABELS[warning.type]}`, laneCenter, bannerY);

  // Lane highlight
  ctx.fillStyle = color;
  ctx.globalAlpha = warning.opacity * 0.08;
  ctx.fillRect(
    roadLeft + warning.lane * laneWidth,
    0,
    laneWidth,
    metrics.height
  );

  ctx.restore();
}
