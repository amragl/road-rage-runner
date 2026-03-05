# API & Leaderboard — Technical Specification

## Storage: Vercel KV

Vercel KV is a Redis-compatible key-value store. We use a **sorted set** for the leaderboard.

### Redis Key Structure

```
Key: "road-rage-runner:leaderboard"
Type: Sorted Set
Members: JSON strings of { name, timestamp }
Scores: game score (numeric)
```

### Why Sorted Set?
- `ZREVRANGE` gives top N scores in O(log(N) + M)
- `ZCARD` gives total count
- `ZRANGEBYSCORE` can check if a new score qualifies
- Redis handles ranking natively — no application-level sorting

## API Routes

### `GET /api/scores`

Fetches the top 10 scores.

```typescript
// app/api/scores/route.ts
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get top 10 from sorted set (highest first)
    const results = await kv.zrange('road-rage-runner:leaderboard', 0, 9, {
      rev: true,
      withScores: true,
    });

    // results comes as [member, score, member, score, ...]
    const scores = [];
    for (let i = 0; i < results.length; i += 2) {
      const data = JSON.parse(results[i] as string);
      scores.push({
        name: data.name,
        score: results[i + 1] as number,
        rank: Math.floor(i / 2) + 1,
      });
    }

    return Response.json({ scores });
  } catch (error) {
    // Fallback for local dev / KV not configured
    return Response.json({ scores: [], fallback: true });
  }
}
```

### `POST /api/scores`

Submits a new score. Only stores if it qualifies for top 10.

```typescript
export async function POST(request: Request) {
  try {
    const { name, score } = await request.json();

    // Validation
    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!score || typeof score !== 'number' || score < 0 || score > 999999) {
      return Response.json({ error: 'Invalid score' }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 12).replace(/[^a-zA-Z0-9 ]/g, '');
    if (cleanName.length === 0) {
      return Response.json({ error: 'Invalid name' }, { status: 400 });
    }

    // Check current leaderboard size
    const count = await kv.zcard('road-rage-runner:leaderboard');

    if (count >= 10) {
      // Get the lowest score in top 10
      const lowest = await kv.zrange('road-rage-runner:leaderboard', 0, 0, {
        withScores: true,
      });
      const lowestScore = lowest[1] as number;

      if (score <= lowestScore) {
        return Response.json({ success: false, message: 'Score does not qualify' });
      }

      // Remove the lowest score to make room
      await kv.zrem('road-rage-runner:leaderboard', lowest[0] as string);
    }

    // Add the new score
    const member = JSON.stringify({ name: cleanName, timestamp: Date.now() });
    await kv.zadd('road-rage-runner:leaderboard', { score, member });

    // Determine rank
    const rank = await kv.zrevrank('road-rage-runner:leaderboard', member);

    return Response.json({ success: true, rank: (rank ?? 0) + 1 });
  } catch (error) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Local Development Fallback

When `KV_REST_API_URL` is not set (local dev), use an in-memory store:

```typescript
// lib/kv.ts
const USE_REAL_KV = !!process.env.KV_REST_API_URL;

// In-memory fallback
let memoryStore: { name: string; score: number }[] = [];

export async function getTopScores(): Promise<{ name: string; score: number; rank: number }[]> {
  if (USE_REAL_KV) {
    // ... real KV implementation
  }
  return memoryStore
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export async function submitScore(name: string, score: number): Promise<{ success: boolean; rank?: number }> {
  if (USE_REAL_KV) {
    // ... real KV implementation
  }
  memoryStore.push({ name, score });
  memoryStore.sort((a, b) => b.score - a.score);
  memoryStore = memoryStore.slice(0, 10);
  const rank = memoryStore.findIndex(s => s.name === name && s.score === score) + 1;
  return { success: rank > 0 && rank <= 10, rank };
}
```

## Rate Limiting

Basic IP-based rate limiting to prevent spam:

```typescript
// Simple in-memory rate limit (resets on cold start, fine for a game)
const rateLimit = new Map<string, number>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const lastSubmission = rateLimit.get(ip) || 0;
  if (now - lastSubmission < 5000) return true; // 5 second cooldown
  rateLimit.set(ip, now);
  return false;
}
```

## Vercel KV Setup

1. In Vercel dashboard → Storage → Create KV Database
2. Link to project — environment variables auto-populated:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`
3. No manual configuration needed — `@vercel/kv` reads env vars automatically

## Security Considerations

- Name sanitization: alphanumeric + spaces only, max 12 chars
- Score validation: positive integer, capped at 999999
- Rate limiting: 1 submission per 5 seconds per IP
- No authentication required (public leaderboard)
- Scores are not cryptographically verified (acceptable for casual game)
- Consider adding a simple hash check if cheating becomes an issue:
  ```
  hash = sha256(score + timestamp + SECRET_KEY)
  ```
