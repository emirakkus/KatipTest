export type KeyTrend = 'improving' | 'declining' | 'stable';

export interface KeyStat {
  key: string;
  totalPresses: number;
  wrongPresses: number;
  accuracy: number;
  avgReactionMs: number;
  consistency: number;
  trend: KeyTrend;
  weakKeyScore: number;
  lastUpdated: number;
}

export interface KeyPressEvent {
  key: string;
  correct: boolean;
  reactionMs: number;
  timestamp: number;
}

export interface DailyWeakKeysEntry {
  date: string;
  weakestKeys: string[];
  avgAccuracy: number;
  avgSpeed: number;
  mistakes: number;
}

export interface PracticeStreak {
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  todayCompleted: boolean;
}

export interface SessionSnapshot {
  timestamp: number;
  date: string;
  accuracy: number;
  wpm: number;
  mistakes: number;
  weakKeys: string[];
  trainerSession?: boolean;
}

export interface AnalyticsStore {
  version: number;
  keyStats: Record<string, KeyStat>;
  dailyWeakKeys: DailyWeakKeysEntry[];
  practiceStreak: PracticeStreak;
  sessionSnapshots: SessionSnapshot[];
}

export type TrainerDifficulty = 'easy' | 'medium' | 'hard';
export type TrainerFocus = 'weak' | 'left' | 'right' | 'retry' | 'letter';

export interface TrainerConfig {
  durationSec: number;
  difficulty: TrainerDifficulty;
  focus: TrainerFocus;
  /** Harf bazlı antrenman (focus === 'letter') */
  targetKey?: string;
}

export interface ProgressComparison {
  label: string;
  accuracyDelta: number;
  wpmDelta: number;
  errorDelta: number;
  weakKeyImprovement: number;
}

export interface ResultSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  text: string;
  action?: 'trainer' | 'analytics';
}

export const ANALYTICS_STORAGE_KEY = 'katiptest_analytics';
export const ANALYTICS_VERSION = 1;

export const LEFT_HAND_KEYS = new Set([
  'q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b',
  '1', '2', '3', '4', '5', 'ç', 'ğ', 'ü', 'ö', 'ş', 'ı',
]);

export const RIGHT_HAND_KEYS = new Set([
  'y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', 'n', 'm',
  '6', '7', '8', '9', '0', '-', '=',
]);

export const STREAK_MILESTONES = [3, 7, 14, 30, 100] as const;
