export type PerformanceBadge = 'excellent' | 'good' | 'average' | 'needs_work';

export interface ExamHistoryEntry {
  examId: string;
  examTitle: string;
  date: string;
  timestamp: number;
  wpm: number;
  accuracy: number;
  errors: number;
  duration: number;
  completion: number;
  correctChars: number;
  incorrectChars: number;
  totalTypedChars: number;
  avgReactionMs: number;
  badge: PerformanceBadge;
}

export interface ExamBestScore {
  examId: string;
  bestWpm: number;
  bestAccuracy: number;
  bestCompletion: number;
  attempts: number;
}

export interface ExamProgressStore {
  version: number;
  history: ExamHistoryEntry[];
  bestByExam: Record<string, ExamBestScore>;
}

export interface ExamLiveResult {
  examId: string;
  examTitle: string;
  category: string;
  difficulty: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  totalTypedChars: number;
  correctChars: number;
  incorrectChars: number;
  completion: number;
  timeSpent: number;
  avgReactionMs: number;
  badge: PerformanceBadge;
  netWords: number;
  grossWords: number;
}

export type ExamTimerMode = 'auto' | 60 | 180 | 300 | 0;

export interface ExamLaunchConfig {
  timerMode: ExamTimerMode;
  fullscreen: boolean;
}
