import { OBSTACLES, DIFFICULTY_PHASES, CANVAS } from './constants';
import type { Obstacle, ObstacleType, GameData, CanvasMetrics } from './types';

let nextId = 0;

function generateId(): string {
  return `obs_${nextId++}`;
}

function getDifficultyPhase(time: number): (typeof DIFFICULTY_PHASES)[number] {
  let phase: (typeof DIFFICULTY_PHASES)[number] = DIFFICULTY_PHASES[0];
  for (const p of DIFFICULTY_PHASES) {
    if (time >= p.timeThreshold) {
      phase = p;
    }
  }
  return phase;
}

function getMinGap(time: number): number {
  const gap = OBSTACLES.MIN_GAP_BASE_MS - time * OBSTACLES.GAP_REDUCTION_PER_SECOND;
  return Math.max(gap, OBSTACLES.MIN_GAP_MIN_MS);
}

function weightedRandom(types: readonly string[]): ObstacleType {
  const typeConfigs = types.map((t) => ({
    type: t as ObstacleType,
    weight: OBSTACLES.TYPES[t as keyof typeof OBSTACLES.TYPES].SPAWN_WEIGHT,
  }));

  const totalWeight = typeConfigs.reduce((sum, tc) => sum + tc.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const tc of typeConfigs) {
    roll -= tc.weight;
    if (roll <= 0) return tc.type;
  }

  return typeConfigs[typeConfigs.length - 1].type;
}

function pickLane(obstacles: Obstacle[]): number {
  const lane = Math.floor(Math.random() * CANVAS.LANE_COUNT);

  // Check for same-lane proximity
  const tooClose = obstacles.some(
    (o) =>
      o.lane === lane &&
      o.y < OBSTACLES.SAME_LANE_MIN_DISTANCE &&
      o.y > -100
  );

  if (tooClose) {
    // Try another lane
    const alternatives = [0, 1, 2, 3].filter((l) => l !== lane);
    for (const alt of alternatives) {
      const altTooClose = obstacles.some(
        (o) =>
          o.lane === alt &&
          o.y < OBSTACLES.SAME_LANE_MIN_DISTANCE &&
          o.y > -100
      );
      if (!altTooClose) return alt;
    }
  }

  return lane;
}

export function trySpawnObstacle(data: GameData, now: number): Obstacle | null {
  const phase = getDifficultyPhase(data.time);

  // Check max on screen
  if (data.obstacles.length >= phase.maxSimultaneous) return null;

  // Check minimum gap
  const minGap = getMinGap(data.time);
  if (now - data.lastObstacleSpawnTime < minGap) return null;

  // Pick type and lane
  const type = weightedRandom(phase.types);
  const lane = pickLane(data.obstacles);

  return {
    type,
    lane,
    y: -60, // Spawn above canvas
    id: generateId(),
    hasWarned: false,
    hasCollided: false,
    rotation: type === 'TUMBLEWEED' ? 0 : undefined,
    wobbleOffset: type === 'TUMBLEWEED' ? 0 : undefined,
  };
}

export function updateObstacles(
  obstacles: Obstacle[],
  speed: number,
  deltaTime: number,
  canvasHeight: number
): Obstacle[] {
  const frameSpeed = speed * (deltaTime / 16.67);

  return obstacles
    .map((o) => {
      const updated = { ...o, y: o.y + frameSpeed };

      // Update tumbleweed rotation and wobble
      if (updated.type === 'TUMBLEWEED') {
        const tumbleConfig = OBSTACLES.TYPES.TUMBLEWEED;
        updated.rotation = (updated.rotation ?? 0) + tumbleConfig.ROTATION_SPEED * (deltaTime / 16.67);
        updated.wobbleOffset = Math.sin((updated.y ?? 0) * tumbleConfig.WOBBLE_FREQUENCY) * tumbleConfig.WOBBLE_AMPLITUDE;
      }

      return updated;
    })
    .filter((o) => o.y < canvasHeight + 100); // Remove off-screen
}

export function drawObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: Obstacle,
  metrics: CanvasMetrics
): void {
  const { laneWidth, roadLeft } = metrics;
  const centerX = roadLeft + obstacle.lane * laneWidth + laneWidth / 2;
  const centerY = obstacle.y;

  switch (obstacle.type) {
    case 'POTHOLE':
      drawPothole(ctx, centerX, centerY, laneWidth);
      break;
    case 'TUMBLEWEED':
      drawTumbleweed(ctx, centerX + (obstacle.wobbleOffset ?? 0), centerY, laneWidth, obstacle.rotation ?? 0);
      break;
    case 'SPEED_BUMP':
      drawSpeedBump(ctx, centerX, centerY, laneWidth);
      break;
    case 'SPEED_CAMERA':
      drawSpeedCamera(ctx, centerX, centerY);
      break;
    case 'OIL_SLICK':
      drawOilSlick(ctx, centerX, centerY, laneWidth);
      break;
  }
}

function drawPothole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  laneWidth: number
): void {
  const size = laneWidth * OBSTACLES.TYPES.POTHOLE.SIZE_RATIO;
  const radius = size / 2;

  // Outer cracked edge
  ctx.beginPath();
  ctx.ellipse(x, y, radius + 3, radius * 0.8 + 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#555555';
  ctx.fill();

  // Main pothole
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = OBSTACLES.TYPES.POTHOLE.COLOR;
  ctx.fill();

  // Dark center
  ctx.beginPath();
  ctx.ellipse(x, y, radius * 0.5, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111111';
  ctx.fill();
}

function drawTumbleweed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  laneWidth: number,
  rotation: number
): void {
  const size = laneWidth * OBSTACLES.TYPES.TUMBLEWEED.SIZE_RATIO;
  const radius = size / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Main body
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = OBSTACLES.TYPES.TUMBLEWEED.COLOR;
  ctx.fill();

  // Spiky details
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.4, Math.sin(angle) * radius * 0.4);
    ctx.lineTo(Math.cos(angle) * radius * 0.95, Math.sin(angle) * radius * 0.95);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSpeedBump(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  laneWidth: number
): void {
  const width = laneWidth * OBSTACLES.TYPES.SPEED_BUMP.WIDTH_RATIO;
  const height = OBSTACLES.TYPES.SPEED_BUMP.HEIGHT;
  const stripeCount = 6;
  const stripeWidth = width / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? OBSTACLES.TYPES.SPEED_BUMP.COLOR : '#1a1a1a';
    ctx.fillRect(x - width / 2 + i * stripeWidth, y - height / 2, stripeWidth, height);
  }

  // Rounded top
  ctx.beginPath();
  ctx.ellipse(x, y - height / 2, width / 2, 3, 0, Math.PI, 0);
  ctx.fillStyle = '#FFE066';
  ctx.fill();
}

function drawSpeedCamera(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  const cfg = OBSTACLES.TYPES.SPEED_CAMERA;

  // Pole
  ctx.fillStyle = cfg.COLOR;
  ctx.fillRect(x - cfg.POLE_WIDTH / 2, y - cfg.POLE_HEIGHT / 2, cfg.POLE_WIDTH, cfg.POLE_HEIGHT);

  // Box on top
  ctx.fillStyle = '#333333';
  ctx.fillRect(
    x - cfg.BOX_WIDTH / 2,
    y - cfg.POLE_HEIGHT / 2 - cfg.BOX_HEIGHT,
    cfg.BOX_WIDTH,
    cfg.BOX_HEIGHT
  );

  // Lens
  ctx.beginPath();
  ctx.arc(x, y - cfg.POLE_HEIGHT / 2 - cfg.BOX_HEIGHT / 2, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#FF3333';
  ctx.fill();

  // Lens highlight
  ctx.beginPath();
  ctx.arc(x - 1, y - cfg.POLE_HEIGHT / 2 - cfg.BOX_HEIGHT / 2 - 1, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawOilSlick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  laneWidth: number
): void {
  const size = laneWidth * OBSTACLES.TYPES.OIL_SLICK.SIZE_RATIO;
  const radius = size / 2;

  // Dark base
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = OBSTACLES.TYPES.OIL_SLICK.COLOR;
  ctx.fill();

  // Rainbow shimmer (animated via time-based hue)
  const hue = (Date.now() * OBSTACLES.TYPES.OIL_SLICK.SHIMMER_SPEED * 360) % 360;
  ctx.beginPath();
  ctx.ellipse(x + 3, y - 2, radius * 0.6, radius * 0.4, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x - 5, y + 3, radius * 0.4, radius * 0.3, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${(hue + 120) % 360}, 70%, 50%, 0.25)`;
  ctx.fill();
}

export function resetObstacleIdCounter(): void {
  nextId = 0;
}
