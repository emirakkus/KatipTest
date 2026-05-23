import type { PerformanceBadge } from './types';

export function getPerformanceBadge(accuracy: number, completion: number): PerformanceBadge {
  if (accuracy >= 95 && completion >= 90) return 'excellent';
  if (accuracy >= 88 && completion >= 75) return 'good';
  if (accuracy >= 75 && completion >= 50) return 'average';
  return 'needs_work';
}

export function badgeLabel(badge: PerformanceBadge): string {
  const map: Record<PerformanceBadge, string> = {
    excellent: 'Mükemmel',
    good: 'İyi',
    average: 'Orta',
    needs_work: 'Geliştirilmeli',
  };
  return map[badge];
}

export function badgeColor(badge: PerformanceBadge): string {
  const map: Record<PerformanceBadge, string> = {
    excellent: 'text-emerald-400',
    good: 'text-blue-400',
    average: 'text-amber-400',
    needs_work: 'text-rose-400',
  };
  return map[badge];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function computeCompletion(typedWords: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  return Math.min(100, Math.round((typedWords / totalWords) * 1000) / 10);
}

export function avgReactionMs(events: { reactionMs: number }[]): number {
  const valid = events.map((e) => e.reactionMs).filter((r) => r > 0 && r < 5000);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}
