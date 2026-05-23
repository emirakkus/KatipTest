import type { PracticeStreak } from './types';
import { getLocalDateKey } from './persistence';

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  const diff = db.getTime() - da.getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

export function recordPracticeDay(streak: PracticeStreak, now = new Date()): PracticeStreak {
  const today = getLocalDateKey(now);
  if (streak.lastPracticeDate === today) {
    return { ...streak, todayCompleted: true };
  }

  let currentStreak = 1;
  if (streak.lastPracticeDate) {
    const gap = daysBetween(streak.lastPracticeDate, today);
    if (gap === 1) currentStreak = streak.currentStreak + 1;
    else if (gap > 1) currentStreak = 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastPracticeDate: today,
    todayCompleted: true,
  };
}

export function refreshStreakForToday(streak: PracticeStreak, now = new Date()): PracticeStreak {
  const today = getLocalDateKey(now);
  if (!streak.lastPracticeDate) return { ...streak, todayCompleted: false };
  if (streak.lastPracticeDate === today) return { ...streak, todayCompleted: true };
  const gap = daysBetween(streak.lastPracticeDate, today);
  if (gap > 1) {
    return {
      ...streak,
      currentStreak: 0,
      todayCompleted: false,
    };
  }
  return { ...streak, todayCompleted: false };
}

export function getNextMilestone(current: number): number | null {
  const milestones = [3, 7, 14, 30, 100];
  return milestones.find((m) => m > current) ?? null;
}
