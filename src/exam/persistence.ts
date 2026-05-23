import type { ExamHistoryEntry, ExamLiveResult, ExamProgressStore } from './types';
import { getPerformanceBadge } from './utils';

const STORAGE_KEY = 'katiptest_exam_progress';
const VERSION = 1;

const DEFAULT_STORE: ExamProgressStore = {
  version: VERSION,
  history: [],
  bestByExam: {},
};

export function loadExamProgress(): ExamProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw) as Partial<ExamProgressStore>;
    return {
      version: VERSION,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 200) : [],
      bestByExam: parsed.bestByExam || {},
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

export function saveExamProgress(store: ExamProgressStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, version: VERSION }));
  } catch (err) {
    console.error('saveExamProgress error:', err);
  }
}

export function recordExamAttempt(store: ExamProgressStore, result: ExamLiveResult): ExamProgressStore {
  const entry: ExamHistoryEntry = {
    examId: result.examId,
    examTitle: result.examTitle,
    date: new Date().toLocaleDateString('tr-TR'),
    timestamp: Date.now(),
    wpm: result.wpm,
    accuracy: result.accuracy,
    errors: result.mistakes,
    duration: result.timeSpent,
    completion: result.completion,
    correctChars: result.correctChars,
    incorrectChars: result.incorrectChars,
    totalTypedChars: result.totalTypedChars,
    avgReactionMs: result.avgReactionMs,
    badge: result.badge,
  };

  const history = [entry, ...store.history].slice(0, 200);
  const prev = store.bestByExam[result.examId];
  const bestByExam = {
    ...store.bestByExam,
    [result.examId]: {
      examId: result.examId,
      bestWpm: Math.max(prev?.bestWpm ?? 0, result.wpm),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, result.accuracy),
      bestCompletion: Math.max(prev?.bestCompletion ?? 0, result.completion),
      attempts: (prev?.attempts ?? 0) + 1,
    },
  };

  return { version: VERSION, history, bestByExam };
}

export function getExamProgressSummary(store: ExamProgressStore, totalExams: number) {
  const completedIds = new Set(store.history.map((h) => h.examId));
  const last = store.history[0];
  const prev = store.history[1];
  let improvementPct = 0;
  if (last && prev && last.examId === prev.examId) {
    improvementPct = Math.round(last.accuracy - prev.accuracy);
  } else if (last && prev) {
    improvementPct = Math.round(last.wpm - prev.wpm);
  }

  const avgAccuracy =
    store.history.length > 0
      ? Math.round((store.history.reduce((s, h) => s + h.accuracy, 0) / store.history.length) * 10) / 10
      : 0;

  return {
    completedCount: completedIds.size,
    remainingCount: Math.max(0, totalExams - completedIds.size),
    totalAttempts: store.history.length,
    avgAccuracy,
    improvementPct,
  };
}

export { getPerformanceBadge };
