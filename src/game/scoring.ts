import { SCORING } from './constants';
import type { GameData } from './types';

export function calculateScore(data: GameData): number {
  const baseScore = Math.floor(data.distance * data.time * SCORING.DISTANCE_TIME_MULTIPLIER);
  const total = baseScore + data.bonusPoints;
  return Math.min(total, SCORING.MAX_SCORE);
}

export function checkSurvivalBonuses(data: GameData): GameData {
  const updated = { ...data };

  if (!updated.survivalBonus30s && updated.time >= 30) {
    const timeSinceLastDamage = Date.now() - updated.lastDamageTime;
    if (timeSinceLastDamage >= 30000) {
      updated.bonusPoints += SCORING.SURVIVAL_BONUS_30S;
      updated.survivalBonus30s = true;
    }
  }

  if (!updated.survivalBonus60s && updated.time >= 60) {
    const timeSinceLastDamage = Date.now() - updated.lastDamageTime;
    if (timeSinceLastDamage >= 60000) {
      updated.bonusPoints += SCORING.SURVIVAL_BONUS_60S;
      updated.survivalBonus60s = true;
    }
  }

  return updated;
}
