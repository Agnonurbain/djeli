// src/lib/progress/xp.test.ts

import { describe, expect, it } from 'vitest';
import {
  calculateLevel,
  getLevelProgress,
  masteryPercent,
  nextMasteryLevel,
  xpForLevel,
  xpRewardForExercise,
  MASTERY_PASS_THRESHOLD,
  PARTICIPATION_XP_RATIO,
  XP_REWARDS,
} from './xp';

describe('xpForLevel', () => {
  it('returns 0 for level 1 and below', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
  });

  it('follows the quadratic formula 50 * (N-1)^2', () => {
    expect(xpForLevel(2)).toBe(50);
    expect(xpForLevel(3)).toBe(200);
    expect(xpForLevel(4)).toBe(450);
    expect(xpForLevel(10)).toBe(50 * 81);
  });
});

describe('calculateLevel', () => {
  it('returns 1 for negative XP', () => {
    expect(calculateLevel(-100)).toBe(1);
  });

  it('returns 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('respects level boundaries', () => {
    expect(calculateLevel(49)).toBe(1);
    expect(calculateLevel(50)).toBe(2);
    expect(calculateLevel(199)).toBe(2);
    expect(calculateLevel(200)).toBe(3);
    expect(calculateLevel(449)).toBe(3);
    expect(calculateLevel(450)).toBe(4);
  });
});

describe('getLevelProgress', () => {
  it('returns coherent progress at start of a level', () => {
    const p = getLevelProgress(50);
    expect(p.currentLevel).toBe(2);
    expect(p.totalXp).toBe(50);
    expect(p.xpAtCurrentLevel).toBe(50);
    expect(p.xpForNextLevel).toBe(200);
    expect(p.xpInCurrentLevel).toBe(0);
    expect(p.xpSpanCurrentLevel).toBe(150);
  });

  it('returns coherent progress mid-level', () => {
    const p = getLevelProgress(100);
    expect(p.currentLevel).toBe(2);
    expect(p.xpInCurrentLevel).toBe(50);
    expect(p.xpSpanCurrentLevel).toBe(150);
  });

  it('clamps negative XP to 0', () => {
    const p = getLevelProgress(-99);
    expect(p.totalXp).toBe(0);
    expect(p.currentLevel).toBe(1);
  });
});

describe('xpRewardForExercise', () => {
  it('returns full XP for a perfect score', () => {
    expect(xpRewardForExercise('qcm', 1)).toBe(XP_REWARDS.qcm);
    expect(xpRewardForExercise('photo', 1)).toBe(XP_REWARDS.photo);
  });

  it('scales with the score above threshold', () => {
    // qcm = 10 base, score 0.8 → 8
    expect(xpRewardForExercise('qcm', 0.8)).toBe(8);
    // calcul = 15 base, score 0.6 → 9
    expect(xpRewardForExercise('calcul', 0.6)).toBe(9);
  });

  it('reduces to participation XP when below threshold', () => {
    // qcm = 10 base, score 0.4 → round(10 * 0.3 * 0.4) = round(1.2) = 1
    expect(xpRewardForExercise('qcm', 0.4)).toBe(
      Math.round(XP_REWARDS.qcm * PARTICIPATION_XP_RATIO * 0.4)
    );
  });

  it('returns 0 for a 0 score', () => {
    expect(xpRewardForExercise('qcm', 0)).toBe(0);
  });

  it('clamps scores out of range', () => {
    expect(xpRewardForExercise('qcm', 1.5)).toBe(XP_REWARDS.qcm);
    expect(xpRewardForExercise('qcm', -0.5)).toBe(0);
  });
});

describe('nextMasteryLevel', () => {
  it('does not advance when score is below threshold', () => {
    expect(nextMasteryLevel('apprenti', 100, MASTERY_PASS_THRESHOLD - 0.01)).toBe(
      'apprenti'
    );
  });

  it('advances novice → apprenti at 3 validations', () => {
    expect(nextMasteryLevel('novice', 3, 1)).toBe('apprenti');
    expect(nextMasteryLevel('novice', 2, 1)).toBe('novice');
  });

  it('advances apprenti → confirme at 7 validations', () => {
    expect(nextMasteryLevel('apprenti', 7, 0.8)).toBe('confirme');
  });

  it('reaches maitre at 25 validations', () => {
    expect(nextMasteryLevel('expert', 25, 0.9)).toBe('maitre');
  });

  it('never demotes', () => {
    // L'élève est expert mais a fait peu d'exercices (cas migration / edge)
    expect(nextMasteryLevel('expert', 2, 1)).toBe('expert');
  });
});

describe('masteryPercent', () => {
  it('maps each ladder level to its progress percent', () => {
    expect(masteryPercent('novice')).toBe(0);
    expect(masteryPercent('apprenti')).toBe(25);
    expect(masteryPercent('confirme')).toBe(50);
    expect(masteryPercent('expert')).toBe(75);
    expect(masteryPercent('maitre')).toBe(100);
  });
});
