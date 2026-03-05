# Game Design Document — Road Rage Runner

## 1. Core Loop

```
START → Drive → Dodge Obstacles → Score Accumulates → Speed Increases → Game Over → Submit Score → Repeat
```

The game is an **infinite runner** (driving variant). There is no win condition — the goal is to survive as long as possible and maximize score.

## 2. Road Geometry

```
Canvas Layout (portrait 9:16):

┌─────────────────────────────┐
│         SKY / BG            │
├─────────────────────────────┤
│  ║  Lane 1 │ Lane 2 │ Lane 3 │ Lane 4  ║  │
│  ║         │        │        │         ║  │
│  ║    ○    │        │   ▬    │         ║  │  ← obstacles scroll down
│  ║         │        │        │         ║  │
│  ║         │        │        │         ║  │
│  ║         │  [CAR] │        │         ║  │  ← car fixed near bottom
│  ║         │        │        │         ║  │
├─────────────────────────────┤
│         HUD OVERLAY         │
└─────────────────────────────┘
```

### Measurements (relative to canvas width)
- Road width: 80% of canvas width
- Road margin: 10% each side (grass/dirt)
- Lane width: road width / 4
- Lane dividers: 2px dashed white, 60px dash, 40px gap
- Road edges: 3px solid white
- Car width: lane width × 0.6
- Car height: car width × 2

## 3. Obstacle Deep Dive

### 3.1 Pothole
- **Shape**: Irregular dark circle/ellipse with cracked edge detail
- **Size**: ~60% of lane width
- **Color**: Dark grey (#333) with black center, lighter cracked edges
- **Animation**: Static (no animation needed)
- **Spawn frequency weight**: 30% (most common)
- **Effect**: Instant — lose 1 life, brief screen shake
- **Strategy**: Pure dodge obstacle, the bread-and-butter threat

### 3.2 Tumbleweed
- **Shape**: Circle with irregular spiky/bushy edges
- **Size**: ~50% of lane width
- **Color**: Sandy brown (#C4A265) with darker brown details
- **Animation**: Rotates as it scrolls down, slight lateral wobble (±5px sine wave)
- **Spawn frequency weight**: 20%
- **Effect**: Pushes car 1 lane in random direction. If car is in edge lane (1 or 4) and pushed outward → counts as crash (lose 1 life)
- **Strategy**: Unpredictable — player must consider which lane is safer

### 3.3 Speed Bump
- **Shape**: Horizontal rectangle spanning 80% of lane width, with yellow/black chevron stripes
- **Size**: Lane width × 0.8 wide, 15px tall
- **Color**: Yellow (#FFD600) and black alternating stripes
- **Animation**: None (static stripe pattern)
- **Spawn frequency weight**: 20%
- **Effect**: Reduces current speed by 40% for 2 seconds. Stacks with multiple bumps (but minimum speed floor of 2 px/frame). HUD shows "SLOW" indicator.
- **Strategy**: Sometimes beneficial — gives player breathing room at high speeds. Can be deliberately hit.

### 3.4 Speed Camera
- **Shape**: Vertical pole with box on top, small flash circle
- **Size**: Pole 8px wide × 40px tall, box 25px × 20px on top
- **Color**: Grey pole, dark box, red/white camera lens
- **Animation**: Flash blinks when car passes (white circle pulse)
- **Spawn frequency weight**: 15% (increases after 30 seconds)
- **Speed threshold**: 8 px/frame (displayed as ~120 km/h in HUD)
- **Effect**:
  - Speed > threshold when passing: -1 life + flash animation + "BUSTED!" text
  - Speed ≤ threshold: +100 bonus points + "SAFE ✓" text
- **Strategy**: Risk/reward — player might hit speed bumps deliberately before cameras

### 3.5 Oil Slick
- **Shape**: Irregular blob/puddle shape
- **Size**: ~70% of lane width
- **Color**: Dark base with rainbow iridescent shimmer (animated hue shift)
- **Animation**: Subtle color shimmer cycling through rainbow on dark base
- **Spawn frequency weight**: 15%
- **Effect**: Disables lane changing for 1.5 seconds. Car "slides" — visual wobble effect. HUD shows "SLICK" indicator with countdown.
- **Strategy**: Most dangerous when combined with other obstacles ahead. The warning system becomes critical.

## 4. Warning System Detail

```
Warning Lifecycle:

T-2.0s: Warning APPEARS at top of obstacle's lane
        → Fade in (0.2s) → icon + text + lane highlight
T-1.5s: Warning PULSES (opacity oscillation)
T-0.5s: Warning starts FADING OUT
T-0.0s: Obstacle reaches car's Y position
T+0.2s: Warning REMOVED from display
```

### Visual Design
- Warning banner: semi-transparent dark background with colored border
- Border color matches obstacle type:
  - Pothole: Red (#FF3333)
  - Tumbleweed: Orange (#FF9933)
  - Speed Bump: Yellow (#FFD600)
  - Speed Camera: Blue (#3399FF)
  - Oil Slick: Purple (#9933FF)
- Lane highlight: subtle colored overlay on the warned lane
- Text format: "⚠ [OBSTACLE NAME]" in bold monospace

### Multiple Warnings
- Stack vertically if multiple warnings active
- Each warning independently tracks its lifecycle
- Maximum 3 simultaneous warnings on screen

## 5. Difficulty Curve

| Time | Speed (px/frame) | Obstacle Gap (min seconds) | Max Simultaneous | Obstacle Pool |
|------|------------------|---------------------------|------------------|---------------|
| 0-15s | 3.0 → 4.8 | 2.0s | 1 | Pothole, Tumbleweed |
| 15-30s | 4.8 → 6.6 | 1.8s | 2 | + Speed Bump |
| 30-60s | 6.6 → 9.6 | 1.5s | 2 | + Speed Camera |
| 60s+ | 9.6 → 15.0 (cap) | 1.2s | 3 | + Oil Slick (all types) |

## 6. Scoring Formula

```typescript
// Per frame:
distanceTravelled += currentSpeed;
timeAlive += deltaTime;

// On game over:
finalScore = Math.floor(distanceTravelled * timeAlive * 0.1) + bonusPoints;
```

### Bonus Points
- Speed camera passed safely: +100
- Survive 30 seconds without damage: +200 (one-time)
- Survive 60 seconds without damage: +500 (one-time)

## 7. Game States

```
MENU → PLAYING → PAUSED → GAME_OVER → SUBMITTING_SCORE → MENU
                    ↑          ↓
                    └──────────┘ (retry)
```

### State Transitions
- MENU → PLAYING: "Start Game" button or spacebar
- PLAYING → PAUSED: Escape key or pause button (mobile)
- PAUSED → PLAYING: Resume button or Escape
- PLAYING → GAME_OVER: Lives reach 0
- GAME_OVER → SUBMITTING_SCORE: Player enters name (if top 10 eligible)
- GAME_OVER/SUBMITTING_SCORE → MENU: "Back to Menu" button
- GAME_OVER → PLAYING: "Retry" button

## 8. Input Mapping

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move Left | ← or A | Swipe left or tap left half |
| Move Right | → or D | Swipe right or tap right half |
| Pause | Escape | Pause button (top-right) |
| Start/Retry | Space or Enter | Tap "Start"/"Retry" button |

### Input Buffering
- Lane changes queue if input received during an active tween
- Maximum 1 buffered input
- Buffered input executes immediately when current tween completes

## 9. Visual Effects

### Collision Effects
- **Screen shake**: 5px amplitude, 300ms duration, decaying sine wave
- **Flash**: Car sprite flashes white 3× over 200ms
- **Invincibility**: Car sprite opacity pulses (0.3 ↔ 1.0) for 1.5s after hit

### Speed Effects
- **Speed lines**: Vertical streaks in road margins, opacity scales with speed
- **Road blur**: Lane markings stretch vertically at high speeds
- **Vignette**: Screen edges darken slightly at very high speeds

### Ambient
- **Lane marking scroll**: Dashed lines scroll smoothly with road
- **Grass scroll**: Side areas scroll at 80% of road speed (parallax)
- **Particle dust**: Small dots drift upward from road edges
