# Game Constants Reference

All tuning values for the game. These go in `src/game/constants.ts`.
Every number in the game logic MUST reference a constant — no magic numbers.

## Canvas & Layout

```typescript
export const CANVAS = {
  ASPECT_RATIO: 9 / 16,          // Portrait mobile-first
  MIN_WIDTH: 320,
  MAX_WIDTH: 450,
  ROAD_WIDTH_PERCENT: 0.80,       // 80% of canvas width
  ROAD_MARGIN_PERCENT: 0.10,      // 10% each side
  LANE_COUNT: 4,
  LANE_DIVIDER_WIDTH: 2,
  LANE_DIVIDER_DASH: 60,
  LANE_DIVIDER_GAP: 40,
  ROAD_EDGE_WIDTH: 3,
} as const;
```

## Car

```typescript
export const CAR = {
  WIDTH_RATIO: 0.6,               // Relative to lane width
  HEIGHT_RATIO: 2.0,              // Relative to car width
  Y_POSITION_PERCENT: 0.78,       // From top (near bottom)
  LANE_CHANGE_DURATION_MS: 200,
  INVINCIBILITY_DURATION_MS: 1500,
  FLASH_INTERVAL_MS: 100,
  STARTING_LANE: 1,               // 0-indexed, so lane 2
  STARTING_LIVES: 3,
} as const;
```

## Speed & Movement

```typescript
export const SPEED = {
  INITIAL: 3,                     // px/frame
  ACCELERATION: 0.002,            // px/frame per frame
  MAX: 15,                        // px/frame cap
  MIN_FLOOR: 2,                   // Minimum speed (even with debuffs)
  SPEED_BUMP_REDUCTION: 0.4,      // 40% reduction
  SPEED_BUMP_DURATION_MS: 2000,
  CAMERA_THRESHOLD: 8,            // px/frame — above this = speeding
  DISPLAY_MULTIPLIER: 15,         // px/frame → "km/h" for display
} as const;
```

## Obstacles

```typescript
export const OBSTACLES = {
  MIN_GAP_BASE_MS: 2000,          // Minimum time between spawns at start
  MIN_GAP_MIN_MS: 1200,           // Minimum gap floor at max difficulty
  GAP_REDUCTION_PER_SECOND: 10,   // ms reduction per second of game time
  MAX_ON_SCREEN: 3,
  WARNING_LEAD_TIME_MS: 2000,     // Warning appears 2s before arrival
  WARNING_FADE_IN_MS: 200,
  WARNING_FADE_OUT_MS: 500,
  SAME_LANE_MIN_DISTANCE: 300,    // Min px between obstacles in same lane

  TYPES: {
    POTHOLE: {
      SIZE_RATIO: 0.6,            // Relative to lane width
      SPAWN_WEIGHT: 30,
      COLOR: '#333333',
      WARNING_COLOR: '#FF3333',
    },
    TUMBLEWEED: {
      SIZE_RATIO: 0.5,
      SPAWN_WEIGHT: 20,
      COLOR: '#C4A265',
      WARNING_COLOR: '#FF9933',
      ROTATION_SPEED: 0.05,       // radians per frame
      WOBBLE_AMPLITUDE: 5,        // px
      WOBBLE_FREQUENCY: 0.03,
      PUSH_DIRECTION: 'random',   // 'left' | 'right' | 'random'
    },
    SPEED_BUMP: {
      WIDTH_RATIO: 0.8,
      HEIGHT: 15,
      SPAWN_WEIGHT: 20,
      COLOR: '#FFD600',
      WARNING_COLOR: '#FFD600',
    },
    SPEED_CAMERA: {
      POLE_WIDTH: 8,
      POLE_HEIGHT: 40,
      BOX_WIDTH: 25,
      BOX_HEIGHT: 20,
      SPAWN_WEIGHT: 15,
      COLOR: '#888888',
      WARNING_COLOR: '#3399FF',
      FLASH_DURATION_MS: 300,
      BONUS_POINTS: 100,
    },
    OIL_SLICK: {
      SIZE_RATIO: 0.7,
      SPAWN_WEIGHT: 15,
      COLOR: '#1a1a2e',
      WARNING_COLOR: '#9933FF',
      DISABLE_DURATION_MS: 1500,
      SHIMMER_SPEED: 0.02,
    },
  },
} as const;

// Difficulty phases — which obstacles unlock when
export const DIFFICULTY_PHASES = [
  { timeThreshold: 0,  types: ['POTHOLE', 'TUMBLEWEED'], maxSimultaneous: 1 },
  { timeThreshold: 15, types: ['POTHOLE', 'TUMBLEWEED', 'SPEED_BUMP'], maxSimultaneous: 2 },
  { timeThreshold: 30, types: ['POTHOLE', 'TUMBLEWEED', 'SPEED_BUMP', 'SPEED_CAMERA'], maxSimultaneous: 2 },
  { timeThreshold: 60, types: ['POTHOLE', 'TUMBLEWEED', 'SPEED_BUMP', 'SPEED_CAMERA', 'OIL_SLICK'], maxSimultaneous: 3 },
] as const;
```

## Scoring

```typescript
export const SCORING = {
  DISTANCE_TIME_MULTIPLIER: 0.1,
  CAMERA_BONUS: 100,
  SURVIVAL_BONUS_30S: 200,
  SURVIVAL_BONUS_60S: 500,
  MAX_SCORE: 999999,
  NAME_MAX_LENGTH: 12,
  NAME_PATTERN: /^[a-zA-Z0-9 ]+$/,
} as const;
```

## Effects

```typescript
export const EFFECTS = {
  SCREEN_SHAKE_AMPLITUDE: 5,
  SCREEN_SHAKE_DURATION_MS: 300,
  SPEED_LINE_OPACITY_SCALE: 0.1,  // Multiplied by speed
  PARALLAX_GRASS_SPEED_RATIO: 0.8,
} as const;
```

## Colors

```typescript
export const COLORS = {
  ROAD: '#2a2a2a',
  ROAD_EDGE: '#ffffff',
  LANE_DIVIDER: '#ffffff',
  GRASS: '#1a3d1a',
  CAR_BODY: '#FF3333',
  CAR_WINDSHIELD: '#87CEEB',
  CAR_WHEELS: '#1a1a1a',
  HUD_TEXT: '#ffffff',
  HUD_SCORE: '#00E5FF',
  HUD_SPEED: '#FFD600',
  HUD_LIVES: '#FF006E',
  WARNING_BG: 'rgba(0, 0, 0, 0.7)',
  NEON_CYAN: '#00E5FF',
  NEON_MAGENTA: '#FF006E',
  NEON_YELLOW: '#FFD600',
} as const;
```
