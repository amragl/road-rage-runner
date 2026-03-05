# Road Rage Runner — Claude Code Knowledge File

## Project Overview

**Road Rage Runner** is a browser-based endless driving game built with React + TypeScript, deployed on Vercel. The player controls a car on a 4-lane straight road that scrolls vertically. Speed increases over time. Obstacles appear with lane warnings. Score = time × distance. Top 10 leaderboard stored via Vercel KV (Redis).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Game Rendering | HTML5 Canvas via React ref |
| Styling | Tailwind CSS 3 |
| State | React hooks + game loop via `requestAnimationFrame` |
| Leaderboard API | Next.js Route Handlers (`/api/scores`) |
| Persistence | Vercel KV (Redis) — free tier, no auth needed for reads |
| Deployment | Vercel |
| Package Manager | pnpm |

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts + metadata
│   ├── page.tsx            # Home screen — start game / view leaderboard
│   ├── game/
│   │   └── page.tsx        # Game screen wrapper
│   └── api/
│       └── scores/
│           └── route.ts    # GET top 10 / POST new score
├── components/
│   ├── GameCanvas.tsx      # Main canvas component + game loop
│   ├── HUD.tsx             # Speed, distance, time overlay
│   ├── WarningBanner.tsx   # Lane warning overlay ("⚠ Pothole Lane 2!")
│   ├── GameOver.tsx        # Score summary + name input + submit
│   ├── Leaderboard.tsx     # Top 10 table
│   └── StartScreen.tsx     # Title + instructions + play button
├── game/
│   ├── engine.ts           # Core game loop logic (update/render cycle)
│   ├── car.ts              # Player car state + rendering
│   ├── road.ts             # Road drawing (4 lanes, lane markings, scroll)
│   ├── obstacles.ts        # Obstacle spawning, types, effects, rendering
│   ├── collision.ts        # Hit detection (AABB)
│   ├── scoring.ts          # Score calculation (time × distance factor)
│   ├── constants.ts        # All magic numbers in one place
│   └── types.ts            # Game-specific type definitions
├── hooks/
│   ├── useGameLoop.ts      # requestAnimationFrame hook
│   ├── useInput.ts         # Keyboard + touch/swipe input
│   └── useLeaderboard.ts   # Fetch/submit scores
├── lib/
│   └── kv.ts              # Vercel KV client wrapper
├── styles/
│   └── globals.css         # Tailwind base + game-specific styles
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

## Game Design Specification

### Road & Lanes

- Canvas renders a top-down straight road scrolling downward (car faces up)
- **4 lanes**, evenly spaced within the road area
- Lane markings: dashed white lines between lanes, solid white edges
- Road scrolls at `currentSpeed` pixels per frame
- Background: dark asphalt with subtle texture/grain

### Player Car

- Fixed vertical position (bottom 20% of canvas)
- Moves horizontally across 4 lanes (discrete lane positions, smooth tween)
- Controls: Left/Right arrow keys OR A/D keys OR swipe left/right on mobile
- Lane change takes ~200ms with easing
- Car sprite: top-down rectangle with colored body, windshield, wheels

### Speed & Difficulty

- **Initial speed**: 3 px/frame
- **Speed increment**: +0.002 px/frame every frame (constant acceleration)
- **Max speed cap**: 15 px/frame
- Speed temporarily modified by obstacles (speed bumps slow, etc.)
- After obstacle effect, speed returns to the natural progression

### Obstacles

Each obstacle type has unique visuals and effects:

| Obstacle | Visual | Warning Text | Effect | Duration |
|----------|--------|-------------|--------|----------|
| **Pothole** | Dark circle/crater | "⚠ POTHOLE" | Instant damage — lose 1 life | Instant |
| **Tumbleweed** | Brown rolling ball with animation | "⚠ TUMBLEWEED" | Pushes car 1 lane sideways (random direction) | Instant |
| **Speed Bump** | Yellow striped rectangle | "⚠ SPEED BUMP" | Reduces speed by 40% for 2 seconds | 2s |
| **Speed Camera** | Box with flash on pole | "⚠ SPEED CAMERA" | If speed > threshold: -1 life. If under: +100 bonus points | Instant |
| **Oil Slick** | Rainbow/dark puddle | "⚠ OIL SLICK" | Disables lane change for 1.5 seconds | 1.5s |

### Warning System

- Warnings appear **2 seconds** before obstacle reaches the car
- Warning shows at top of the lane the obstacle is in
- Format: icon + obstacle name + lane indicator
- Warning fades in, pulses, then fades out as obstacle passes
- Multiple warnings can be active simultaneously

### Obstacle Spawning

- Minimum gap between obstacles: 1.5 seconds (adjusted by speed)
- Max simultaneous obstacles on screen: 3
- Spawn probability increases with distance/time
- Obstacles spawn above the visible canvas and scroll down
- Never spawn 2 obstacles in the same lane within close vertical proximity
- Type selection: weighted random (potholes more common early, cameras later)

### Lives & Game Over

- Player starts with **3 lives** (shown as heart icons in HUD)
- Pothole hit: -1 life
- Speed camera caught speeding: -1 life
- Reaching 0 lives = Game Over
- Brief invincibility (1.5s) after losing a life (car flashes)

### Scoring

```
score = Math.floor(distanceTravelled * timeAliveSeconds * 0.1)
```

- Distance increments every frame based on current speed
- Bonus points from speed cameras (passed under limit)
- Score displayed in HUD continuously
- Final score shown on Game Over screen

### HUD (Heads-Up Display)

- **Top-left**: Score (animated counter)
- **Top-right**: Speed (as "km/h" — visual only, mapped from px/frame)
- **Top-center**: Distance ("XXX m")
- **Bottom-left**: Lives (heart icons)
- **Bottom-center**: Active effects (icons for slow, oil slick, etc.)

### Leaderboard

- Top 10 scores stored in Vercel KV
- Key: `leaderboard` → sorted set (score as rank)
- On Game Over: if score qualifies for top 10, prompt for name (max 12 chars)
- Names: alphanumeric + spaces only, no profanity filter needed
- Leaderboard viewable from start screen
- API: `GET /api/scores` returns top 10, `POST /api/scores` submits `{ name, score }`

## API Design

### `GET /api/scores`

```json
{
  "scores": [
    { "name": "Cesar", "score": 14520, "rank": 1 },
    { "name": "Player2", "score": 12300, "rank": 2 }
  ]
}
```

### `POST /api/scores`

Request:
```json
{ "name": "Cesar", "score": 14520 }
```

Response:
```json
{ "success": true, "rank": 1 }
```

Validation:
- Name: 1-12 chars, alphanumeric + spaces, trimmed
- Score: positive integer, max 999999
- Rate limit: 1 submission per 5 seconds per IP (basic)

## Visual Style

- **Aesthetic**: Retro arcade meets modern neon
- Dark background (near-black asphalt)
- Neon accent colors: cyan (#00E5FF), magenta (#FF006E), yellow (#FFD600)
- Car: bright red or player-selectable color
- Obstacles: distinct silhouettes with glow effects
- Font: monospace/pixel-style for HUD, clean sans-serif for menus
- Subtle CRT scanline overlay effect on canvas (optional, togglable)
- Particle effects for collisions

## Key Implementation Notes

1. **Game loop**: Use `requestAnimationFrame` with delta time for frame-rate independence
2. **Canvas sizing**: Responsive — fill viewport height, maintain aspect ratio (9:16 portrait)
3. **Mobile-first**: Touch controls are primary, keyboard secondary
4. **No external game libraries**: Pure Canvas API — keeps bundle small
5. **Vercel KV**: Use `@vercel/kv` package. Falls back gracefully if KV not configured (local dev uses in-memory)
6. **Separation of concerns**: Game logic in `/game/`, React UI in `/components/`, never mix
7. **Constants file**: ALL tuning numbers (speeds, timings, sizes) in `constants.ts` — never magic numbers in logic
8. **TypeScript strict mode**: No `any` types, proper interfaces for all game objects

## Development Phases

### Phase 1: Foundation
- [ ] Next.js project setup with TypeScript + Tailwind
- [ ] Canvas component rendering empty road with 4 lanes
- [ ] Road scrolling animation at constant speed
- [ ] Basic car rendering in bottom lane

### Phase 2: Core Gameplay
- [ ] Keyboard input for lane changes (smooth tweening)
- [ ] Speed acceleration system
- [ ] Obstacle spawning system (start with potholes only)
- [ ] Collision detection
- [ ] Lives system + game over state

### Phase 3: All Obstacles
- [ ] Implement all 5 obstacle types with unique visuals
- [ ] Warning system with lane indicators
- [ ] Obstacle effects (speed reduction, lane push, control lock)
- [ ] Effect duration timers + HUD indicators

### Phase 4: Polish
- [ ] Scoring system with animated counter
- [ ] HUD overlay with all elements
- [ ] Game over screen with score summary
- [ ] Start screen with instructions
- [ ] Touch/swipe controls for mobile
- [ ] Visual effects (particles, glow, screen shake)
- [ ] Sound effects (optional, mutable)

### Phase 5: Leaderboard
- [ ] Vercel KV integration
- [ ] API routes for GET/POST scores
- [ ] Name input on game over (if qualifies)
- [ ] Leaderboard display component
- [ ] In-memory fallback for local development

### Phase 6: Deploy
- [ ] Vercel deployment configuration
- [ ] KV store provisioning
- [ ] Mobile responsiveness testing
- [ ] Performance optimization (target 60fps)

## Commands

```bash
pnpm dev          # Local development
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm type-check   # TypeScript compiler check
```

## Testing Checklist

- [ ] Game runs at 60fps on mid-range mobile
- [ ] All 5 obstacle types spawn and have correct effects
- [ ] Warnings appear 2s before obstacles
- [ ] Lane changes feel responsive (<200ms)
- [ ] Score calculation matches formula
- [ ] Leaderboard persists across sessions
- [ ] Touch controls work on iOS Safari + Android Chrome
- [ ] Game over triggers correctly at 0 lives
- [ ] No memory leaks (canvas cleanup on unmount)
