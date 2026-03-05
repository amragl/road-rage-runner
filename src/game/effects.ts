import { EFFECTS, COLORS, SPEED } from './constants';
import type { CanvasMetrics } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

let particles: Particle[] = [];

export function spawnDustParticles(metrics: CanvasMetrics, speed: number): void {
  if (Math.random() > 0.3) return;
  if (particles.length > 50) return;

  const side = Math.random() < 0.5 ? 'left' : 'right';
  const x = side === 'left'
    ? metrics.roadLeft - Math.random() * 10
    : metrics.roadLeft + metrics.roadWidth + Math.random() * 10;

  particles.push({
    x,
    y: metrics.height - Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.5,
    vy: -(speed * 0.3 + Math.random() * 0.5),
    life: 1,
    maxLife: 1,
    size: 1 + Math.random() * 2,
    color: '#8a7a5a',
  });
}

export function spawnCollisionParticles(x: number, y: number): void {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (2 + Math.random() * 3),
      vy: Math.sin(angle) * (2 + Math.random() * 3),
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? COLORS.NEON_MAGENTA : COLORS.NEON_YELLOW,
    });
  }
}

export function updateParticles(deltaTime: number): void {
  const dt = deltaTime / 16.67;
  particles = particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - 0.02 * dt,
    }))
    .filter((p) => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawSpeedLines(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  speed: number,
  scrollOffset: number
): void {
  const opacity = Math.min(speed * EFFECTS.SPEED_LINE_OPACITY_SCALE, 0.6);
  if (opacity < 0.05) return;

  ctx.save();
  ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.lineWidth = 1;

  const lineSpacing = 40;
  const lineCount = Math.ceil(metrics.height / lineSpacing) + 2;
  const offset = scrollOffset % lineSpacing;

  // Left margin speed lines
  for (let i = 0; i < lineCount; i++) {
    const y = i * lineSpacing - offset;
    const x = metrics.roadLeft - 5 - Math.random() * 15;
    const length = 10 + speed * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + length);
    ctx.stroke();
  }

  // Right margin speed lines
  for (let i = 0; i < lineCount; i++) {
    const y = i * lineSpacing - offset;
    const x = metrics.roadLeft + metrics.roadWidth + 5 + Math.random() * 15;
    const length = 10 + speed * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + length);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  metrics: CanvasMetrics,
  speed: number
): void {
  const intensity = Math.max(0, (speed - SPEED.CAMERA_THRESHOLD) / (SPEED.MAX - SPEED.CAMERA_THRESHOLD));
  if (intensity < 0.05) return;

  const gradient = ctx.createRadialGradient(
    metrics.width / 2,
    metrics.height / 2,
    metrics.height * 0.3,
    metrics.width / 2,
    metrics.height / 2,
    metrics.height * 0.7
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.4})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, metrics.width, metrics.height);
  ctx.restore();
}

export function clearParticles(): void {
  particles = [];
}
