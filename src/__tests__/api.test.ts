import { describe, test, expect, beforeEach } from 'vitest';
import { getTopScores, submitScore, resetMemoryStore } from '@/lib/kv';

describe('Leaderboard (in-memory fallback)', () => {
  beforeEach(() => {
    resetMemoryStore();
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
    expect(scores[0].score).toBe(1500);
    expect(scores[9].score).toBe(600);
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

  test('ranks are numbered correctly', async () => {
    await submitScore('A', 300);
    await submitScore('B', 200);
    await submitScore('C', 100);
    const scores = await getTopScores();
    expect(scores[0].rank).toBe(1);
    expect(scores[1].rank).toBe(2);
    expect(scores[2].rank).toBe(3);
  });
});
