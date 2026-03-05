import { CANVAS, COLORS } from './constants';
import type { CanvasMetrics } from './types';

export function getCanvasMetrics(width: number, height: number): CanvasMetrics {
  const roadWidth = width * CANVAS.ROAD_WIDTH_PERCENT;
  const roadLeft = width * CANVAS.ROAD_MARGIN_PERCENT;
  const laneWidth = roadWidth / CANVAS.LANE_COUNT;
  return { width, height, laneWidth, roadLeft, roadWidth };
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  scrollOffset: number
): void {
  const { width, height, laneWidth, roadLeft, roadWidth } = metrics;

  // Draw grass/dirt margins
  ctx.fillStyle = COLORS.GRASS;
  ctx.fillRect(0, 0, roadLeft, height);
  ctx.fillRect(roadLeft + roadWidth, 0, width - roadLeft - roadWidth, height);

  // Draw road surface
  ctx.fillStyle = COLORS.ROAD;
  ctx.fillRect(roadLeft, 0, roadWidth, height);

  // Draw road edge lines (solid white)
  ctx.strokeStyle = COLORS.ROAD_EDGE;
  ctx.lineWidth = CANVAS.ROAD_EDGE_WIDTH;

  ctx.beginPath();
  ctx.moveTo(roadLeft, 0);
  ctx.lineTo(roadLeft, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(roadLeft + roadWidth, 0);
  ctx.lineTo(roadLeft + roadWidth, height);
  ctx.stroke();

  // Draw lane dividers (dashed white lines)
  ctx.strokeStyle = COLORS.LANE_DIVIDER;
  ctx.lineWidth = CANVAS.LANE_DIVIDER_WIDTH;
  ctx.setLineDash([CANVAS.LANE_DIVIDER_DASH, CANVAS.LANE_DIVIDER_GAP]);

  const dashTotal = CANVAS.LANE_DIVIDER_DASH + CANVAS.LANE_DIVIDER_GAP;
  const dashOffset = -(scrollOffset % dashTotal);
  ctx.lineDashOffset = dashOffset;

  for (let i = 1; i < CANVAS.LANE_COUNT; i++) {
    const x = roadLeft + i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Reset line dash
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
}

export function getLaneX(lane: number, metrics: CanvasMetrics): number {
  return metrics.roadLeft + lane * metrics.laneWidth + metrics.laneWidth / 2;
}
