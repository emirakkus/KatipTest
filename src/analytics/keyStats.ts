import type { KeyPressEvent, KeyStat, KeyTrend } from './types';

export function normalizeKey(char: string): string {
  if (!char) return '';
  if (char === ' ') return 'space';
  return char.toLocaleLowerCase('tr-TR');
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeWeakKeyScore(
  accuracy: number,
  avgReactionMs: number,
  wrongPresses: number,
  totalPresses: number,
  consistency: number
): number {
  const errorRate = totalPresses > 0 ? wrongPresses / totalPresses : 0;
  const slowFactor = Math.min(1, avgReactionMs / 450);
  const repeatFactor = Math.min(1, wrongPresses / 8);
  const consistencyPenalty = Math.min(1, consistency / 200);
  const accuracyPenalty = Math.max(0, (100 - accuracy) / 100);
  return Math.round(
    (errorRate * 40 + slowFactor * 25 + repeatFactor * 20 + consistencyPenalty * 10 + accuracyPenalty * 5) * 100
  ) / 100;
}

function computeTrend(
  prevScore: number,
  newScore: number,
  prevWrong: number,
  newWrong: number
): KeyTrend {
  if (newScore < prevScore - 3 || newWrong < prevWrong) return 'improving';
  if (newScore > prevScore + 3 || newWrong > prevWrong + 2) return 'declining';
  return 'stable';
}

export function mergeKeyEvents(
  existing: Record<string, KeyStat>,
  events: KeyPressEvent[]
): Record<string, KeyStat> {
  const next = { ...existing };
  const grouped = new Map<string, KeyPressEvent[]>();

  events.forEach((ev) => {
    const k = normalizeKey(ev.key);
    if (!k) return;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(ev);
  });

  grouped.forEach((batch, key) => {
    const prev = next[key];
    const addedTotal = batch.length;
    const addedWrong = batch.filter((e) => !e.correct).length;
    const reactions = batch.map((e) => e.reactionMs).filter((r) => r > 0 && r < 5000);

    const totalPresses = (prev?.totalPresses || 0) + addedTotal;
    const wrongPresses = (prev?.wrongPresses || 0) + addedWrong;
    const accuracy =
      totalPresses > 0
        ? Math.round(((totalPresses - wrongPresses) / totalPresses) * 1000) / 10
        : 100;

    const prevAvg = prev?.avgReactionMs || 0;
    const prevCount = prev?.totalPresses || 0;
    const batchAvg =
      reactions.length > 0 ? reactions.reduce((a, b) => a + b, 0) / reactions.length : prevAvg;
    const avgReactionMs =
      reactions.length > 0
        ? Math.round((prevAvg * Math.min(prevCount, 30) + batchAvg * reactions.length) / (Math.min(prevCount, 30) + reactions.length))
        : prevAvg;

    const consistency = reactions.length > 0 ? Math.round(stdDev(reactions)) : prev?.consistency || 0;
    const weakKeyScore = computeWeakKeyScore(accuracy, avgReactionMs, wrongPresses, totalPresses, consistency);
    const trend = prev
      ? computeTrend(prev.weakKeyScore, weakKeyScore, prev.wrongPresses, wrongPresses)
      : ('stable' as KeyTrend);

    next[key] = {
      key,
      totalPresses,
      wrongPresses,
      accuracy,
      avgReactionMs,
      consistency,
      trend,
      weakKeyScore,
      lastUpdated: Date.now(),
    };
  });

  return next;
}

export function getWeakestKeys(stats: Record<string, KeyStat>, limit = 8): KeyStat[] {
  return Object.values(stats)
    .filter((s) => s.totalPresses >= 3)
    .sort((a, b) => b.weakKeyScore - a.weakKeyScore)
    .slice(0, limit);
}

export function keyStatsToPressArray(stats: Record<string, KeyStat>): { key: string; correct: number; incorrect: number }[] {
  return Object.values(stats).map((s) => ({
    key: s.key,
    correct: s.totalPresses - s.wrongPresses,
    incorrect: s.wrongPresses,
  }));
}

export function getHandAccuracy(stats: Record<string, KeyStat>, hand: 'left' | 'right'): number {
  const keys = Object.values(stats).filter((s) =>
    hand === 'left'
      ? ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'].includes(s.key)
      : ['y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', 'n', 'm'].includes(s.key)
  );
  if (keys.length === 0) return 100;
  const total = keys.reduce((s, k) => s + k.totalPresses, 0);
  const wrong = keys.reduce((s, k) => s + k.wrongPresses, 0);
  return total > 0 ? Math.round(((total - wrong) / total) * 1000) / 10 : 100;
}
