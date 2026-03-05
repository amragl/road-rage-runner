# Prompt Plan — Claude Code Implementation Steps

Use these prompts sequentially with Claude Code. Each prompt builds on the previous.
Wait for each step to complete and test before proceeding.

---

## Prompt 1: Project Scaffolding

```
Read the CLAUDE.md file in this project root. Then scaffold the Next.js project:

1. Initialize with: npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
2. Install dependencies: @vercel/kv
3. Create the folder structure from CLAUDE.md exactly
4. Create src/game/constants.ts using docs/CONSTANTS_REFERENCE.md — implement ALL constants
5. Create src/game/types.ts with these interfaces:
   - GameState (MENU | PLAYING | PAUSED | GAME_OVER | SUBMITTING_SCORE)
   - Position { x, y }
   - Car { lane, targetLane, tweenProgress, lives, isInvincible, invincibilityTimer }
   - ObstacleType enum (POTHOLE | TUMBLEWEED | SPEED_BUMP | SPEED_CAMERA | OIL_SLICK)
   - Obstacle { type, lane, y, id, hasWarned, hasCollided }
   - Warning { obstacleId, lane, type, startTime, opacity }
   - ActiveEffect { type, startTime, duration }
   - GameData { car, obstacles, warnings, effects, speed, distance, time, score, bonusPoints, gameState }
   - LeaderboardEntry { name, score, rank }
6. Set up globals.css with Tailwind directives and dark theme base
7. Create a basic app/layout.tsx with dark background and a Google Font (Press Start 2P for headings, plus a clean sans-serif body font like Outfit)
8. Verify it builds: pnpm build
```

---

## Prompt 2: Canvas & Road Rendering

```
Read CLAUDE.md and docs/GAME_DESIGN.md. Create the road rendering system:

1. Create src/components/GameCanvas.tsx:
   - Full-viewport canvas with 9:16 aspect ratio, centered
   - Responsive sizing (use ResizeObserver)
   - Canvas ref with 2D context
   - Accept a gameData prop for rendering

2. Create src/game/road.ts with functions:
   - drawRoad(ctx, canvasWidth, canvasHeight, scrollOffset): draws the complete road
   - Road fills 80% width, centered
   - 4 lanes with dashed dividers that scroll with scrollOffset
   - Solid white edge lines
   - Dark asphalt base (#2a2a2a)
   - Green grass/dirt margins on sides
   - Lane numbers for debugging (removable later)

3. Create src/game/car.ts with functions:
   - drawCar(ctx, car, canvasWidth, canvasHeight, laneWidth): renders the car
   - Top-down car shape: rectangle body, windshield rectangle, 4 small wheel rectangles
   - Car positioned at bottom 22% of canvas
   - Car centered in its current lane (handle tween between lanes)
   - When invincible, car opacity flashes

4. Create app/game/page.tsx that renders GameCanvas with a static car on a scrolling road
5. Hardcode initial speed for now — road should scroll smoothly at 3px/frame
6. Verify the road scrolls and car displays correctly
```

---

## Prompt 3: Input & Lane Changing

```
Read CLAUDE.md. Implement player input and lane movement:

1. Create src/hooks/useInput.ts:
   - Listen for keyboard events (ArrowLeft, ArrowRight, a, d)
   - Listen for touch events (swipe left/right detection, minimum 30px threshold)
   - Also support tap on left/right halves of screen
   - Return a queue of pending lane changes: 'left' | 'right'
   - Support input buffering: max 1 queued input during active tween

2. Update src/game/car.ts:
   - Add updateCar(car, input, deltaTime) function
   - Smooth lane tweening over 200ms with easeOutQuad
   - Clamp to lanes 0-3 (can't go off road)
   - Process buffered input after tween completes

3. Wire input hook into game/page.tsx
4. Test: car should smoothly move between all 4 lanes with keyboard and touch
5. Lane changes should feel snappy and responsive
```

---

## Prompt 4: Game Loop & Speed System

```
Read CLAUDE.md. Implement the core game loop with proper timing:

1. Create src/hooks/useGameLoop.ts:
   - requestAnimationFrame loop with delta time calculation
   - Accepts an update callback (deltaTime: number) => void
   - Accepts a render callback () => void
   - Handles pause/resume (cancel animation frame)
   - Cleanup on unmount

2. Create src/game/engine.ts:
   - initGameData(): returns fresh GameData for new game
   - updateGame(gameData, deltaTime, input): pure function, returns new GameData
   - Handles: speed acceleration, distance tracking, time tracking, scroll offset
   - Speed increases by ACCELERATION per frame, capped at MAX
   - Distance += currentSpeed each frame
   - Time tracks real elapsed seconds

3. Refactor game/page.tsx to use the game loop:
   - State management with useRef for game data (avoid re-renders)
   - Update → Render cycle each frame
   - Display current speed and distance as text overlay for debugging

4. Test: road should accelerate smoothly, speed and distance counters increase
```

---

## Prompt 5: Obstacle Spawning & Rendering

```
Read CLAUDE.md and docs/GAME_DESIGN.md section 3. Implement obstacles:

1. Create src/game/obstacles.ts:
   - spawnObstacle(gameData): checks timing, picks type (weighted random), picks lane, returns new obstacle
   - Respect minimum gap between spawns (decreases over time per DIFFICULTY_PHASES)
   - Never spawn in same lane within SAME_LANE_MIN_DISTANCE of existing obstacle
   - Unlock obstacle types based on elapsed time (difficulty phases)
   - updateObstacles(obstacles, speed): move all obstacles down by speed, remove off-screen ones
   - drawObstacle(ctx, obstacle, laneWidth, lanePositions): render each type:
     * Pothole: dark irregular circle with cracked edges
     * Tumbleweed: rotating brown circular bush shape
     * Speed Bump: yellow/black striped rectangle
     * Speed Camera: pole + box + blinking light
     * Oil Slick: dark puddle with rainbow shimmer

2. Integrate into engine.ts update loop:
   - Call spawnObstacle on each update
   - Call updateObstacles to move/cull them

3. Test: obstacles should spawn at top, scroll down, and disappear below canvas
4. Verify different types appear at correct difficulty thresholds
5. Verify visual variety — each type should be clearly distinguishable
```

---

## Prompt 6: Collision & Effects

```
Read CLAUDE.md and docs/GAME_DESIGN.md sections 3-4. Implement collision and obstacle effects:

1. Create src/game/collision.ts:
   - checkCollision(car, obstacle, canvasMetrics): AABB collision detection
   - Car hitbox: slightly smaller than visual (80% for forgiveness)
   - Returns true/false

2. Update engine.ts to handle collisions:
   - On collision (if not invincible), apply effect based on obstacle type:
     * POTHOLE: -1 life, trigger invincibility, screen shake
     * TUMBLEWEED: push car ±1 lane (random). If pushed off edge: -1 life + invincibility
     * SPEED_BUMP: apply speed reduction effect (40% for 2s)
     * SPEED_CAMERA: check speed vs threshold. Over = -1 life. Under = +100 bonus
     * OIL_SLICK: disable lane changes for 1.5s
   - Mark obstacle as hasCollided to prevent double-trigger
   - Track ActiveEffects with timers

3. Implement invincibility:
   - 1.5s after damage, car flashes (handled in car.ts draw)
   - No damage during invincibility

4. Implement lives system:
   - Start with 3 lives
   - At 0 lives → gameState = GAME_OVER

5. Add visual feedback:
   - Screen shake on damage (canvas transform offset, decaying)
   - Flash effect on speed camera
   - "SLOW" overlay when speed bump active
   - "SLICK" overlay when oil slick active

6. Test each obstacle type's effect thoroughly
```

---

## Prompt 7: Warning System

```
Read CLAUDE.md and docs/GAME_DESIGN.md section 4. Implement the warning system:

1. Add warning logic to engine.ts:
   - When an obstacle spawns, calculate when it will reach the car's Y position
   - Create a Warning 2 seconds before arrival time
   - Warning includes: obstacleId, lane, type, startTime

2. Create src/components/WarningBanner.tsx:
   - Renders as HTML overlay on top of canvas (not drawn on canvas)
   - Positioned at top of the specific lane
   - Shows icon + obstacle name
   - Border color matches obstacle type (from constants)
   - Animation: fade in → pulse → fade out
   - Support multiple simultaneous warnings (stack vertically)

3. Alternatively, draw warnings on the canvas itself:
   - Semi-transparent banner at top of the warned lane
   - Obstacle-specific icon/color
   - Pulsing opacity animation

4. Choose whichever approach (HTML overlay or canvas) looks better and performs well
5. Test: warnings should appear ~2 seconds before the obstacle reaches the car
6. Verify multiple warnings can display simultaneously
```

---

## Prompt 8: HUD & Scoring

```
Read CLAUDE.md. Implement the HUD and scoring system:

1. Create src/game/scoring.ts:
   - calculateScore(distance, time, bonusPoints): implements the formula
   - Track bonus milestones (30s no-damage, 60s no-damage)

2. Create src/components/HUD.tsx (HTML overlay, not canvas):
   - Top-left: Score with animated counter (number ticks up smoothly)
   - Top-right: Speed in "km/h" (currentSpeed × DISPLAY_MULTIPLIER)
   - Top-center: Distance in meters
   - Bottom-left: Lives as heart icons (filled = alive, empty = lost)
   - Bottom-center: Active effect indicators (SLOW icon, SLICK icon with timer)
   - Use Press Start 2P font for retro game feel
   - Neon glow effects on text (text-shadow with cyan/magenta)
   - Semi-transparent dark backgrounds for readability

3. Wire scoring into engine.ts update
4. Wire HUD into game/page.tsx with current game data
5. Add a mobile pause button (top-right corner)
6. Test: all HUD elements update in real-time during gameplay
```

---

## Prompt 9: Game States & Screens

```
Read CLAUDE.md. Implement all game state screens:

1. Create src/components/StartScreen.tsx:
   - Game title "ROAD RAGE RUNNER" with neon glow effect
   - Animated road background (subtle scrolling)
   - "START GAME" button (pulsing neon border)
   - "LEADERBOARD" button
   - Brief controls instruction text
   - Mobile-friendly large tap targets

2. Create src/components/GameOver.tsx:
   - "GAME OVER" title with dramatic effect
   - Final score (large, animated count-up)
   - Stats: distance, time survived, top speed reached
   - If score qualifies for top 10: name input field (max 12 chars, alphanumeric)
   - "SUBMIT SCORE" button (only if name entered)
   - "RETRY" button
   - "MAIN MENU" button

3. Update game/page.tsx state machine:
   - MENU: show StartScreen
   - PLAYING: show GameCanvas + HUD + Warnings
   - PAUSED: show pause overlay with "RESUME" and "QUIT" buttons
   - GAME_OVER: show GameOver overlay on top of frozen game
   - SUBMITTING_SCORE: show loading state during API call

4. Create app/page.tsx (home) that renders the game
5. Test all state transitions from the design doc
```

---

## Prompt 10: Leaderboard Integration

```
Read CLAUDE.md and docs/API_SPEC.md. Implement the leaderboard:

1. Create src/lib/kv.ts:
   - Wrapper around @vercel/kv with in-memory fallback
   - getTopScores(): returns top 10
   - submitScore(name, score): validates and submits
   - checkQualifies(score): returns true if score would make top 10

2. Create app/api/scores/route.ts:
   - GET handler: returns top 10 scores
   - POST handler: validates input, submits score, returns rank
   - Rate limiting (5s cooldown per IP)
   - Error handling with proper HTTP status codes

3. Create src/hooks/useLeaderboard.ts:
   - fetchScores(): GET /api/scores
   - submitScore(name, score): POST /api/scores
   - Loading and error states

4. Create src/components/Leaderboard.tsx:
   - Table showing rank, name, score
   - Gold/silver/bronze highlights for top 3
   - "Your score" highlight if player just submitted
   - Loading skeleton while fetching
   - Empty state message if no scores yet
   - Accessible from start screen AND game over screen

5. Wire into GameOver.tsx:
   - After game over, check if score qualifies
   - If yes, show name input
   - On submit, show leaderboard with player's entry highlighted
   - If no, show "Score didn't make top 10" and leaderboard

6. Test full flow: play → die → enter name → see score on leaderboard
7. Test with multiple submissions to verify top 10 ordering
```

---

## Prompt 11: Visual Polish

```
Read CLAUDE.md. Add visual polish and effects:

1. Particle system:
   - Small dust particles drift from road edges
   - Collision sparks on damage
   - Speed lines in margins (vertical streaks, opacity scales with speed)

2. Road enhancements:
   - Lane markings stretch at high speeds (visual speed cue)
   - Grass areas have subtle texture (darker/lighter patches)
   - Road has very subtle noise texture

3. Car enhancements:
   - Slight tilt during lane changes
   - Brake lights flash on speed bump hit
   - Headlight glow (subtle forward cone)

4. Screen effects:
   - Vignette at very high speeds (edges darken)
   - Subtle CRT scanline overlay (optional, check performance)
   - Speed camera flash fills screen briefly

5. UI animations:
   - Score counter ticks up (not jumps)
   - Lives hearts have pop animation when lost
   - Game over title shakes in
   - Leaderboard rows slide in staggered

6. Ensure all effects are performant (target 60fps on mobile)
7. Add a way to disable heavy effects if FPS drops below 30
```

---

## Prompt 12: Mobile & Deployment

```
Read CLAUDE.md. Finalize for mobile and deploy:

1. Mobile optimizations:
   - Touch controls: swipe AND tap halves
   - Prevent default touch behaviors (scroll, zoom)
   - Viewport meta tag for no-zoom
   - Orientation lock hint (portrait preferred)
   - Large touch targets for all buttons (min 48px)
   - Haptic feedback on collision (if available via Vibration API)

2. Performance:
   - Profile with Chrome DevTools
   - Ensure 60fps on mid-range mobile
   - Optimize canvas draws (minimize state changes, batch similar draws)
   - Use offscreen canvas for static elements if needed

3. PWA basics (optional):
   - manifest.json with game icon
   - Theme color for status bar

4. Vercel deployment:
   - Verify vercel.json if needed (should work with zero-config)
   - Ensure KV environment variables are documented in README
   - Add .env.example with KV_REST_API_URL and KV_REST_API_TOKEN placeholders
   - Test production build: pnpm build && pnpm start

5. Create README.md:
   - Game description and screenshot
   - How to play (controls)
   - Tech stack
   - Local development setup
   - Deployment instructions (Vercel + KV setup)

6. Final testing checklist from CLAUDE.md
```

---

## Tips for Claude Code

- **Always read CLAUDE.md first** — it has the complete architecture
- **Reference docs/ files** for detailed specs when implementing specific features
- **Use constants.ts** for ALL numbers — never hardcode values
- **Test after each prompt** — the game should be playable incrementally
- **Canvas performance**: minimize `save()`/`restore()` calls, batch similar draws
- **State management**: use `useRef` for game data in the render loop, not `useState` (avoids re-renders)
- **Mobile-first**: test touch controls early, not as an afterthought
