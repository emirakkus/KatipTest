import type { AnalyticsStore, KeyPressEvent, SessionSnapshot } from './types';
import { mergeKeyEvents, getWeakestKeys } from './keyStats';
import {
  appendSessionSnapshot,
  getLocalDateKey,
  saveAnalytics,
  updateDailyWeakKeys,
} from './persistence';
import { recordPracticeDay } from './streak';

export interface ProcessSessionParams {
  events: KeyPressEvent[];
  accuracy: number;
  wpm: number;
  mistakes: number;
  trainerSession?: boolean;
}

export function processSessionEnd(
  store: AnalyticsStore,
  params: ProcessSessionParams
): AnalyticsStore {
  let next: AnalyticsStore = {
    ...store,
    keyStats: mergeKeyEvents(store.keyStats, params.events),
  };

  next = updateDailyWeakKeys(next, params.accuracy, params.wpm, params.mistakes);
  next = {
    ...next,
    practiceStreak: recordPracticeDay(next.practiceStreak),
  };

  const snapshot: SessionSnapshot = {
    timestamp: Date.now(),
    date: getLocalDateKey(),
    accuracy: params.accuracy,
    wpm: params.wpm,
    mistakes: params.mistakes,
    weakKeys: getWeakestKeys(next.keyStats, 6).map((k) => k.key),
    trainerSession: params.trainerSession,
  };

  next = appendSessionSnapshot(next, snapshot);
  saveAnalytics(next);
  return next;
}
