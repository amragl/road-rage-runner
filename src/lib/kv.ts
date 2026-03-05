const USE_REAL_KV = !!process.env.KV_REST_API_URL;

// In-memory fallback for local development
let memoryStore: { name: string; score: number }[] = [];

export async function getTopScores(): Promise<{ name: string; score: number; rank: number }[]> {
  if (USE_REAL_KV) {
    try {
      const { kv } = await import('@vercel/kv');
      const results = await kv.zrange('road-rage-runner:leaderboard', 0, 9, {
        rev: true,
        withScores: true,
      });

      const scores: { name: string; score: number; rank: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        const data = typeof results[i] === 'string'
          ? JSON.parse(results[i] as string)
          : results[i] as { name: string };
        scores.push({
          name: data.name,
          score: results[i + 1] as number,
          rank: Math.floor(i / 2) + 1,
        });
      }
      return scores;
    } catch {
      return [];
    }
  }

  return memoryStore
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export async function submitScore(
  name: string,
  score: number
): Promise<{ success: boolean; rank?: number }> {
  if (USE_REAL_KV) {
    try {
      const { kv } = await import('@vercel/kv');
      const count = await kv.zcard('road-rage-runner:leaderboard');

      if (count >= 10) {
        const lowest = await kv.zrange('road-rage-runner:leaderboard', 0, 0, {
          withScores: true,
        });
        const lowestScore = lowest[1] as number;
        if (score <= lowestScore) {
          return { success: false };
        }
        await kv.zrem('road-rage-runner:leaderboard', lowest[0] as string);
      }

      const member = JSON.stringify({ name, timestamp: Date.now() });
      await kv.zadd('road-rage-runner:leaderboard', { score, member });
      const rank = await kv.zrevrank('road-rage-runner:leaderboard', member);
      return { success: true, rank: (rank ?? 0) + 1 };
    } catch {
      return { success: false };
    }
  }

  memoryStore.push({ name, score });
  memoryStore.sort((a, b) => b.score - a.score);
  memoryStore = memoryStore.slice(0, 10);
  const rank = memoryStore.findIndex((s) => s.name === name && s.score === score) + 1;
  return { success: rank > 0 && rank <= 10, rank };
}

export async function checkQualifies(score: number): Promise<boolean> {
  const scores = await getTopScores();
  if (scores.length < 10) return true;
  return score > scores[scores.length - 1].score;
}

export function resetMemoryStore(): void {
  memoryStore = [];
}
