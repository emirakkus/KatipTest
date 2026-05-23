import type { AnalyticsStore, DailyWeakKeysEntry, PracticeStreak, SessionSnapshot } from './types';
import { ANALYTICS_STORAGE_KEY, ANALYTICS_VERSION } from './types';
import { getWeakestKeys } from './keyStats';

const DEFAULT_STREAK: PracticeStreak = {
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  todayCompleted: false,
};

const DEFAULT_STORE: AnalyticsStore = {
  version: ANALYTICS_VERSION,
  keyStats: {},
  dailyWeakKeys: [],
  practiceStreak: { ...DEFAULT_STREAK },
  sessionSnapshots: [],
};

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadAnalytics(): AnalyticsStore {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw) as Partial<AnalyticsStore>;
    return migrateAnalytics(parsed);
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function migrateAnalytics(data: Partial<AnalyticsStore>): AnalyticsStore {
  return {
    version: ANALYTICS_VERSION,
    keyStats: data.keyStats || {},
    dailyWeakKeys: Array.isArray(data.dailyWeakKeys) ? data.dailyWeakKeys : [],
    practiceStreak: { ...DEFAULT_STREAK, ...(data.practiceStreak || {}) },
    sessionSnapshots: Array.isArray(data.sessionSnapshots) ? data.sessionSnapshots.slice(0, 50) : [],
  };
}

export function saveAnalytics(store: AnalyticsStore): void {
  try {
    localStorage.setItem(
      ANALYTICS_STORAGE_KEY,
      JSON.stringify({ ...store, version: ANALYTICS_VERSION })
    );
  } catch (err) {
    console.error('saveAnalytics error:', err);
  }
}

export function updateDailyWeakKeys(
  store: AnalyticsStore,
  sessionAccuracy: number,
  sessionWpm: number,
  sessionMistakes: number
): AnalyticsStore {
  const date = getLocalDateKey();
  const weakest = getWeakestKeys(store.keyStats, 6).map((k) => k.key);
  const logs = [...store.dailyWeakKeys];
  const idx = logs.findIndex((l) => l.date === date);

  if (idx >= 0) {
    const existing = logs[idx];
    const mergedWeak = [...new Set([...weakest, ...existing.weakestKeys])].slice(0, 8);
    const n = existing.mistakes > 0 ? 2 : 1;
    logs[idx] = {
      date,
      weakestKeys: mergedWeak,
      avgAccuracy: Math.round(((existing.avgAccuracy + sessionAccuracy) / n) * 10) / 10,
      avgSpeed: Math.round(((existing.avgSpeed + sessionWpm) / n) * 10) / 10,
      mistakes: existing.mistakes + sessionMistakes,
    };
  } else {
    logs.push({
      date,
      weakestKeys: weakest,
      avgAccuracy: sessionAccuracy,
      avgSpeed: sessionWpm,
      mistakes: sessionMistakes,
    });
  }

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const filtered = logs.filter((l) => {
    const t = new Date(l.date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });

  return { ...store, dailyWeakKeys: filtered };
}

export function appendSessionSnapshot(
  store: AnalyticsStore,
  snapshot: SessionSnapshot
): AnalyticsStore {
  const sessionSnapshots = [snapshot, ...store.sessionSnapshots].slice(0, 50);
  return { ...store, sessionSnapshots };
}

export function syncLegacyStreak(
  store: AnalyticsStore,
  legacyStreak: number,
  legacyLastDate: string | null
): AnalyticsStore {
  if (store.practiceStreak.currentStreak > 0 || !legacyStreak) return store;
  const today = getLocalDateKey();
  const last =
    legacyLastDate && legacyLastDate.includes('-')
      ? legacyLastDate
      : legacyLastDate
        ? new Date(legacyLastDate).toISOString().slice(0, 10)
        : null;
  return {
    ...store,
    practiceStreak: {
      currentStreak: legacyStreak,
      longestStreak: Math.max(legacyStreak, store.practiceStreak.longestStreak),
      lastPracticeDate: last,
      todayCompleted: last === today,
    },
  };
}

export type { DailyWeakKeysEntry };
