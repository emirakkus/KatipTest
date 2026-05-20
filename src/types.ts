export interface WordState {
  word: string;
  isCorrect: boolean;
  isIncorrect: boolean;
  isCurrent: boolean;
}

export interface TestResult {
  date: string;
  timestamp: number;
  textIndex: number;
  netWords: number;
  grossWords: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  accuracy: number;
  wpm: number;
  passedBarrier: boolean;
  hardMode: boolean;
  suddenDeath: boolean;
  distractionMode: boolean;
  gameMode: boolean;
  aiTextMode: boolean;
  keyboardType: 'F' | 'Q';
  timeLimit: number;
  targetWords: number;
  paceWPM: number;
  usePace: boolean;
  useCustomText: boolean;
  theme: string;
  blurIntensity: number;
  keyPresses: { key: string; correct: number; incorrect: number }[];
  errorWords: { word: string; count: number }[];
  wordErrorDetails?: { expected: string; typed: string; errorType: string; charErrors: number }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface UserSettings {
  darkMode: boolean;
  hardMode: boolean;
  zenMode: boolean;
  soundEnabled: boolean;
  distractionMode: boolean;
  gameMode: boolean;
  suddenDeath: boolean;
  aiTextMode: boolean;
  keyboardType: 'F' | 'Q';
  ghostMode: boolean;
  timeLimit: number;
  customTime: number;
  targetWords: number;
  useTargetWords: boolean;
  paceWPM: number;
  usePace: boolean;
  blurIntensity: number;
  lineByLineBlur: boolean;
  fontSize: number;
  lineHeight: number;
  theme: 'modern' | 'retro' | 'cinematic';
  showEffects: boolean;
  customText: string;
  useCustomText: boolean;
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard';
}

export interface TextCatalogItem {
  id: string;
  title: string;
  text: string;
  year: number;
  institution: 'Adliye Zabıt Katipliği' | 'İcra Katipliği' | 'Danıştay' | 'Yargıtay' | 'Genel Hukuk';
  difficulty: 'easy' | 'medium' | 'hard';
  words: number;
  chars: number;
}

export interface ThemeStyle {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  fontFamily: string;
}

export interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}
