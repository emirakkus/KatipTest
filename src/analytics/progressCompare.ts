import type { ProgressComparison, SessionSnapshot } from './types';
import { getLocalDateKey } from './persistence';

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function weekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1);
  return getLocalDateKey(d);
}

export function buildProgressComparisons(sessions: SessionSnapshot[]): ProgressComparison[] {
  const nonTrainer = sessions.filter((s) => !s.trainerSession);
  if (nonTrainer.length === 0) return [];

  const today = getLocalDateKey();
  const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));
  const thisWeek = weekKey(new Date());
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeek = weekKey(lastWeekDate);

  const todaySessions = nonTrainer.filter((s) => s.date === today);
  const yesterdaySessions = nonTrainer.filter((s) => s.date === yesterday);
  const thisWeekSessions = nonTrainer.filter((s) => weekKey(new Date(s.timestamp)) === thisWeek);
  const lastWeekSessions = nonTrainer.filter((s) => weekKey(new Date(s.timestamp)) === lastWeek);
  const last10 = nonTrainer.slice(0, 10);
  const prev10 = nonTrainer.slice(10, 20);

  const comparisons: ProgressComparison[] = [];

  if (todaySessions.length && yesterdaySessions.length) {
    comparisons.push({
      label: 'Bugün vs Dün',
      accuracyDelta: avg(todaySessions.map((s) => s.accuracy)) - avg(yesterdaySessions.map((s) => s.accuracy)),
      wpmDelta: avg(todaySessions.map((s) => s.wpm)) - avg(yesterdaySessions.map((s) => s.wpm)),
      errorDelta: avg(todaySessions.map((s) => s.mistakes)) - avg(yesterdaySessions.map((s) => s.mistakes)),
      weakKeyImprovement: countWeakImprovement(todaySessions, yesterdaySessions),
    });
  }

  if (thisWeekSessions.length && lastWeekSessions.length) {
    comparisons.push({
      label: 'Bu Hafta vs Geçen Hafta',
      accuracyDelta: avg(thisWeekSessions.map((s) => s.accuracy)) - avg(lastWeekSessions.map((s) => s.accuracy)),
      wpmDelta: avg(thisWeekSessions.map((s) => s.wpm)) - avg(lastWeekSessions.map((s) => s.wpm)),
      errorDelta: avg(thisWeekSessions.map((s) => s.mistakes)) - avg(lastWeekSessions.map((s) => s.mistakes)),
      weakKeyImprovement: countWeakImprovement(thisWeekSessions, lastWeekSessions),
    });
  }

  if (last10.length >= 3 && prev10.length >= 3) {
    comparisons.push({
      label: 'Son 10 vs Önceki 10',
      accuracyDelta: avg(last10.map((s) => s.accuracy)) - avg(prev10.map((s) => s.accuracy)),
      wpmDelta: avg(last10.map((s) => s.wpm)) - avg(prev10.map((s) => s.wpm)),
      errorDelta: avg(last10.map((s) => s.mistakes)) - avg(prev10.map((s) => s.mistakes)),
      weakKeyImprovement: countWeakImprovement(last10, prev10),
    });
  }

  return comparisons;
}

function countWeakImprovement(recent: SessionSnapshot[], older: SessionSnapshot[]): number {
  const recentWeak = new Set(recent.flatMap((s) => s.weakKeys));
  const olderWeak = new Set(older.flatMap((s) => s.weakKeys));
  let improved = 0;
  olderWeak.forEach((k) => {
    if (!recentWeak.has(k)) improved++;
  });
  return improved;
}

export function chartCompareData(sessions: SessionSnapshot[]) {
  return [...sessions]
    .filter((s) => !s.trainerSession)
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      session: i + 1,
      accuracy: s.accuracy,
      wpm: s.wpm,
      mistakes: s.mistakes,
    }));
}
