'use client';

import { useState, useCallback } from 'react';
import type { LeaderboardEntry } from '@/game/types';

export function useLeaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScores(data.scores || []);
    } catch {
      setError('Failed to load scores');
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(async (name: string, score: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchScores();
      }
      return data;
    } catch {
      setError('Failed to submit score');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [fetchScores]);

  return { scores, loading, error, fetchScores, submitScore };
}
