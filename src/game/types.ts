export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'SUBMITTING_SCORE';

export interface Position {
  x: number;
  y: number;
}

export interface Car {
  lane: number;
  targetLane: number;
  tweenProgress: number;
  lives: number;
  isInvincible: boolean;
  invincibilityTimer: number;
}

export type ObstacleType = 'POTHOLE' | 'TUMBLEWEED' | 'SPEED_BUMP' | 'SPEED_CAMERA' | 'OIL_SLICK';

export interface Obstacle {
  type: ObstacleType;
  lane: number;
  y: number;
  id: string;
  hasWarned: boolean;
  hasCollided: boolean;
  rotation?: number;
  wobbleOffset?: number;
}

export interface Warning {
  obstacleId: string;
  lane: number;
  type: ObstacleType;
  startTime: number;
  opacity: number;
}

export interface ActiveEffect {
  type: 'SPEED_BUMP' | 'OIL_SLICK';
  startTime: number;
  duration: number;
}

export interface GameData {
  car: Car;
  obstacles: Obstacle[];
  warnings: Warning[];
  effects: ActiveEffect[];
  speed: number;
  distance: number;
  time: number;
  score: number;
  bonusPoints: number;
  gameState: GameState;
  scrollOffset: number;
  lastObstacleSpawnTime: number;
  lastDamageTime: number;
  screenShake: number;
  topSpeed: number;
  survivalBonus30s: boolean;
  survivalBonus60s: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

export interface CanvasMetrics {
  width: number;
  height: number;
  laneWidth: number;
  roadLeft: number;
  roadWidth: number;
}

export type InputAction = 'left' | 'right';
