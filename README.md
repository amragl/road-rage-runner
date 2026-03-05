# Road Rage Runner

A browser-based endless driving game built with React, HTML5 Canvas, and Next.js. Dodge obstacles, survive as long as possible, and compete on the leaderboard.

## How to Play

- **Arrow keys** or **A/D** to change lanes (keyboard)
- **Swipe** or **tap left/right** to change lanes (mobile)
- **Escape** to pause
- **Space/Enter** to start

### Obstacles

| Obstacle | Effect |
|----------|--------|
| Pothole | Instant damage (-1 life) |
| Tumbleweed | Pushes car sideways |
| Speed Bump | Slows you down for 2s |
| Speed Camera | Speeding = damage, slow = +100 pts |
| Oil Slick | Disables steering for 1.5s |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **HTML5 Canvas** for game rendering
- **Tailwind CSS** for UI
- **Vercel KV** for leaderboard persistence

## Local Development

```bash
pnpm install
pnpm dev
```

The game runs at `http://localhost:3000`. The leaderboard uses an in-memory store locally.

## Deployment

1. Push to GitHub
2. Import into [Vercel](https://vercel.com)
3. Add a KV store: Dashboard > Storage > Create KV Database
4. Link KV to your project (env vars auto-populate)
5. Deploy

## Scripts

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm type-check   # TypeScript compiler check
pnpm test         # Run tests
```
