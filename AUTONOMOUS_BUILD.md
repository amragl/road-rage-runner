# Road Rage Runner — Autonomous Build Prompt

## Instructions for Claude Code

You are building **Road Rage Runner** end-to-end. Read every file in this project before starting:

1. `CLAUDE.md` — master spec and architecture
2. `docs/GAME_DESIGN.md` — detailed game mechanics
3. `docs/API_SPEC.md` — leaderboard API spec
4. `docs/CONSTANTS_REFERENCE.md` — all tuning values
5. `docs/PROMPT_PLAN.md` — the 12 implementation phases

You will execute all 12 phases sequentially and autonomously. Do NOT stop between phases unless a critical error blocks progress. After each phase, run validation tests, commit to git, and proceed to the next phase.

---

## Git Setup — Do This First

### Local Repository
```bash
cd /path/to/road-rage-runner
git init
git checkout -b main
```

### Remote Repository
Create the remote repo on GitHub using the `gh` CLI:
```bash
gh repo create amragl/road-rage-runner --public --description "Browser-based endless driving game — React, Canvas, Vercel KV leaderboard" --source=. --remote=origin
```

If `gh` is not authenticated, use:
```bash
gh auth login
```

### Branch Strategy
- `main` — stable, deployable code only
- `develop` — integration branch, all phase work merges here first
- `phase/XX-description` — one branch per phase

Create the develop branch immediately:
```bash
git checkout -b develop
```

---

## Execution Protocol — Follow This Exactly For Every Phase

For each of the 12 phases in `docs/PROMPT_PLAN.md`, execute this cycle:

### Step 1: Branch
```bash
git checkout develop
git pull origin develop 2>/dev/null || true
git checkout -b phase/XX-short-description
```
Replace `XX` with the zero-padded phase number (01, 02, ... 12).

### Step 2: Implement
Execute the phase instructions from `docs/PROMPT_PLAN.md`. Follow the spec in `CLAUDE.md` and reference the docs/ files as needed.

Key rules during implementation:
- **No magic numbers** — every value comes from `src/game/constants.ts`
- **TypeScript strict** — no `any` types, proper interfaces for everything
- **Game logic in `src/game/`**, React UI in `src/components/` — never mix
- **Use `useRef`** for game state in the render loop, not `useState`
- **Constants file** must exist before any game logic is written (Phase 1)

### Step 3: Validate
After implementing, run ALL applicable validations:

```bash
# Always run these
pnpm type-check || npx tsc --noEmit          # TypeScript compilation
pnpm lint || npx next lint                     # ESLint
pnpm build                                     # Production build must succeed

# Phase-specific functional tests (see Validation Matrix below)
```

**If validation fails:**
1. Read the error output carefully
2. Fix the issue
3. Re-run the failing validation
4. Do NOT proceed until all validations pass

### Step 4: Commit & Push
```bash
git add -A
git commit -m "Phase XX: [descriptive summary of what was implemented]

- [bullet point of key deliverable 1]
- [bullet point of key deliverable 2]
- [bullet point of key deliverable 3]

Validates: type-check ✓ | lint ✓ | build ✓ | [phase-specific tests ✓]"

git push -u origin phase/XX-short-description
```

### Step 5: Merge to develop
```bash
git checkout develop
git merge phase/XX-short-description --no-ff -m "Merge phase XX: [description]"
git push origin develop
```

### Step 6: Proceed
Move to the next phase. Do not wait for confirmation.

---

## Validation Matrix — What to Test Per Phase

| Phase | Branch Name | Validations |
|-------|------------|-------------|
| 01 | `phase/01-scaffolding` | `tsc --noEmit` ✓, `next build` ✓, constants.ts exports all groups, types.ts has all interfaces |
| 02 | `phase/02-canvas-road` | Build ✓, canvas renders at `/game`, road has 4 visible lanes, car displays at bottom, road scrolls |
| 03 | `phase/03-input-lanes` | Build ✓, keyboard left/right moves car, car clamps to lanes 0-3, tween animation works |
| 04 | `phase/04-game-loop` | Build ✓, speed increases over time, distance counter increments, delta-time based (not frame-locked) |
| 05 | `phase/05-obstacles` | Build ✓, obstacles spawn and scroll down, all 5 types render distinctly, difficulty phases unlock correctly |
| 06 | `phase/06-collision` | Build ✓, each obstacle effect works correctly, lives decrease, game over at 0 lives, invincibility works |
| 07 | `phase/07-warnings` | Build ✓, warnings appear ~2s before obstacle, correct lane positioning, multiple warnings stack |
| 08 | `phase/08-hud-scoring` | Build ✓, HUD shows score/speed/distance/lives, score formula matches spec, active effects display |
| 09 | `phase/09-game-states` | Build ✓, all state transitions work (menu→play→pause→gameover→menu), retry works, screens render |
| 10 | `phase/10-leaderboard` | Build ✓, GET /api/scores returns data, POST /api/scores validates+stores, in-memory fallback works, UI displays top 10 |
| 11 | `phase/11-polish` | Build ✓, particles render, screen shake on damage, speed lines at high speed, 60fps maintained |
| 12 | `phase/12-mobile-deploy` | Build ✓, touch controls functional, viewport configured, README complete, deployment ready |

### How to Run Functional Tests

For phases that need runtime validation (02+), create a temporary test by either:

**Option A: Automated canvas/game tests** — Create `src/__tests__/phase-XX.test.ts`:
```typescript
// Example for Phase 05
import { spawnObstacle, updateObstacles } from '@/game/obstacles';
import { initGameData } from '@/game/engine';
import { DIFFICULTY_PHASES } from '@/game/constants';

describe('Phase 05: Obstacles', () => {
  test('spawns obstacles above canvas', () => {
    const gameData = initGameData();
    // ... spawn and verify y position is negative
  });

  test('respects difficulty phases', () => {
    const gameData = initGameData();
    gameData.time = 0;
    // At time 0, only POTHOLE and TUMBLEWEED should spawn
    // At time 30+, SPEED_CAMERA should be possible
  });

  test('never spawns two obstacles too close in same lane', () => {
    // ... verify SAME_LANE_MIN_DISTANCE is respected
  });
});
```

Run with:
```bash
# Install test runner if not present (do this in Phase 01)
pnpm add -D vitest @testing-library/react jsdom
```

Add to package.json scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Option B: Smoke test via build + manual checks** — For UI/visual phases where automated tests are impractical, verify by:
```bash
pnpm build                    # Must succeed
pnpm start &                  # Start prod server
sleep 3
curl -s http://localhost:3000 | grep -q "Road Rage Runner" && echo "✓ Home page renders"
curl -s http://localhost:3000/game | grep -q "canvas" && echo "✓ Game page has canvas"
curl -s http://localhost:3000/api/scores | python3 -c "import sys,json; d=json.load(sys.stdin); print('✓ API responds' if 'scores' in d else '✗ API broken')"
kill %1 2>/dev/null
```

---

## Phase-Specific Test Files to Create

### Phase 01: `src/__tests__/constants.test.ts`
```typescript
import * as constants from '@/game/constants';

describe('Constants', () => {
  test('all constant groups are exported', () => {
    expect(constants.CANVAS).toBeDefined();
    expect(constants.CAR).toBeDefined();
    expect(constants.SPEED).toBeDefined();
    expect(constants.OBSTACLES).toBeDefined();
    expect(constants.SCORING).toBeDefined();
    expect(constants.EFFECTS).toBeDefined();
    expect(constants.COLORS).toBeDefined();
  });

  test('speed values are sane', () => {
    expect(constants.SPEED.INITIAL).toBeLessThan(constants.SPEED.MAX);
    expect(constants.SPEED.ACCELERATION).toBeGreaterThan(0);
    expect(constants.SPEED.MIN_FLOOR).toBeGreaterThan(0);
  });

  test('lane count is 4', () => {
    expect(constants.CANVAS.LANE_COUNT).toBe(4);
  });

  test('obstacle spawn weights sum to 100', () => {
    const types = constants.OBSTACLES.TYPES;
    const totalWeight = Object.values(types).reduce((sum, t) => sum + t.SPAWN_WEIGHT, 0);
    expect(totalWeight).toBe(100);
  });
});
```

### Phase 04: `src/__tests__/engine.test.ts`
```typescript
import { initGameData, updateGame } from '@/game/engine';
import { SPEED } from '@/game/constants';

describe('Engine', () => {
  test('initializes with correct defaults', () => {
    const data = initGameData();
    expect(data.speed).toBe(SPEED.INITIAL);
    expect(data.distance).toBe(0);
    expect(data.time).toBe(0);
    expect(data.car.lives).toBe(3);
    expect(data.gameState).toBe('MENU');
  });

  test('speed increases over time', () => {
    let data = initGameData();
    data.gameState = 'PLAYING';
    for (let i = 0; i < 100; i++) {
      data = updateGame(data, 16, null); // ~60fps delta
    }
    expect(data.speed).toBeGreaterThan(SPEED.INITIAL);
  });

  test('speed never exceeds MAX', () => {
    let data = initGameData();
    data.gameState = 'PLAYING';
    data.speed = SPEED.MAX;
    data = updateGame(data, 16, null);
    expect(data.speed).toBeLessThanOrEqual(SPEED.MAX);
  });

  test('distance accumulates', () => {
    let data = initGameData();
    data.gameState = 'PLAYING';
    data = updateGame(data, 16, null);
    expect(data.distance).toBeGreaterThan(0);
  });
});
```

### Phase 06: `src/__tests__/collision.test.ts`
```typescript
import { checkCollision } from '@/game/collision';

describe('Collision', () => {
  const canvasMetrics = { width: 400, height: 711, laneWidth: 80, roadLeft: 40 };

  test('detects collision when car and obstacle in same lane and overlapping', () => {
    const car = { lane: 1, targetLane: 1, tweenProgress: 1 };
    const obstacle = { lane: 1, y: canvasMetrics.height * 0.78, type: 'POTHOLE' };
    expect(checkCollision(car, obstacle, canvasMetrics)).toBe(true);
  });

  test('no collision when in different lanes', () => {
    const car = { lane: 0, targetLane: 0, tweenProgress: 1 };
    const obstacle = { lane: 2, y: canvasMetrics.height * 0.78, type: 'POTHOLE' };
    expect(checkCollision(car, obstacle, canvasMetrics)).toBe(false);
  });

  test('no collision when obstacle is far above car', () => {
    const car = { lane: 1, targetLane: 1, tweenProgress: 1 };
    const obstacle = { lane: 1, y: 50, type: 'POTHOLE' };
    expect(checkCollision(car, obstacle, canvasMetrics)).toBe(false);
  });
});
```

### Phase 10: `src/__tests__/api.test.ts`
```typescript
// This tests the leaderboard logic, not the HTTP layer
import { getTopScores, submitScore } from '@/lib/kv';

describe('Leaderboard (in-memory fallback)', () => {
  beforeEach(() => {
    // Reset in-memory store between tests
    // Implementation depends on how kv.ts exposes reset
  });

  test('returns empty array initially', async () => {
    const scores = await getTopScores();
    expect(scores).toEqual([]);
  });

  test('stores and retrieves a score', async () => {
    await submitScore('TestPlayer', 1000);
    const scores = await getTopScores();
    expect(scores).toHaveLength(1);
    expect(scores[0].name).toBe('TestPlayer');
    expect(scores[0].score).toBe(1000);
  });

  test('maintains top 10 only', async () => {
    for (let i = 0; i < 15; i++) {
      await submitScore(`Player${i}`, (i + 1) * 100);
    }
    const scores = await getTopScores();
    expect(scores).toHaveLength(10);
    expect(scores[0].score).toBe(1500); // Highest
    expect(scores[9].score).toBe(600);  // 10th highest
  });

  test('scores are ranked highest first', async () => {
    await submitScore('Low', 100);
    await submitScore('High', 9999);
    await submitScore('Mid', 5000);
    const scores = await getTopScores();
    expect(scores[0].score).toBe(9999);
    expect(scores[1].score).toBe(5000);
    expect(scores[2].score).toBe(100);
  });
});
```

---

## Final Merge to Main

After all 12 phases are complete and validated:

```bash
git checkout main
git merge develop --no-ff -m "v1.0.0: Road Rage Runner — complete game

Features:
- 4-lane endless driving game with HTML5 Canvas
- 5 obstacle types with unique effects and warnings
- Progressive difficulty curve
- Score = time × distance with bonus points
- Top 10 leaderboard via Vercel KV
- Mobile-first with touch/swipe controls
- Retro neon visual style with particle effects
- Deployable to Vercel with zero config

Phases: 01-scaffolding through 12-mobile-deploy
All validations passed: tsc ✓ | lint ✓ | build ✓ | tests ✓"

git push origin main
git tag v1.0.0 -m "Initial release"
git push origin v1.0.0
```

---

## Error Recovery

If a phase fails validation and you cannot fix it after 3 attempts:

1. Commit what you have with a `WIP:` prefix
2. Document the issue in a `TODO.md` at project root
3. Move to the next phase if possible (skip if blocking)
4. Return to fix after completing non-blocked phases

If `gh` CLI is not available for remote repo creation:
1. Proceed with local git only
2. Add a note in TODO.md: "Remote repo needs manual creation"
3. Continue all phases with local commits
4. Push everything at the end once remote is configured

---

## Summary

You are executing 12 phases autonomously. For each phase:
**Branch → Implement → Test → Commit → Push → Merge → Next**

Start now with Phase 01. Do not stop until all 12 phases are merged to develop, then merge develop to main and tag v1.0.0.

Go.
