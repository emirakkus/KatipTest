import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateResultPdf } from './utils/pdf';
import { loadProfile, saveProfile, updateWeakWords, updateDailyLog, generateWeakWordText, checkFatigue, createGoal, generateMissions, claimMissionXP, updateCareer, CAREER_STAGES, type UserProfile, type RhythmPoint, type CareerStage } from './store';
import { saveContactMessage, signUp, signIn, signOut, getUser, getSession, loadProfileFromDb, getTestHistory, getLeaderboard, saveTestResult, saveProfileToDb, syncToCloud, isDbEnabled } from './db';
import { LEGAL_PHRASES, SPECIAL_9_MIN_TEXT, TEXTS_EASY, TEXTS_MEDIUM, TEXTS_HARD } from './data/texts';
import { pickTekerleme, TEKERLEME_DURATION_SEC } from './data/tekerlemeler';
import {
  loadAnalytics,
  saveAnalytics,
  processSessionEnd,
  syncLegacyStreak,
  refreshStreakForToday,
  normalizeKey,
  generateTrainerText,
  describeTrainerFocus,
  getWeakestKeys,
  generateResultSuggestions,
  type AnalyticsStore,
  type KeyPressEvent,
  type TrainerConfig,
} from './analytics';
import { AlarmClockTimer } from './components/AlarmClockTimer';
import { AnalyticsPanel } from './components/analytics/AnalyticsPanel';
import { KeyboardHeatmap } from './components/analytics/KeyboardHeatmap';
import { ResultSuggestions } from './components/analytics/ResultSuggestions';
import { examTexts, resolveExamTimerSeconds, type ExamText } from './data/examTexts';
import {
  loadExamProgress,
  saveExamProgress,
  recordExamAttempt,
  generateExamSuggestions,
  getPerformanceBadge,
  computeCompletion,
  avgReactionMs,
  type ExamLiveResult,
  type ExamProgressStore,
  type ExamTimerMode,
  buildExamWordResultsFromSession,
  summarizeWordResults,
  type ExamWordResult,
} from './exam';
import { ModesHub } from './components/exam/ModesHub';
import { ExamCatalog } from './components/exam/ExamCatalog';
import { ExamCountdown } from './components/exam/ExamCountdown';
import { ExamResultScreen } from './components/exam/ExamResultScreen';
import { ExamWrongWordsPanel } from './components/exam/ExamWrongWordsPanel';


const PENDING_SIGNUP_NAME_KEY = 'katiptest_pending_signup_name';

const EXAM_TEXTS_MAP: Record<string, string[]> = {
  easy: TEXTS_EASY,
  medium: TEXTS_MEDIUM,
  hard: TEXTS_HARD,
  all: [...TEXTS_EASY, ...TEXTS_MEDIUM, ...TEXTS_HARD]
};

interface TestResult {
  date: string; timestamp: number; textIndex: number; netWords: number; grossWords: number;
  correctChars: number; incorrectChars: number; totalChars: number; accuracy: number; wpm: number;
  passedBarrier: boolean; hardMode: boolean; suddenDeath: boolean; distractionMode: boolean;
  gameMode: boolean; aiTextMode: boolean; keyboardType: 'F' | 'Q'; timeLimit: number;
  targetWords: number; paceWPM: number; usePace: boolean; useCustomText: boolean; theme: string;
  keyPresses: { key: string; correct: number; incorrect: number }[];
  errorWords: { word: string; count: number }[];
  wordErrorDetails?: { expected: string; typed: string; errorType: string; charErrors: number }[];
  examWordResults?: ExamWordResult[];
  trainerSession?: boolean;
}
interface Badge { id: string; name: string; description: string; icon: string; earned: boolean; earnedDate?: string; }

interface UserSettings {
  darkMode: boolean; hardMode: boolean; zenMode: boolean; soundEnabled: boolean;
  distractionMode: boolean; gameMode: boolean; suddenDeath: boolean; aiTextMode: boolean;
  keyboardType: 'F' | 'Q'; ghostMode: boolean;
  timeLimit: number; customTime: number; targetWords: number; useTargetWords: boolean;
  paceWPM: number; usePace: boolean;
  fontSize: number; lineHeight: number;
  theme: 'modern' | 'retro' | 'cinematic';
  showEffects: boolean;
  customText: string; useCustomText: boolean;
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard';
}

const KEYBOARD_LAYOUT_F = [
  ['1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','y','u','i','o','p','ç','ü'],
  ['a','s','d','f','g','h','j','k','l','ş','ı'],
  ['z','x','c','v','b','n','m','ö','ğ'],
  ['Space']
];

const KEYBOARD_LAYOUT_Q = [
  ['1','2','3','4','5','6','7','8','9','0','-','='],
  ['q','w','e','r','t','z','u','i','o','p','^','ö'],
  ['a','s','d','f','g','h','j','k','l','ğ','ü'],
  ['e','r','x','c','v','b','n','m','ş','ı'],
  ['Space']
];

const BADGES: Badge[] = [
  { id: 'first_barrier', name: 'İlk Baraj', description: 'İlk kez 90 kelime barajını aştınız', icon: '🏆', earned: false },
  { id: 'perfect_score', name: 'Mükemmel', description: '%100 doğrulukla bir test tamamladınız', icon: '⭐', earned: false },
  { id: 'speed_demon', name: 'Hız Şampiyonu', description: '100+ WPM ile bir test tamamladınız', icon: '⚡', earned: false },
  { id: 'sudden_death', name: 'Hayatta Kalan', description: 'Kırmızı Çizgi modunu tamamladınız', icon: '💀', earned: false },
  { id: 'distraction_master', name: 'Odak Ustası', description: 'Gürültü modunda 90+ kelime yazdınız', icon: '🎧', earned: false },
  { id: 'game_master', name: 'Oyun Ustası', description: 'Oyun modunda 10 test tamamladınız', icon: '🎮', earned: false },
  { id: 'streak_7', name: 'Haftalık', description: '7 gün boyunca seri yaptınız', icon: '🔥', earned: false },
  { id: '100_tests', name: 'Usta', description: '100 test tamamladınız', icon: '🎓', earned: false },
  { id: 'pace_master', name: 'Ritim Ustası', description: 'Pace modunda hedef hızı tutturdunuz', icon: '🎯', earned: false },
  { id: 'custom_champion', name: 'Özel Şampiyon', description: 'Özel metinle 90+ kelime yazdınız', icon: '📝', earned: false },
];

const NINE_MIN_EXAM_SECONDS = 540;
/** 3 dk sınav referans metni ile aynı okunaklı punto — tüm modlarda */
const REFERENCE_FONT_MAX = 20;
const REFERENCE_FONT_BOOST = 5;
const REFERENCE_LINE_HEIGHT = 1.72;

const getReferenceFontPx = (baseFontSize: number) =>
  Math.min(baseFontSize + REFERENCE_FONT_BOOST, REFERENCE_FONT_MAX);

export default function App() {

  const [gameState, setGameState] = useState<'landing' | 'menu' | 'playing' | 'finished' | 'sudden_death' | 'profile' | 'blog' | 'roadmap' | 'career' | 'exam_setup' | 'contact' | 'leaderboard' | 'analytics' | 'modes_hub' | 'exam_catalog' | 'exam_countdown' | 'exam_finished'>('landing');
  const [analytics, setAnalytics] = useState<AnalyticsStore>(() => loadAnalytics());
  const [examProgress, setExamProgress] = useState<ExamProgressStore>(() => loadExamProgress());
  const [examLastResult, setExamLastResult] = useState<ExamLiveResult | null>(null);
  const [countdownValue, setCountdownValue] = useState(3);
  const [dedicatedExamActive, setDedicatedExamActive] = useState(false);
  const [examTimerUnlimited, setExamTimerUnlimited] = useState(false);
  const [activeExamTitle, setActiveExamTitle] = useState('');
  const [examMode, setExamMode] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [examKeyboard, setExamKeyboard] = useState<'F' | 'Q'>('F');
  const [examReady, setExamReady] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [completedWords, setCompletedWords] = useState<{ word: string; isCorrect: boolean; correctWord: string; skipped?: boolean }[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastTestDate, setLastTestDate] = useState<string | null>(null);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedChartResult, setSelectedChartResult] = useState<any | null>(null);
  const [coachText, setCoachText] = useState<string | null>(null);
  const [gameObstacles, setGameObstacles] = useState<{ x: number; type: string }[]>([]);
  const [chartTab, setChartTab] = useState<'words' | 'chars' | 'perf'>('words');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(9);
  const [profile, setProfile] = useState<UserProfile>(loadProfile());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showFatigueWarning, setShowFatigueWarning] = useState(false);
  const [news, setNews] = useState<{ title: string; link: string; date: string; source: string }[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [levelUpData, setLevelUpData] = useState<{ show: boolean; oldLevel: number; newLevel: number; xpGained: number } | null>(null);
  const [careerPromotion, setCareerPromotion] = useState<CareerStage | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'sending'; message: string }>({ type: 'idle', message: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authStatus, setAuthStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthStatus({ type: 'idle', message: '' });
    setAuthForm({ name: '', email: '', password: '' });
    setShowAuthModal(true);
  };
  const [dbUserEmail, setDbUserEmail] = useState<string | null>(null);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileNameSaveStatus, setProfileNameSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const dbEnabled = isDbEnabled();
  const [leaderboardTab, setLeaderboardTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [rhythmData, setRhythmData] = useState<RhythmPoint[]>([]);
  const [goalInput, setGoalInput] = useState({ targetWords: 120, targetChars: 500, weeks: 4 });
  const rhythmRef = useRef<RhythmPoint[]>([]);
  const initialTimeRef = useRef(180);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  
  const [settings, setSettings] = useState<UserSettings>({
    darkMode: true, hardMode: false, zenMode: false, soundEnabled: true,
    distractionMode: false, gameMode: false, suddenDeath: false, aiTextMode: false,
    keyboardType: 'F', ghostMode: false,
    timeLimit: 180, customTime: 180, targetWords: 100, useTargetWords: false,
    paceWPM: 60, usePace: false,
    fontSize: 19, lineHeight: 1.8,
    theme: 'modern', showEffects: true,
    customText: '', useCustomText: false,
    difficultyFilter: 'all',
  });

  const [tekerlemeMode, setTekerlemeMode] = useState(false);
  const [activeTekerlemeTitle, setActiveTekerlemeTitle] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientOscillatorsRef = useRef<OscillatorNode[]>([]);
  const completedWordsRef = useRef(completedWords);
  const timeRemainingRef = useRef(timeRemaining);
  const currentTextRef = useRef(currentText);
  useEffect(() => { completedWordsRef.current = completedWords; }, [completedWords]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { currentTextRef.current = currentText; }, [currentText]);
  useEffect(() => {
    if (gameState === 'profile') {
      setProfileNameDraft(profile.name || '');
      setProfileNameSaveStatus('idle');
    }
  }, [gameState, profile.name]);
  const endGameRef = useRef<(sd?: boolean) => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const writingAreaRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [referenceFontSize, setReferenceFontSize] = useState(settings.fontSize);
  const examPanelRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientLoopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paceIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paceProgress, setPaceProgress] = useState(0);
  const keySessionRef = useRef<{ events: KeyPressEvent[]; lastTs: number }>({ events: [], lastTs: 0 });
  const trainerModeRef = useRef(false);
  const dedicatedExamRef = useRef<{ exam: ExamText; timerSeconds: number; fullscreen: boolean } | null>(null);
  const examModeRef = useRef(examMode);
  const examTimerUnlimitedRef = useRef(false);
  useEffect(() => { examModeRef.current = examMode; }, [examMode]);

  const hideExamHeader =
    gameState === 'modes_hub' ||
    gameState === 'exam_setup' ||
    gameState === 'exam_countdown' ||
    gameState === 'exam_finished' ||
    gameState === 'exam_catalog' ||
    (gameState === 'finished' && examMode) ||
    (gameState === 'playing' && (examMode || dedicatedExamActive));
  const examFocusMode = gameState === 'playing' && (examMode || dedicatedExamActive);
  const modesNavActive = gameState === 'modes_hub' || gameState === 'exam_catalog';

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('keyboardTestApp');
      if (savedData) {
        const data = JSON.parse(savedData);
        if (data.history) setHistory(data.history);
        if (data.badges) setBadges(data.badges);
        if (data.streak) setStreak(data.streak);
        if (data.lastTestDate) setLastTestDate(data.lastTestDate);
        if (data.settings) setSettings(prev => ({
          ...prev,
          ...data.settings,
        }));
        setAnalytics((prev) => {
          const synced = syncLegacyStreak(prev, data.streak || 0, data.lastTestDate || null);
          const refreshed = refreshStreakForToday(synced.practiceStreak);
          if (refreshed.currentStreak > 0 && !data.streak) {
            setStreak(refreshed.currentStreak);
          }
          return { ...synced, practiceStreak: refreshed };
        });
      } else {
        setAnalytics((prev) => ({
          ...prev,
          practiceStreak: refreshStreakForToday(prev.practiceStreak),
        }));
      }
    } catch {}
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) setShowMobileWarning(true);
    try { audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}

    // E-posta doğrulama callback route desteği
    if (window.location.pathname === '/auth/callback') {
      getSession().then(async (session) => {
        if (session) {
          const user = await getUser();
          if (user?.email) setDbUserEmail(user.email);
          const pendingName = localStorage.getItem(PENDING_SIGNUP_NAME_KEY) || '';
          if (pendingName) {
            const updatedLocal = { ...profile, name: pendingName };
            setProfile(updatedLocal);
            saveProfile(updatedLocal);
            await saveProfileToDb({ name: pendingName, avatar: updatedLocal.avatar || '👤' }).catch(() => {});
            localStorage.removeItem(PENDING_SIGNUP_NAME_KEY);
            await syncToCloud(updatedLocal, history);
          } else {
            const cloudProfile = await loadProfileFromDb();
            const merged = cloudProfile ? { ...profile, name: cloudProfile.name || profile.name, avatar: cloudProfile.avatar || profile.avatar } : profile;
            await syncToCloud(merged, history);
          }
          window.history.replaceState({}, '', '/');
          setShowAuthModal(false);
          setAuthStatus({ type: 'success', message: 'E-posta doğrulandı. Giriş tamamlandı.' });
          setGameState('menu');
        }
      }).catch(() => {
        window.history.replaceState({}, '', '/');
      });
    }

    // DB oturumu varsa kullanıcıyı ve profilini yükle
    getUser().then(async (u) => {
      if (u?.email) {
        setDbUserEmail(u.email);
        const cloudProfile = await loadProfileFromDb();
        if (cloudProfile) {
          setProfile(prev => ({
            ...prev,
            name: cloudProfile.name || prev.name,
            avatar: cloudProfile.avatar || prev.avatar,
            xp: cloudProfile.xp || prev.xp,
            careerStage: cloudProfile.career_stage || prev.careerStage,
            careerTestsAtStage: cloudProfile.career_tests || prev.careerTestsAtStage,
            careerBestWords: cloudProfile.career_best_words || prev.careerBestWords,
            careerBestAccuracy: cloudProfile.career_best_accuracy || prev.careerBestAccuracy,
            totalTests: cloudProfile.total_tests || prev.totalTests,
            totalPracticeMinutes: cloudProfile.total_practice_minutes || prev.totalPracticeMinutes,
            weakWords: cloudProfile.weak_words || prev.weakWords,
            dailyLogs: cloudProfile.daily_logs || prev.dailyLogs,
            completedMissionIds: cloudProfile.completed_missions || prev.completedMissionIds,
          }));
        }
        const cloudHistory = await getTestHistory(100);
        if (cloudHistory.length > 0) {
          setHistory(cloudHistory.map((h: any) => ({
            date: new Date(h.created_at).toLocaleDateString('tr-TR'),
            timestamp: new Date(h.created_at).getTime(),
            textIndex: -10,
            netWords: h.net_words || 0,
            grossWords: h.gross_words || 0,
            correctChars: h.correct_chars || 0,
            incorrectChars: Math.max(0, (h.total_chars || 0) - (h.correct_chars || 0)),
            totalChars: h.total_chars || 0,
            accuracy: h.accuracy || 0,
            wpm: h.wpm || 0,
            passedBarrier: (h.net_words || 0) >= 90,
            hardMode: h.hard_mode || false,
            suddenDeath: h.sudden_death || false,
            distractionMode: false,
            gameMode: false,
            aiTextMode: false,
            keyboardType: 'F',
            timeLimit: h.time_limit || 180,
            targetWords: 100,
            paceWPM: 60,
            usePace: false,
            useCustomText: false,
            theme: 'modern',
            keyPresses: [],
            errorWords: [],
            wordErrorDetails: []
          })));
        }
      }
    }).catch(() => {});
    // Haberleri otomatik çek
    fetch('/api/news').then(r => r.json()).then(data => { if (data.news) setNews(data.news); }).catch(() => {}).finally(() => setNewsLoading(false));
  }, []);

  useEffect(() => {
    try {
      const data = { history, badges, streak, lastTestDate, settings };
      localStorage.setItem('keyboardTestApp', JSON.stringify(data));
    } catch (err) {
      console.error('keyboardTestApp save error:', err);
    }
  }, [history, badges, streak, lastTestDate, settings]);

  const generateAItext = useCallback(() => {
    const sentences: string[] = [];
    const length = 15 + Math.floor(Math.random() * 10);
    for (let i = 0; i < length; i++) {
      const opening = LEGAL_PHRASES.openings[Math.floor(Math.random() * LEGAL_PHRASES.openings.length)].replace(/,/g, '');
      const subject = LEGAL_PHRASES.subjects[Math.floor(Math.random() * LEGAL_PHRASES.subjects.length)];
      const action = LEGAL_PHRASES.actions[Math.floor(Math.random() * LEGAL_PHRASES.actions.length)].replace(/,/g, '').replace(/\./g, '');
      const connector = LEGAL_PHRASES.connectors[Math.floor(Math.random() * LEGAL_PHRASES.connectors.length)].replace(/,/g, '');
      const term = LEGAL_PHRASES.legalTerms[Math.floor(Math.random() * LEGAL_PHRASES.legalTerms.length)];
      if (i === 0) {
        sentences.push(`${opening} ${subject} ${action}`);
      } else {
        const pattern = Math.floor(Math.random() * 3);
        if (pattern === 0) sentences.push(`${connector} ${subject} ${term} ile ilişkilendirilmektedir`);
        else if (pattern === 1) sentences.push(`${term} kavramı ${subject} kapsamında değerlendirilmektedir`);
        else sentences.push(`${connector} ${action}`);
      }
    }
    return sentences.join(' ');
  }, []);

  const startAmbientSound = useCallback(() => {
    if (!settings.distractionMode || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const ctx = audioContextRef.current;
    const oscillators: OscillatorNode[] = [];
    for (let i = 0; i < 5; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(100 + Math.random() * 200, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillators.push(oscillator);
    }
    ambientOscillatorsRef.current = oscillators;
    ambientLoopRef.current = setInterval(() => {
      if (Math.random() > 0.7) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = Math.random() > 0.5 ? 'sawtooth' : 'square';
        oscillator.frequency.setValueAtTime(80 + Math.random() * 150, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
      }
    }, 200);
  }, [settings.distractionMode]);

  const stopAmbientSound = useCallback(() => {
    ambientOscillatorsRef.current.forEach((osc: OscillatorNode) => { try { osc.stop(); } catch {} });
    ambientOscillatorsRef.current = [];
    if (ambientLoopRef.current) { clearInterval(ambientLoopRef.current); ambientLoopRef.current = null; }
  }, []);

  const playSound = useCallback((frequency: number, duration: number = 0.1, type: OscillatorType = 'sine') => {
    if (!settings.soundEnabled || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, [settings.soundEnabled]);

  const createParticles = useCallback((x: number, y: number) => {
    if (!settings.showEffects) return;
    const newParticles = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: x + (Math.random() - 0.5) * 100,
      y: y + (Math.random() - 0.5) * 100,
      color: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'][Math.floor(Math.random() * 4)]
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 1000);
  }, [settings.showEffects]);

  const checkAndAwardBadges = useCallback((result: TestResult) => {
    setBadges(prev => {
      const newBadges = [...prev];
      let changed = false;
      const award = (id: string) => {
        const badge = newBadges.find(b => b.id === id);
        if (badge && !badge.earned) { badge.earned = true; badge.earnedDate = new Date().toLocaleDateString('tr-TR'); changed = true; }
      };
      if (result.passedBarrier) award('first_barrier');
      if (result.accuracy === 100) award('perfect_score');
      if (result.wpm >= 100) award('speed_demon');
      if (result.suddenDeath && result.passedBarrier) award('sudden_death');
      if (result.distractionMode && result.netWords >= 90) award('distraction_master');
      if ([...history, result].filter(r => r.gameMode).length >= 10) award('game_master');
      if ([...history, result].length >= 100) award('100_tests');
      if (result.usePace && Math.abs(result.wpm - result.paceWPM) <= 5) award('pace_master');
      if (result.useCustomText && result.netWords >= 90) award('custom_champion');
      return changed ? newBadges : prev;
    });
  }, [history]);

  const removeTurkishDiacritics = (value: string) => value;

  const generateNewText = useCallback((forSeconds?: number) => {
    let text: string;
    let newIndex = currentTextIndex;
    
    // Süreye göre gerekli metin uzunluğunu hesapla (dakika * ~50 kelime)
    const seconds = forSeconds || settings.timeLimit;
    const timeInMinutes = seconds / 60;
    const neededWords = Math.max(100, Math.ceil(timeInMinutes * 50));
    
    if (seconds >= NINE_MIN_EXAM_SECONDS && !settings.useCustomText && !settings.aiTextMode) {
      text = SPECIAL_9_MIN_TEXT.replace(/\s+/g, ' ').trim();
      let guard = 0;
      while (text.split(/\s+/).length < neededWords && guard < 50) {
        text += ' ' + SPECIAL_9_MIN_TEXT.replace(/\s+/g, ' ').trim();
        guard++;
      }
      text = removeTurkishDiacritics(text).replace(/\s+/g, ' ').trim();
      newIndex = -5;
    } else if (settings.useCustomText && settings.customText) {
      text = settings.customText;
      let guard = 0;
      while (text.split(/\s+/).length < neededWords && guard < 100) {
        text += ' ' + settings.customText;
        guard++;
      }
      newIndex = -2;
    } else if (settings.aiTextMode) {
      text = generateAItext();
      let guard = 0;
      while (text.split(/\s+/).length < neededWords && guard < 100) {
        text += ' ' + generateAItext();
        guard++;
      }
      newIndex = -1;
    } else {
      // Metinleri karıştır ve yeterli uzunlukta birleştir
      const pool = EXAM_TEXTS_MAP[settings.difficultyFilter] || EXAM_TEXTS_MAP.all;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      text = '';
      let i = 0;
      let guard = 0;
      while (text.split(/\s+/).length < neededWords && guard < 500) {
        text += (text ? ' ' : '') + shuffled[i % shuffled.length];
        i++;
        guard++;
      }
      text = removeTurkishDiacritics(text);
      newIndex = 0;
    }
    
    setCurrentText(text);
    setCurrentTextIndex(newIndex);
  }, [currentTextIndex, settings, generateAItext]);

  // Ayarlar değişince menüdeyken metni otomatik yenile
  useEffect(() => {
    if (gameState === 'menu') {
      generateNewText(settings.timeLimit);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.difficultyFilter, settings.aiTextMode, settings.useCustomText, settings.timeLimit]);

  const startPaceIndicator = useCallback(() => {
    if (!settings.usePace || !settings.paceWPM) return;
    const wordsPerSecond = settings.paceWPM / 60;
    paceIntervalRef.current = setInterval(() => {
      setPaceProgress(prev => {
        const totalWords = currentText.trim().split(/\s+/).length;
        const newProgress = prev + (100 / totalWords) * wordsPerSecond;
        return Math.min(newProgress, 100);
      });
    }, 1000);
  }, [settings.usePace, settings.paceWPM, currentText]);

  const stopPaceIndicator = useCallback(() => {
    if (paceIntervalRef.current) {
      clearInterval(paceIntervalRef.current);
      paceIntervalRef.current = null;
    }
  }, []);

  const startGameWithTime = useCallback((
    overrideTime?: number,
    overrideText?: string,
    isExam: boolean = false,
    mode: 'normal' | 'tekerleme' = 'normal'
  ) => {
    const time = overrideTime || settings.timeLimit;
    setExamMode(isExam);
    setTekerlemeMode(mode === 'tekerleme');

    if (mode === 'tekerleme') {
      const { item, text } = pickTekerleme(time);
      setActiveTekerlemeTitle(item.title);
      setCurrentText(removeTurkishDiacritics(text));
      setCurrentTextIndex(-2);
    } else if (overrideText) {
      setActiveTekerlemeTitle('');
      setCurrentText(removeTurkishDiacritics(overrideText));
      setCurrentTextIndex(-3);
    } else {
      setActiveTekerlemeTitle('');
      generateNewText(time);
    }
    
    setCurrentWordInput('');
    setCompletedWords([]);
    completedWordsRef.current = [];
    keySessionRef.current = { events: [], lastTs: 0 };
    setTimeRemaining(time);
    initialTimeRef.current = time;
    setTimerStarted(false);
    setPaceProgress(0);
    rhythmRef.current = [];
    setRhythmData([]);
    setParticles([]);
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopAmbientSound();
    stopPaceIndicator();
    setGameState('playing');
    setTimeout(() => {
      examPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      inputRef.current?.focus();
    }, 120);
    if (settings.distractionMode) startAmbientSound();
    if (settings.usePace) startPaceIndicator();
  }, [settings, generateNewText, startAmbientSound, startPaceIndicator]);

  const startTrainerSession = useCallback((config: TrainerConfig) => {
    trainerModeRef.current = true;
    dedicatedExamRef.current = null;
    setDedicatedExamActive(false);
    const drillText = generateTrainerText(analytics.keyStats, config);
    setGameState('menu');
    setTimeout(() => startGameWithTime(config.durationSec, drillText, false), 50);
  }, [analytics.keyStats, startGameWithTime]);

  const beginDedicatedExamPlay = useCallback(() => {
    const session = dedicatedExamRef.current;
    if (!session) return;
    const unlimited = session.timerSeconds === 0;
    const time = unlimited ? 36000 : session.timerSeconds;
    examTimerUnlimitedRef.current = unlimited;
    setExamTimerUnlimited(unlimited);
    setDedicatedExamActive(true);
    setExamMode(false);
    trainerModeRef.current = false;
    setTekerlemeMode(false);
    setActiveTekerlemeTitle('');
    setCurrentText(session.exam.text);
    setCurrentTextIndex(-3);
    setCurrentWordInput('');
    setCompletedWords([]);
    completedWordsRef.current = [];
    keySessionRef.current = { events: [], lastTs: 0 };
    setTimeRemaining(time);
    initialTimeRef.current = time;
    setTimerStarted(false);
    setPaceProgress(0);
    rhythmRef.current = [];
    setRhythmData([]);
    setParticles([]);
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopAmbientSound();
    stopPaceIndicator();
    setGameState('playing');
    setTimeout(() => {
      examPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      inputRef.current?.focus();
    }, 120);
    if (session.fullscreen) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [stopAmbientSound, stopPaceIndicator]);

  const launchDedicatedExam = useCallback((exam: ExamText, timerMode: ExamTimerMode, fullscreen: boolean) => {
    dedicatedExamRef.current = {
      exam,
      timerSeconds: resolveExamTimerSeconds(exam, timerMode),
      fullscreen,
    };
    trainerModeRef.current = false;
    setActiveExamTitle(exam.title);
    setCountdownValue(3);
    setGameState('exam_countdown');
  }, []);

  const exitDedicatedExamUi = useCallback(() => {
    dedicatedExamRef.current = null;
    setDedicatedExamActive(false);
    setActiveExamTitle('');
    examTimerUnlimitedRef.current = false;
    setExamTimerUnlimited(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  const recordKeyPress = useCallback((typedChar: string, expectedChar: string | undefined) => {
    if (!typedChar || gameState !== 'playing') return;
    const normTyped = typedChar.toLocaleLowerCase('tr-TR');
    const normExpected = (expectedChar || '').toLocaleLowerCase('tr-TR');
    const correct = !!expectedChar && normTyped === normExpected;
    const now = Date.now();
    const reactionMs = keySessionRef.current.lastTs > 0 ? now - keySessionRef.current.lastTs : 0;
    keySessionRef.current.lastTs = now;
    keySessionRef.current.events.push({
      key: typedChar,
      correct,
      reactionMs: Math.min(reactionMs, 5000),
      timestamp: now,
    });
  }, [gameState]);

  const endGame = useCallback((suddenDeath: boolean = false) => {
    // Timer'ları hemen temizle
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    stopPaceIndicator();
    stopAmbientSound();

    const words = completedWordsRef.current;
    const remaining = timeRemainingRef.current;
    const text = currentTextRef.current;

    // Hiç kelime yazılmamışsa kaydetme
    if (!words || (words.length < 1 && !suddenDeath)) {
      setGameState('menu');
      return;
    }
    if (!text || !text.trim()) {
      setGameState('menu');
      return;
    }

    try {

    const textWords = splitTextWords(text);
    let correctChars = 0, incorrectChars = 0;
    // Timer/ref callback'lerinde state güncel olmayabilir; ref ile sınav oturumunu belirle
    const examSession = !!dedicatedExamRef.current || examModeRef.current;

    let netWords = 0;
    if (examSession) {
      let refIdx = 0;
      for (const cw of words) {
        if (refIdx >= textWords.length) break;
        if (cw.skipped) {
          refIdx++;
          continue;
        }
        const expected = textWords[refIdx];
        if (cw.word && normalizeExamWord(cw.word) === normalizeExamWord(expected)) {
          netWords++;
        }
        refIdx++;
      }
    } else {
      netWords = words.filter(w => w.isCorrect).length;
    }
    const errorWordMap: { [key: string]: number } = {};

    // Karakter bazlı hata hesaplama — Zabıt katipliği sınav standardı
    const charErrors = (typed: string, correct: string): number => {
      const t = normalizeExamWord(typed);
      const c = normalizeExamWord(correct);
      if (t === c) return 0;
      const m = t.length, n = c.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
      for (let i = 0; i <= m; i++) dp[i][0] = i;
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = t[i - 1] === c[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
      const levenshtein = dp[m][n];
      const lengthDiff = Math.abs(m - n);
      return levenshtein + lengthDiff;
    };

    const detectErrorType = (typed: string, correct: string): string => {
      const t = normalizeExamWord(typed);
      const c = normalizeExamWord(correct);
      if (t === c) return 'doğru';
      if (t.length < c.length) return 'eksik harf / kayma';
      if (t.length > c.length) return 'fazla harf / kayma';
      return 'yanlış harf';
    };

    const wordErrorDetails: { expected: string; typed: string; errorType: string; charErrors: number }[] = [];

    let refIdx = 0;
    words.forEach((completedWord) => {
      if (refIdx >= textWords.length) return;

      if (completedWord.skipped) {
        const correctWord = textWords[refIdx];
        const normalizedCorrectLen = normalizeExamWord(correctWord).length;
        errorWordMap[correctWord] = (errorWordMap[correctWord] || 0) + 1;
        incorrectChars += normalizedCorrectLen;
        wordErrorDetails.push({
          expected: correctWord,
          typed: '(atlandı)',
          errorType: 'kelime atlandı',
          charErrors: normalizedCorrectLen,
        });
        refIdx++;
        return;
      }

      const correctWord = textWords[refIdx];
      const normalizedCorrectLen = normalizeExamWord(correctWord).length;
      const typedNorm = normalizeExamWord(completedWord.word);
      const expectedNorm = normalizeExamWord(correctWord);
      const isWordCorrect = typedNorm.length > 0 && typedNorm === expectedNorm;

      if (isWordCorrect) {
        correctChars += normalizedCorrectLen;
      } else {
        errorWordMap[correctWord] = (errorWordMap[correctWord] || 0) + 1;
        const errors = completedWord.word
          ? Math.min(charErrors(completedWord.word, correctWord), normalizedCorrectLen)
          : normalizedCorrectLen;
        const correct = normalizedCorrectLen - errors;
        correctChars += correct;
        incorrectChars += errors;

        wordErrorDetails.push({
          expected: correctWord,
          typed: completedWord.word || '(boş)',
          errorType: detectErrorType(completedWord.word, correctWord),
          charErrors: errors,
        });
      }
      refIdx++;
    });

    const keyPressMap = new Map<string, { correct: number; incorrect: number }>();
    keySessionRef.current.events.forEach((ev) => {
      const k = normalizeKey(ev.key);
      if (!k) return;
      const entry = keyPressMap.get(k) || { correct: 0, incorrect: 0 };
      if (ev.correct) entry.correct++;
      else entry.incorrect++;
      keyPressMap.set(k, entry);
    });
    const keyPressesArray = Array.from(keyPressMap.entries()).map(([key, v]) => ({
      key,
      correct: v.correct,
      incorrect: v.incorrect,
    }));
    const isTrainerSession = trainerModeRef.current;
    const errorWordsArray = Object.entries(errorWordMap).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 1000) / 10 : 0;
    const totalTime = initialTimeRef.current;
    const timeElapsed = Math.max(1, totalTime - remaining);
    const timeInMinutes = timeElapsed / 60;
    const wpm = timeInMinutes > 0 ? Math.round((netWords / timeInMinutes)) : 0;
    const passedBarrier = netWords >= 90;
    const wordResults = examSession
      ? buildExamWordResultsFromSession(words, textWords, text)
      : [];
    const wordSummary = summarizeWordResults(wordResults);

    if (dedicatedExamRef.current) {
      const session = dedicatedExamRef.current;
      const completion = computeCompletion(words.length, textWords.length);
      const avgRx = avgReactionMs(keySessionRef.current.events);
      const badge = getPerformanceBadge(accuracy, completion);
      const liveResult: ExamLiveResult = {
        examId: session.exam.id,
        examTitle: session.exam.title,
        category: session.exam.category,
        difficulty: session.exam.difficulty,
        wpm,
        accuracy,
        mistakes: incorrectChars,
        totalTypedChars: totalChars,
        correctChars,
        incorrectChars,
        completion,
        timeSpent: timeElapsed,
        avgReactionMs: avgRx,
        badge,
        netWords,
        grossWords: words.length,
        wordResults,
        correctWordCount: wordSummary.correct,
        wrongWordCount: wordSummary.wrong,
        skippedWordCount: wordSummary.skipped,
      };
      const updatedExam = recordExamAttempt(examProgress, liveResult);
      setExamProgress(updatedExam);
      saveExamProgress(updatedExam);
      setExamLastResult(liveResult);

      const updatedAnalytics = processSessionEnd(analytics, {
        events: keySessionRef.current.events,
        accuracy,
        wpm,
        mistakes: incorrectChars,
        trainerSession: false,
      });
      setAnalytics(updatedAnalytics);
      setStreak(updatedAnalytics.practiceStreak.currentStreak);
      setLastTestDate(updatedAnalytics.practiceStreak.lastPracticeDate || new Date().toDateString());
      keySessionRef.current = { events: [], lastTs: 0 };
      exitDedicatedExamUi();
      setGameState('exam_finished');
      return;
    }

    const result: TestResult = {
      date: new Date().toLocaleDateString('tr-TR'), timestamp: Date.now(), textIndex: currentTextIndex,
      netWords, grossWords: words.length, correctChars, incorrectChars, totalChars, accuracy, wpm, passedBarrier,
      hardMode: settings.hardMode, suddenDeath: settings.suddenDeath || suddenDeath, distractionMode: settings.distractionMode,
      gameMode: settings.gameMode, aiTextMode: settings.aiTextMode, keyboardType: settings.keyboardType,
      timeLimit: settings.timeLimit, targetWords: settings.targetWords, paceWPM: settings.paceWPM,
      usePace: settings.usePace, useCustomText: settings.useCustomText, theme: settings.theme,
      keyPresses: keyPressesArray, errorWords: errorWordsArray, wordErrorDetails,
      examWordResults: examSession ? wordResults : undefined,
      trainerSession: isTrainerSession,
    };

    const updatedAnalytics = processSessionEnd(analytics, {
      events: keySessionRef.current.events,
      accuracy,
      wpm,
      mistakes: incorrectChars,
      trainerSession: isTrainerSession,
    });
    setAnalytics(updatedAnalytics);
    setStreak(updatedAnalytics.practiceStreak.currentStreak);
    setLastTestDate(updatedAnalytics.practiceStreak.lastPracticeDate || new Date().toDateString());
    trainerModeRef.current = false;
    keySessionRef.current = { events: [], lastTs: 0 };

    const newHistory = [result, ...history.slice(0, 49)];
    setHistory(newHistory);
    if (dbEnabled) {
      saveTestResult({
        net_words: netWords,
        gross_words: words.length,
        correct_chars: correctChars,
        total_chars: totalChars,
        accuracy,
        wpm,
        time_limit: initialTimeRef.current,
        hard_mode: settings.hardMode,
        sudden_death: settings.suddenDeath || suddenDeath,
      }).catch(() => {});
    }
    checkAndAwardBadges(result);

    // Doğru yazılan kelimeleri topla (zayıf listeden çıkarmak için)
    const correctWordsList = words.filter(w => w.isCorrect).map(w => w.correctWord);
    
    // XP hesapla
    let xpGained = netWords * 2;
    xpGained += Math.floor(correctChars / 10);
    if (accuracy >= 95) xpGained += 30;
    if (accuracy >= 100) xpGained += 50;
    if (netWords >= 90) xpGained += 100;
    if (netWords >= 120) xpGained += 200;
    if (settings.hardMode) xpGained = Math.floor(xpGained * 1.5);
    if (settings.suddenDeath) xpGained = Math.floor(xpGained * 2);

    // Update profile: weak words, daily log, XP (trainer oturumları kariyer sayacını etkilemez)
    setProfile(prev => {
      let updated = isTrainerSession
        ? prev
        : updateWeakWords(prev, errorWordsArray, correctWordsList);
      if (!isTrainerSession) {
        updated = updateDailyLog(updated, netWords, words.length, wpm, accuracy, timeElapsed, correctChars, totalChars);
      }
      
      const oldXP = updated.xp || 0;
      const newXP = isTrainerSession ? oldXP : oldXP + xpGained;
      const oldLevel = Math.floor(oldXP / 200) + 1;
      const newLevel = Math.floor(newXP / 200) + 1;
      updated = { ...updated, xp: newXP };
      
      if (!isTrainerSession) {
        const careerResult = updateCareer(updated, netWords, accuracy);
        updated = careerResult.profile;
        if (careerResult.promoted && careerResult.newStage) {
          setCareerPromotion(careerResult.newStage);
        } else if (newLevel > oldLevel) {
          setLevelUpData({ show: true, oldLevel, newLevel, xpGained });
        }
      }
      
      saveProfile(updated);
      if (dbEnabled) {
        saveProfileToDb({
          name: updated.name || '',
          avatar: updated.avatar || '👤',
          xp: updated.xp || 0,
          career_stage: updated.careerStage || 1,
          career_tests: updated.careerTestsAtStage || 0,
          career_best_words: updated.careerBestWords || 0,
          career_best_accuracy: updated.careerBestAccuracy || 0,
          total_tests: updated.totalTests || 0,
          total_practice_minutes: updated.totalPracticeMinutes || 0,
          best_words: bestWordsAll,
          best_chars: bestCharsAll,
          best_wpm: bestWpmAll,
          weak_words: updated.weakWords || [],
          daily_logs: updated.dailyLogs || [],
          completed_missions: updated.completedMissionIds || []
        }).catch(() => {});
      }
      return updated;
    });

    // Save rhythm data
    setRhythmData(rhythmRef.current);

    // Fatigue check
    if (checkFatigue(profile)) {
      setShowFatigueWarning(true);
      setProfile(prev => {
        const updated = { ...prev, lastFatigueWarning: Date.now() };
        saveProfile(updated);
        return updated;
      });
    }

    setGameState(suddenDeath ? 'sudden_death' : 'finished');
    } catch (err) {
      console.error('endGame error:', err);
      setGameState('menu');
    }
  }, [history, settings, currentTextIndex, analytics, examProgress, checkAndAwardBadges, stopAmbientSound, stopPaceIndicator, exitDedicatedExamUi]);

  // endGame ref'i her zaman güncel tutulur
  useEffect(() => { endGameRef.current = endGame; }, [endGame]);

  useEffect(() => {
    if (gameState !== 'exam_countdown') return;
    if (countdownValue > 0) {
      const t = setTimeout(() => setCountdownValue((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
    beginDedicatedExamPlay();
  }, [gameState, countdownValue, beginDedicatedExamPlay]);

  const startTimerIfNeeded = () => {
    if (timerStarted || gameState !== 'playing') return;
    setTimerStarted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0 && !examTimerUnlimitedRef.current) {
          endGameRef.current();
          return 0;
        }
        if (newTime <= 0 && examTimerUnlimitedRef.current) return 0;
        return newTime;
      });
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const prevLen = currentWordInput.length;
    if (value.length > prevLen && gameState === 'playing') {
      const typedChar = value[value.length - 1];
      const textWords = splitTextWords(currentTextRef.current);
      const wordIdx = completedWordsRef.current.length;
      const expectedWord = textWords[wordIdx] || '';
      const expectedChar = expectedWord[value.length - 1];
      recordKeyPress(typedChar, expectedChar);
    }
    if (value.length > 0) startTimerIfNeeded();
    setCurrentWordInput(value);
  };

  const commitWord = (mode: 'complete' | 'skip') => {
    const textWords = splitTextWords(currentText);
    const currentWordIndex = completedWordsRef.current.length;
    const correctWord = textWords[currentWordIndex] || '';
    const typed = currentWordInput.trim();
    if (!correctWord) return;

    const entries = [...completedWordsRef.current];
    let lastIsCorrect = false;

    if (mode === 'skip') {
      // Atlanan kelime: kısmi yazım hizayı bozmasın diye boş kayıt
      entries.push({
        word: '',
        isCorrect: false,
        correctWord,
        skipped: true,
      });

      const nextWord = textWords[currentWordIndex + 1] || '';
      if (typed && nextWord && normalizeExamWord(typed) === normalizeExamWord(nextWord)) {
        entries.push({
          word: typed,
          isCorrect: true,
          correctWord: nextWord,
          skipped: false,
        });
        lastIsCorrect = true;
      }
    } else {
      const isCorrect = typed.length > 0 && normalizeExamWord(typed) === normalizeExamWord(correctWord);
      entries.push({
        word: typed,
        isCorrect,
        correctWord,
        skipped: false,
      });
      lastIsCorrect = isCorrect;
    }

    setCompletedWords(entries);
    completedWordsRef.current = entries;
    setCurrentWordInput('');
    requestAnimationFrame(() => inputRef.current?.focus());

    const elapsed = initialTimeRef.current - timeRemainingRef.current;
    rhythmRef.current = [...rhythmRef.current, {
      second: Math.max(0, elapsed),
      wordsAtThatPoint: entries.length,
      chars: typed.length,
      correct: lastIsCorrect,
    }];

    if (mode === 'complete' && entries.length % 10 === 0 && lastIsCorrect && settings.showEffects) {
      const container = textContainerRef.current;
      if (container) createParticles(container.offsetWidth / 2, container.offsetHeight / 2);
    }

    if (settings.suddenDeath && !lastIsCorrect && mode === 'complete') {
      playSound(100, 0.5, 'sawtooth');
      endGame(true);
      return;
    }

    if (settings.gameMode) {
      setGameObstacles(prev => prev.map(obs => ({ ...obs, x: obs.x - 50 })).filter(obs => obs.x > -50));
      if (lastIsCorrect) playSound(800, 0.05);
      else if (mode === 'complete') { playSound(200, 0.1); setGameObstacles(prev => prev.map(obs => ({ ...obs, x: obs.x + 20 }))); }
      else playSound(520, 0.04);
    } else {
      if (lastIsCorrect) playSound(800, 0.05);
      else if (mode === 'complete') playSound(200, 0.1);
      else playSound(520, 0.04);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
    if (e.key === ' ' && gameState === 'playing') {
      e.preventDefault();
      if (currentWordInput.trim().length > 0) commitWord('complete');
    } else if (e.key === 'Enter' && gameState === 'playing') {
      e.preventDefault();
      startTimerIfNeeded();
      commitWord('skip');
    } else if (e.key === 'Tab' && gameState === 'playing') {
      e.preventDefault();
      if (currentWordInput.trim().length > 0) {
        const textWords = splitTextWords(currentText);
        const ci = completedWordsRef.current.length;
        const cw = textWords[ci] || '';
        const ic = normalizeExamWord(currentWordInput.trim()) === normalizeExamWord(cw);
        const entry = { word: currentWordInput.trim(), isCorrect: ic, correctWord: cw, skipped: false };
        completedWordsRef.current = [...completedWordsRef.current, entry];
        setCompletedWords([...completedWordsRef.current]);
      }
      endGame();
    } else if (gameState === 'playing' && e.key.length === 1) {
      playSound(400 + Math.random() * 200, 0.03);
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && writingAreaRef.current) {
      writingAreaRef.current.scrollTop = writingAreaRef.current.scrollHeight;
    }
  }, [completedWords.length, gameState]);

  useLayoutEffect(() => {
    if (gameState !== 'playing') {
      setReferenceFontSize(settings.fontSize);
      return;
    }
    const el = textContainerRef.current;
    if (!el) return;

    const fitReferenceText = () => {
      const fontPx = getReferenceFontPx(settings.fontSize);
      el.style.lineHeight = String(REFERENCE_LINE_HEIGHT);
      el.style.overflowY = 'auto';
      el.style.overflowX = 'hidden';
      el.style.fontSize = `${fontPx}px`;
      setReferenceFontSize(fontPx);
    };

    fitReferenceText();
    const observer = new ResizeObserver(fitReferenceText);
    observer.observe(el);
    window.addEventListener('resize', fitReferenceText);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fitReferenceText);
    };
  }, [currentText, settings.fontSize, settings.lineHeight, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && settings.gameMode && !gameLoopRef.current) {
      gameLoopRef.current = setInterval(() => {
        setGameObstacles(prev => {
          const newObstacles = prev.map(obs => ({ ...obs, x: obs.x - 2 })).filter(obs => obs.x > -50);
          if (newObstacles.length < 3 && Math.random() > 0.95) {
            newObstacles.push({ x: 800, type: Math.random() > 0.5 ? 'rock' : 'cactus' });
          }
          return newObstacles;
        });
      }, 50);
    }
    return () => {
      if (gameLoopRef.current) { clearInterval(gameLoopRef.current); gameLoopRef.current = null; }
    };
  }, [gameState, settings.gameMode]);

  // Scroll animasyon observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      stopPaceIndicator();
      stopAmbientSound();
    };
  }, [stopAmbientSound, stopPaceIndicator]);

  const normalizeExamWord = (value: string) =>
    value
      .toLocaleLowerCase('tr-TR')
      .replace(/[.,!?;:()"'“”‘’…\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const splitTextWords = (text: string) => text.trim().split(/\s+/).filter((w) => w.length > 0);

  const safeMax = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;
  const bestWordsAll = safeMax(history.map(h => h.netWords));
  const bestCharsAll = safeMax(history.map(h => h.correctChars));
  const bestWpmAll = safeMax(history.map(h => h.wpm));
  const bestAccuracyAll = safeMax(history.map(h => h.accuracy));




  const last30DaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentHistory = history
    .filter(h => typeof h.timestamp === 'number' && (Date.now() - h.timestamp) <= last30DaysMs)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Son 30 gündeki tüm sınav sonuçları
  const chartData = recentHistory.map((h, i) => ({
    test: i + 1,
    date: new Date(h.timestamp).toLocaleDateString('tr-TR'),
    netWords: h.netWords || 0,
    wrongWords: (h.grossWords || 0) - (h.netWords || 0),
    correctChars: h.correctChars || 0,
    wrongChars: h.incorrectChars || 0,
    totalChars: h.totalChars || 0,
    grossWords: h.grossWords || 0,
    wpm: h.wpm || 0,
    accuracy: h.accuracy || 0,
    raw: h
  }));
  const keyboardLayout = settings.keyboardType === 'F' ? KEYBOARD_LAYOUT_F : KEYBOARD_LAYOUT_Q;
  const latestResult = history[0];

  const coachReport = latestResult ? (() => {
    const originalText = currentText.trim();
    const typedWords = completedWords.map(w => w.skipped ? '' : w.word).filter(Boolean);
    const originalWords = originalText.split(/\s+/).filter(Boolean);
    const skippedWords = completedWords.filter(w => w.skipped).length;
    const errorCount = latestResult.incorrectChars;
    const accuracy = latestResult.accuracy;
    const passed = latestResult.passedBarrier;

    const level = accuracy >= 98 ? 'Mükemmel'
      : accuracy >= 95 ? 'Çok İyi'
      : accuracy >= 90 ? 'İyi'
      : accuracy >= 85 ? 'Geliştirilmeli'
      : 'Yoğun Çalışma Gerekli';

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (accuracy >= 95) strengths.push('Doğruluk yüksek, doğru yazma becerin güçlü.');
    else strengths.push('Yazma temponu koruyabiliyorsun.');

    if (latestResult.wpm >= 50) strengths.push('Hızın iyi bir temel oluşturuyor.');
    else strengths.push('Dikkatini kontrollü yazmaya verdiğin sürede gelişme potansiyeli var.');

    if (skippedWords > 0) weaknesses.push('Kelime atlama hatası mevcut.');
    if (errorCount > 0) weaknesses.push('Harf eksikliği veya fazlalığı sonucu doğruluk düşüyor.');
    if (typedWords.length !== originalWords.length) weaknesses.push('Boşluk ve kelime sınırlarında tutarsızlık var.');

    if (accuracy < 90) recommendations.push('Her kelimeyi tamamlayıp boşluk tuşuna basmadan önce hızlıca kontrol et.');
    if (skippedWords > 0) recommendations.push('Kelime atlama eğilimini azaltmak için çizgi atlamadan önce kelimeyi bitir.');
    if (latestResult.wpm < 50) recommendations.push('Ritim ve parmak egzersizleriyle hızı artırmaya çalış.');
    if (accuracy < 95) recommendations.push('Doğruluğu artırmak için tempoyu hafifçe düşür ve kontrollü yaz.');
    if (passed) recommendations.push('Bu performansı korumak için düzenli olarak tekrar yap.');
    if (!passed) recommendations.push('Her testten sonra hatalarını gözden geçirip aynı kelimeleri tekrar et.');

    if (recommendations.length < 3) {
      recommendations.push('Günlük kısa tekrarlar yaparak kelime kontrolünü güçlendir.');
    }

    const motivation = passed
      ? 'Geçmiş olman güçlü bir işaret; aynı disiplinle hedefini yukarı taşı.'
      : 'Geçememek performansın olmadığı anlamına gelmez; doğru adımlarla ilerleyebilirsin.';

    const nextGoal = accuracy >= 90
      ? 'Doğruluğunu %95 üzerine çıkar ve kelime atlama sayısını azalt.'
      : 'Doğruluğunu %90’a çıkaracak kontrollü ritim çalışması yap.';

    const estimatedSuccessChance = Math.max(0, Math.min(100, Math.round((accuracy * 0.7) + (passed ? 20 : 0) - (skippedWords * 2))));

    return {
      overallLevel: level,
      summary: `Doğruluk %${accuracy} ve hız ${latestResult.wpm} WPM. Yazım hatalarını azaltmaya odaklanmalısın.`,
      strengths,
      weaknesses,
      recommendations,
      motivation,
      nextGoal,
      estimatedSuccessChance
    };
  })() : null;

  const formatCoachText = (report: any) => {
    if (!report) return '';
    return [
      'Yapay Katip Zeka Koçu Raporu',
      `Genel Seviye: ${report.overallLevel}`,
      `Özet: ${report.summary}`,
      '',
      'Güçlü Yönler:',
      ...report.strengths.map((item: string) => `- ${item}`),
      '',
      'Geliştirilmesi Gereken Alanlar:',
      ...report.weaknesses.map((item: string) => `- ${item}`),
      '',
      'Öneriler:',
      ...report.recommendations.map((item: string) => `- ${item}`),
      '',
      `Motivasyon: ${report.motivation}`,
      `Bir Sonraki Hedef: ${report.nextGoal}`,
      `Başarı Şansı: %${report.estimatedSuccessChance}`
    ].join('\n');
  };
  
  const themeStyles = {
    modern: {
      bg: settings.darkMode ? 'bg-slate-900' : 'bg-gray-100',
      cardBg: settings.darkMode ? 'bg-slate-800/50' : 'bg-white',
      border: settings.darkMode ? 'border-slate-700' : 'border-gray-200',
      text: settings.darkMode ? 'text-white' : 'text-gray-900',
      textMuted: settings.darkMode ? 'text-slate-400' : 'text-gray-500',
      fontFamily: 'font-sans'
    },
    retro: {
      bg: 'bg-black',
      cardBg: 'bg-green-900/30',
      border: 'border-green-500',
      text: 'text-green-400',
      textMuted: 'text-green-600',
      fontFamily: 'font-mono'
    },
    cinematic: {
      bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
      cardBg: 'bg-slate-900/80',
      border: 'border-slate-700/50',
      text: 'text-slate-100',
      textMuted: 'text-slate-500',
      fontFamily: 'font-serif'
    }
  };
  const theme = themeStyles[settings.theme];

  const practiceStreak = useMemo(
    () => refreshStreakForToday(analytics.practiceStreak),
    [analytics.practiceStreak]
  );

  const examSuggestions = useMemo(() => {
    if (!examLastResult) return [];
    return generateExamSuggestions(examLastResult, analytics);
  }, [examLastResult, analytics]);

  const examProgressSummary = useMemo(() => {
    const completed = new Set(examProgress.history.map((h) => h.examId)).size;
    return { completed, total: examTexts.length };
  }, [examProgress.history]);

  const weakestKeyStats = useMemo(() => getWeakestKeys(analytics.keyStats, 5), [analytics.keyStats]);

  const resultSuggestions = useMemo(() => {
    if (!latestResult) return [];
    return generateResultSuggestions({
      accuracy: latestResult.accuracy,
      wpm: latestResult.wpm,
      mistakes: latestResult.incorrectChars,
      incorrectChars: latestResult.incorrectChars,
      analytics,
      trainerSession: latestResult.trainerSession,
    });
  }, [latestResult, analytics]);

  const generateShareImage = useCallback(() => {
    if (!latestResult) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Arka plan
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e1b4b');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);
    
    // Dekoratif çemberler
    ctx.globalAlpha = 0.05;
    ctx.beginPath(); ctx.arc(200, 400, 300, 0, Math.PI * 2); ctx.fillStyle = '#f59e0b'; ctx.fill();
    ctx.beginPath(); ctx.arc(880, 1400, 250, 0, Math.PI * 2); ctx.fillStyle = '#8b5cf6'; ctx.fill();
    ctx.globalAlpha = 1;
    
    // Başlık
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 70px Arial';
    ctx.fillText('KatipTest', 540, 180);
    ctx.fillStyle = '#64748b';
    ctx.font = '35px Arial';
    ctx.fillText('Zabıt Katipliği Sınav Simülasyonu', 540, 240);
    
    // Ayırıcı çizgi
    const line = ctx.createLinearGradient(200, 0, 880, 0);
    line.addColorStop(0, 'transparent');
    line.addColorStop(0.5, '#f59e0b');
    line.addColorStop(1, 'transparent');
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(200, 280); ctx.lineTo(880, 280); ctx.stroke();
    
    // Ana skor
    ctx.fillStyle = latestResult.passedBarrier ? '#22c55e' : '#f59e0b';
    ctx.font = 'bold 180px Arial';
    ctx.fillText(latestResult.netWords.toString(), 540, 500);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 50px Arial';
    ctx.fillText('NET KELİME', 540, 570);
    
    // Durum
    ctx.fillStyle = latestResult.passedBarrier ? '#22c55e' : '#f97316';
    ctx.font = 'bold 45px Arial';
    ctx.fillText(latestResult.passedBarrier ? '✓ 90 Hedefi Aşıldı!' : '○ Hedefe Devam!', 540, 660);

    // İstatistik kartları
    const drawCard = (x: number, y: number, label: string, value: string, color: string) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.beginPath(); ctx.roundRect(x, y, 280, 120, 20); ctx.fill();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 50px Arial';
      ctx.fillText(value, x + 140, y + 55);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px Arial';
      ctx.fillText(label, x + 140, y + 95);
    };
    
    drawCard(70, 720, 'Toplam Kelime', latestResult.grossWords.toString(), '#e2e8f0');
    drawCard(400, 720, 'WPM', latestResult.wpm.toString(), '#fbbf24');
    drawCard(730, 720, 'Doğruluk', `${latestResult.accuracy}%`, '#22c55e');
    drawCard(180, 870, 'Karakter', latestResult.correctChars.toString(), '#60a5fa');
    drawCard(540, 870, 'Hata', latestResult.incorrectChars.toString(), '#f87171');
    
    const modes: string[] = [];
    if (latestResult.suddenDeath) modes.push('💀 Sudden Death');
    if (latestResult.distractionMode) modes.push('🎧 Gürültü');
    if (latestResult.gameMode) modes.push('🎮 Oyun');
    if (latestResult.usePace) modes.push(`🎯 ${latestResult.paceWPM} WPM Hedef`);
    if (latestResult.useCustomText) modes.push('📝 Özel Metin');
    
    if (modes.length > 0) {
      ctx.fillStyle = '#f472b6';
      ctx.font = '35px Arial';
      modes.forEach((mode, i) => {
        ctx.fillText(mode, 540, 1000 + (i * 40));
      });
    }
    
    ctx.fillStyle = '#64748b';
    ctx.font = '35px Arial';
    ctx.fillText(latestResult.date, 540, 1200);
    
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 45px Arial';
    ctx.fillText('🏆 REKOR KIRILDI!', 540, 1400);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '30px Arial';
    ctx.fillText('KatipTest - katiptest.com', 540, 1700);
    
    const link = document.createElement('a');
    link.download = `zabit-rekor-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [latestResult, settings.theme]);

  const generatePdfReport = useCallback(() => {
    if (!latestResult) return;
    generateResultPdf(latestResult);
  }, [latestResult]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} ${theme.fontFamily}`}>
      {showMobileWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-6 text-center max-w-md w-full`}>
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${theme.text}`}>Uyarı</h3>
            <p className={`${theme.textMuted} mb-4`}>Lütfen gerçekçi bir sınav deneyimi için bilgisayar ve fiziksel klavye kullanın.</p>
            <button onClick={() => setShowMobileWarning(false)} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg">Anladım</button>
          </div>
        </div>
      )}

      {gameState === 'sudden_death' && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="text-6xl">💀</div>
            <h1 className="text-5xl font-bold text-red-500 animate-pulse">KIRMIZI ÇİZGİ!</h1>
            <p className="text-2xl text-slate-400">Tek bir hata testinizi sonlandırdı.</p>
            <button onClick={() => setGameState('menu')} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">Ana Menü</button>
          </div>
        </div>
      )}

      {careerPromotion && (
        <div className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4" onClick={() => setCareerPromotion(null)}>
          <div className="text-center space-y-6">
            <div className="text-8xl">{careerPromotion.icon}</div>
            <h1 className="text-3xl font-bold text-amber-400">TERFİ ALDIN!</h1>
            <div className="text-5xl font-bold text-white">{careerPromotion.title}</div>
            <p className="text-slate-400 max-w-sm mx-auto">{careerPromotion.description}</p>
            {careerPromotion.suddenDeath && <div className="text-red-400 text-sm font-semibold">💀 Sudden Death artık aktif!</div>}
            <p className="text-slate-500 text-sm animate-pulse mt-4">ekrana tıkla...</p>
          </div>
        </div>
      )}

      {levelUpData?.show && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4" onClick={() => setLevelUpData(null)}>
          <div className="text-center space-y-4 animate-bounce">
            <div className="text-7xl">🎉</div>
            <h1 className="text-4xl font-bold text-amber-400">SEVİYE ATLADIN!</h1>
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl text-slate-400">Lv.{levelUpData.oldLevel}</span>
              <span className="text-2xl text-amber-400">→</span>
              <span className="text-5xl font-bold text-amber-400">Lv.{levelUpData.newLevel}</span>
            </div>
            <div className="text-green-400 text-xl font-semibold">+{levelUpData.xpGained} XP</div>
            <p className="text-slate-400 text-sm animate-pulse mt-4">ekrana tıkla...</p>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
          <div className={`${settings.darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 ${settings.darkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'} border-b`}>
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className={`text-xl font-bold ${theme.text}`}>Çıkış Yap</h3>
                <p className={`text-sm ${theme.textMuted} mt-2`}>Çıkış yapmak istediğinize emin misiniz?</p>
              </div>
            </div>
            <div className="p-5 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className={`flex-1 py-3 rounded-xl font-semibold ${settings.darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Vazgeç</button>
              <button onClick={async () => { await signOut(); setDbUserEmail(null); setAuthStatus({ type: 'idle', message: '' }); setShowLogoutConfirm(false); }} className="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20">Çıkış Yap</button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => { setShowAuthModal(false); setAuthStatus({ type: 'idle', message: '' }); }}>
          <div className={`${settings.darkMode ? 'bg-slate-900' : 'bg-white'} rounded-3xl max-w-md w-full shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b ${settings.darkMode ? 'border-slate-800 bg-linear-to-r from-slate-900 to-slate-800' : 'border-gray-200 bg-linear-to-r from-gray-50 to-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center text-2xl">☁️</div>
                  <div>
                    <h3 className={`text-xl font-bold ${theme.text}`}>Giriş Yap / Kayıt Ol</h3>
                    <p className={`text-xs ${theme.textMuted}`}>Hesabınla giriş yap, sonuçların kaybolmasın</p>
                  </div>
                </div>
                <button onClick={() => setShowAuthModal(false)} className={`p-2 rounded-lg ${settings.darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}>✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className={`flex rounded-2xl overflow-hidden border mb-5 ${settings.darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button onClick={() => { setAuthMode('signin'); setAuthStatus({ type: 'idle', message: '' }); setAuthForm(f => ({ ...f, password: '' })); }} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${authMode === 'signin' ? 'bg-amber-500 text-white' : (settings.darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}`}>Giriş Yap</button>
                <button onClick={() => { setAuthMode('signup'); setAuthStatus({ type: 'idle', message: '' }); setAuthForm(f => ({ ...f, password: '' })); }} className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${authMode === 'signup' ? 'bg-amber-500 text-white' : (settings.darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}`}>Kayıt Ol</button>
              </div>

              <div className={`mb-4 p-4 rounded-2xl ${settings.darkMode ? 'bg-slate-800/70' : 'bg-gray-50'}`}>
                <div className={`text-sm ${theme.text}`}>✅ Cihazlar arası senkronizasyon</div>
                <div className={`text-sm ${theme.text}`}>✅ Sınav geçmişini kaybetmeden takip</div>
                <div className={`text-sm ${theme.text}`}>✅ Cloud profil ve istatistik yedekleme</div>
                <div className={`text-xs mt-2 ${dbEnabled ? theme.textMuted : 'text-red-400'}`}>{dbEnabled ? 'Supabase bağlantısı aktif. Giriş sonrası veriler buluta yazılır.' : 'Supabase çevre değişkenleri eksik. Şu an yalnızca yerel mod kullanılabilir.'}</div>
              </div>

              <div className="space-y-3">
                {authMode === 'signup' && <input type="text" value={authForm.name} onChange={(e) => setAuthForm(f => ({ ...f, name: e.target.value }))} placeholder="Adın / Kullanıcı adın" className={`w-full px-4 py-3 rounded-2xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'} border outline-none focus:border-amber-500`} />}
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm(f => ({ ...f, email: e.target.value }))} placeholder="E-posta adresin" className={`w-full px-4 py-3 rounded-2xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'} border outline-none focus:border-amber-500`} />
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm(f => ({ ...f, password: e.target.value }))} placeholder="Şifren" className={`w-full px-4 py-3 rounded-2xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'} border outline-none focus:border-amber-500`} />
                {authStatus.type !== 'idle' && <div className={`text-sm p-3 rounded-2xl ${authStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : authStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{authStatus.message}</div>}
                <button disabled={authStatus.type === 'loading'} onClick={async () => {
                  const name = authForm.name.trim();
                  const email = authForm.email.trim();
                  const password = authForm.password.trim();
                  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                  if (!email || !password || (authMode === 'signup' && !name)) { setAuthStatus({ type: 'error', message: authMode === 'signup' ? 'Ad, e-posta ve şifre gerekli.' : 'E-posta ve şifre gerekli.' }); return; }
                  if (!emailOk) { setAuthStatus({ type: 'error', message: 'Geçerli bir e-posta adresi gir.' }); return; }
                  if (password.length < 6) { setAuthStatus({ type: 'error', message: 'Şifre en az 6 karakter olmalı.' }); return; }
                  if (!dbEnabled) { setAuthStatus({ type: 'error', message: 'Veritabanı bağlantısı yok. Vercel environment variables eksik.' }); return; }

                  setAuthStatus({ type: 'loading', message: authMode === 'signin' ? 'Giriş yapılıyor...' : 'Kayıt oluşturuluyor...' });

                  if (authMode === 'signup') {
                    localStorage.setItem(PENDING_SIGNUP_NAME_KEY, name);
                    const result = await signUp(email, password);
                    if (result.error) { localStorage.removeItem(PENDING_SIGNUP_NAME_KEY); setAuthStatus({ type: 'error', message: result.error }); return; }
                    const user = await getUser();
                    if (user?.email) {
                      setDbUserEmail(user.email);
                      const updatedLocal = { ...profile, name };
                      setProfile(updatedLocal);
                      saveProfile(updatedLocal);
                      await saveProfileToDb({ name, avatar: updatedLocal.avatar || '👤' }).catch(() => {});
                      await syncToCloud(updatedLocal, history);
                      setAuthStatus({ type: 'success', message: 'Kayıt ve giriş başarılı. Verilerin senkronize edildi.' });
                      localStorage.removeItem(PENDING_SIGNUP_NAME_KEY);
                      setTimeout(() => { setShowAuthModal(false); setAuthStatus({ type: 'idle', message: '' }); }, 700);
                    } else {
                      setAuthStatus({ type: 'success', message: 'Kayıt başarılı. E-posta onayını yaptıktan sonra giriş yapabilirsin.' });
                    }
                    return;
                  }

                  const result = await signIn(email, password);
                  if (result.error) { setAuthStatus({ type: 'error', message: result.error }); return; }
                  const user = await getUser();
                  if (user?.email) setDbUserEmail(user.email);
                  const cloudProfile = await loadProfileFromDb();
                  let mergedProfile: any = profile;
                  if (cloudProfile) {
                    mergedProfile = {
                      ...profile,
                      name: cloudProfile.name || profile.name || '',
                      avatar: cloudProfile.avatar || profile.avatar,
                      xp: cloudProfile.xp || profile.xp,
                      careerStage: cloudProfile.career_stage || profile.careerStage,
                      careerTestsAtStage: cloudProfile.career_tests || profile.careerTestsAtStage,
                      careerBestWords: cloudProfile.career_best_words || profile.careerBestWords,
                      careerBestAccuracy: cloudProfile.career_best_accuracy || profile.careerBestAccuracy,
                      totalTests: cloudProfile.total_tests || profile.totalTests,
                      totalPracticeMinutes: cloudProfile.total_practice_minutes || profile.totalPracticeMinutes,
                      weakWords: cloudProfile.weak_words || profile.weakWords,
                      dailyLogs: cloudProfile.daily_logs || profile.dailyLogs,
                      completedMissionIds: cloudProfile.completed_missions || profile.completedMissionIds,
                    };
                  } else {
                    mergedProfile = { ...profile, name: profile.name || '' };
                    await saveProfileToDb({ name: mergedProfile.name, avatar: mergedProfile.avatar || '👤' }).catch(() => {});
                  }
                  setProfile(mergedProfile);
                  saveProfile(mergedProfile);
                  await syncToCloud(mergedProfile, history);
                  setAuthStatus({ type: 'success', message: 'Giriş başarılı. Verilerin senkronize edildi.' });
                  setTimeout(() => { setShowAuthModal(false); setAuthStatus({ type: 'idle', message: '' }); }, 700);
                }} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                  {authStatus.type === 'loading' ? 'Bekleyin...' : (authMode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl mb-4">📱</div>
            <h2 className={`text-xl font-bold mb-2 ${theme.text}`}>Sonucunu Paylaş</h2>
            <p className={`${theme.textMuted} mb-6 text-sm`}>Rekorunu sosyal medyada paylaş!</p>
            {latestResult && (
              <div className={`p-4 rounded-xl mb-4 ${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <div className="text-3xl font-bold text-amber-400">{latestResult.netWords} kelime</div>
                <div className={`text-sm ${theme.textMuted}`}>{latestResult.wpm} WPM • {latestResult.accuracy}%</div>
              </div>
            )}
            <button onClick={generateShareImage} className="w-full px-6 py-3 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl mb-3 shadow-lg shadow-purple-500/25">📸 Görsel İndir (1080x1920)</button>
            <button onClick={generatePdfReport} className="w-full px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl mb-3 shadow-lg shadow-cyan-500/25">📄 PDF Raporu İndir</button>
            <button onClick={() => setShowShareModal(false)} className={`w-full px-6 py-3 rounded-xl font-semibold ${settings.darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>Kapat</button>
          </div>
        </div>
      )}

      {!settings.zenMode && !hideExamHeader && (
        <header className={`${settings.darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-gray-200'} border-b`}>
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); if (gameLoopRef.current) clearInterval(gameLoopRef.current); stopAmbientSound(); stopPaceIndicator(); timerRef.current = null; gameLoopRef.current = null; completedWordsRef.current = []; setTimerStarted(false); setExamMode(false); setGameState('landing'); }} className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
                <img src="/images/logo.png" alt="KatipTest" className="w-10 h-10 rounded-lg object-cover" />
                <div className="text-left">
                  <h1 className={`text-lg font-bold ${theme.text}`}>Katip<span className="text-amber-500">Test</span></h1>
                  <p className={`text-xs ${theme.textMuted}`}>Sınav Simülasyonu</p>
                </div>
              </button>
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold">⭐ Lv.{Math.floor((profile.xp || 0) / 200) + 1}</div>

                {(practiceStreak.currentStreak > 0 || streak > 0) && (
                  <div className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold" title={`En uzun seri: ${practiceStreak.longestStreak} gün`}>
                    🔥 {Math.max(practiceStreak.currentStreak, streak)} Gün
                  </div>
                )}

                <button onClick={() => { if (gameState === 'playing') return; setGameState('career'); }} className={`p-2 rounded-lg ${gameState === 'career' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Kariyer Modu">
                  <svg className={`w-5 h-5 ${gameState === 'career' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('profile'); }} className={`p-2 rounded-lg ${gameState === 'profile' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Profilim">
                  <svg className={`w-5 h-5 ${gameState === 'profile' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button onClick={async () => { if (gameState === 'playing') return; setLeaderboardLoading(true); setGameState('leaderboard'); try { const data = await getLeaderboard(leaderboardTab, 50); setLeaderboardData(data); } finally { setLeaderboardLoading(false); } }} className={`p-2 rounded-lg ${gameState === 'leaderboard' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Leaderboard">
                  <svg className={`w-5 h-5 ${gameState === 'leaderboard' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m3 6V7m3 10v-4m3 8H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('modes_hub'); }} className={`p-2 rounded-lg ${modesNavActive ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Modlar">
                  <svg className={`w-5 h-5 ${modesNavActive ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('analytics'); }} className={`p-2 rounded-lg ${gameState === 'analytics' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Analitik">
                  <svg className={`w-5 h-5 ${gameState === 'analytics' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('roadmap'); }} className={`p-2 rounded-lg ${gameState === 'roadmap' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Yol Haritası">
                  <svg className={`w-5 h-5 ${gameState === 'roadmap' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('contact'); }} className={`p-2 rounded-lg ${gameState === 'contact' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Contact Us">
                  <svg className={`w-5 h-5 ${gameState === 'contact' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>
                <button onClick={() => { if (gameState === 'playing') return; setGameState('blog'); }} className={`p-2 rounded-lg ${gameState === 'blog' ? 'bg-amber-500' : (settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300')} ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Blog">
                  <svg className={`w-5 h-5 ${gameState === 'blog' ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-gray-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </button>
                <button onClick={() => setShowSettings(true)} className={`p-2 rounded-lg ${settings.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                  <svg className={`w-5 h-5 ${settings.darkMode ? 'text-white' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                {dbUserEmail ? (
                    <button onClick={() => setShowLogoutConfirm(true)} className={`px-3 py-2 rounded-lg text-xs font-semibold ${settings.darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                      ☁️ {profile.name || 'Kullanıcı'} · Çıkış
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openAuth('signin')} className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${settings.darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}>
                        🔐 Giriş Yap
                      </button>
                      <button onClick={() => openAuth('signup')} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm">
                        ✨ Kayıt Ol
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}



      <main className={`${gameState === 'landing' ? 'w-full' : hideExamHeader ? 'max-w-4xl mx-auto px-3 py-2 min-h-screen' : 'max-w-6xl mx-auto px-4 py-6'} ${settings.zenMode && !hideExamHeader ? 'min-h-screen' : ''}`}>
        {gameState === 'landing' && (
          <div className="min-h-[90vh] flex flex-col w-screen relative left-1/2 -translate-x-1/2">
            {/* Hero */}
            <div className="relative min-h-[calc(100vh-73px)] overflow-hidden flex items-center justify-center text-center px-6 py-8">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/images/blog-hero.png"
              >
                <source src="https://cdn.coverr.co/videos/coverr-close-up-of-a-man-typing-on-the-keyboard-4926/1080p.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-slate-950/78" />
              <div className="absolute inset-0 bg-linear-to-b from-slate-950/20 via-slate-950/50 to-slate-950/90" />

              <div className="relative z-10 flex flex-col items-center space-y-8 max-w-4xl">
                <div className="flex flex-col items-center gap-5 fade-up">
                  <img src="/images/logo.png" alt="KatipTest" className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-amber-500/10 ring-1 ring-white/10" />
                  <div className="space-y-4 max-w-3xl">
                    <h1 className={`text-5xl md:text-7xl font-bold tracking-tight ${theme.text}`}>Katip<span className="text-amber-400">Test</span></h1>
                    <p className={`text-lg md:text-xl ${theme.textMuted} leading-relaxed max-w-2xl mx-auto`}>3 dakikada <span className="text-amber-400 font-semibold">90 kelime</span> hedefine ulaş.<br/>%40 hata barajına takılmadan, Adalet Bakanlığı standartlarında pratik yap.</p>
                    <p className={`text-sm md:text-base ${theme.textMuted} opacity-90 max-w-2xl mx-auto leading-relaxed`}>Gerçek sınav akışına uygun imlasız metinler, karakter bazlı hata sayımı, zayıf kelime analizi, kariyer modu ve bulut senkronizasyon ile hazırlan.</p>
                  </div>
                </div>

                <div className="fade-up fade-up-1 space-y-5">
                  <button onClick={() => setGameState('menu')} className="group relative px-14 py-4 bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 text-white font-bold text-lg rounded-2xl btn-glow transition-all transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden shadow-2xl shadow-amber-500/20">
                    <span className="relative z-10">Hemen Başla →</span>
                    <div className="absolute inset-0 bg-linear-to-t from-amber-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div className="flex flex-wrap justify-center gap-2 text-xs md:text-sm">
                    <span className={`px-3 py-1.5 rounded-full ${settings.darkMode ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'}`}>✅ İmlasız Mod</span>
                    <span className={`px-3 py-1.5 rounded-full ${settings.darkMode ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'}`}>⌨️ F / Q Klavye</span>
                    <span className={`px-3 py-1.5 rounded-full ${settings.darkMode ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'}`}>📊 %40 Hata Kuralı</span>
                    <span className={`px-3 py-1.5 rounded-full ${settings.darkMode ? 'bg-slate-900/70 text-slate-200 border border-white/10' : 'bg-white text-gray-700 border border-gray-200'}`}>🏛️ Bakanlık Uyumlu</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 w-full">
              {/* Özellikler */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-16 scroll-animate">
              {[
                { icon: '⚡', title: 'Birebir Sınav Simülasyonu', desc: '180 saniye kesin süre, F/Q klavye seçimi ve resmi akışa uygun sınav mantığı.' },
                { icon: '📊', title: 'Akıllı Hata Analizi', desc: 'Karakter bazlı hata hesabı, zayıf kelime analizi ve detaylı performans raporları.' },
                { icon: '🎓', title: 'Kariyer ve Sınav Modları', desc: 'Kariyer sistemi, sınav tadında mod, blur antrenmanı ve hız geliştirme akışları.' }
              ].map((f, i) => (
                <div key={i} className={`p-8 rounded-2xl ${settings.darkMode ? 'bg-slate-800/40 border border-slate-700/30' : 'bg-white border border-gray-200 shadow-sm'} text-center hover:-translate-y-0.5 transition-transform`}>
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className={`text-lg font-bold mb-2 ${theme.text}`}>{f.title}</h3>
                  <p className={`text-sm ${theme.textMuted} leading-relaxed`}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Tanıtım Detayları */}
            <div className={`py-12 rounded-3xl text-center scroll-animate scroll-delay-1 ${settings.darkMode ? 'bg-slate-800/25 border border-slate-700/30' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                {[
                  { num: '247', label: 'Güncel Hukuki Metin' },
                  { num: '180', label: 'Saniyede Sınav Akışı' },
                  { num: 'Anında', label: 'Detaylı Hata Analizi' },
                  { num: '7', label: 'Kariyer Aşaması' }
                ].map((s, i) => (
                  <div key={i}>
                    <div className="text-3xl font-bold text-amber-400">{s.num}</div>
                    <div className={`text-sm ${theme.textMuted} mt-1`}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modlar */}
            <div className="py-16 space-y-8 scroll-animate scroll-delay-2">
              <h2 className={`text-2xl font-bold text-center ${theme.text}`}>Antrenman Modları</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🎓', name: 'Sınav Tadında', desc: 'Birebir sınav', color: 'text-emerald-400' },
                  { icon: '🎯', name: 'Blur Modu', desc: 'Kas hafızası', color: 'text-purple-400' },
                  { icon: '💀', name: 'Kırmızı Çizgi', desc: 'Sıfır hata', color: 'text-red-400' },
                  { icon: '🎧', name: 'Sınav Gürültüsü', desc: 'Ortam sesi', color: 'text-blue-400' },
                  { icon: '🏋️', name: 'Hız Antrenmanı', desc: '1dk sprint', color: 'text-orange-400' }
                ].map((m, i) => (
                  <div key={i} className={`p-5 rounded-xl text-center ${settings.darkMode ? 'bg-slate-800/40 border border-slate-700/30' : 'bg-white border border-gray-200'}`}>
                    <div className="text-3xl mb-2">{m.icon}</div>
                    <div className={`font-semibold ${m.color}`}>{m.name}</div>
                    <div className={`text-xs ${theme.textMuted} mt-1`}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          </div>
        )}

        {gameState === 'menu' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 md:space-y-8">
            {/* Hero with glow */}
            <div className="text-center space-y-4 hero-glow relative">
              {/* Terazi silüeti — sağ üst dekorasyon */}
              <div className="absolute -right-16 top-0 opacity-[0.03] text-[200px] pointer-events-none select-none hidden md:block">⚖️</div>
              
              <div className="relative z-10">
                <img src="/images/logo.png" alt="KatipTest" className="w-20 h-20 rounded-2xl mx-auto object-cover shadow-lg shadow-amber-500/10 fade-up" />
              </div>
              {profile.name ? (
                <div className="fade-up fade-up-1">
                  <h2 className={`text-3xl font-bold tracking-tight ${theme.text}`}>Hoş geldin, <span className="text-amber-400">{profile.name}</span></h2>
                  <p className={`text-sm ${theme.textMuted} mt-2 max-w-md mx-auto leading-relaxed`}>
                    {["Başarı tesadüf değildir her gün bir adım daha ileriye","Bugün döktüğün ter yarın seni zirveye taşır","Pratik mükemmelliği getirir her tuş seni hedefe yaklaştırır","Dünden daha hızlısın bugün daha da hızlı olacaksın","Sınav günü geldiğinde hazır olacaksın çünkü her gün çalıştın","Başarının sırrı pes etmemektir bir test daha çöz","Her hata bir ders her doğru bir zafer","Küçük adımlar büyük başarılara yol açar devam et","Parmakların ne kadar hızlı olursa geleceğin o kadar parlak olur","Hedefine odaklan gerisi kendiliğinden gelecek","Disiplin yeteneği yener her gün pratik yap","Sınavı kazanan en çok çalışan değil en düzenli çalışandır","Rakiplerin şu an dinlenirken sen çalışıyorsun farkı kapat","Kendine inan çünkü sen yapabilirsin","Her yeni gün yeni bir fırsat her test yeni bir şans","Mükemmellik bir alışkanlıktır her gün biraz daha iyi ol","Sabır ve azim her kapıyı açar sınav kapısı da dahil","Bugünün acemisi yarının ustasıdır pratik yapmaya devam et","Sınav sadece bir engel sen ise bir savaşçısın","Zirveye çıkan yol zor olabilir ama manzara muhteşem olacak"][Math.floor(Date.now() / 86400000) % 20]} 💪
                  </p>
                </div>
              ) : (
                <div className="fade-up fade-up-1">
                  <h2 className={`text-3xl font-bold tracking-tight ${theme.text}`}>Katip<span className="text-amber-400">Test</span></h2>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>Zabıt Katipliği Sınav Simülasyonu</p>
                </div>
              )}
            </div>

            {/* Hızlı İstatistik Şeridi */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 fade-up fade-up-2 px-2">
              {(practiceStreak.currentStreak > 0 || streak > 0) && (
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${settings.darkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                  🔥 {Math.max(practiceStreak.currentStreak, streak)} gün seri
                  {practiceStreak.todayCompleted && <span className="ml-1">✓</span>}
                </div>
              )}
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${settings.darkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>⭐ Seviye {Math.floor((profile.xp || 0) / 200) + 1}</div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${settings.darkMode ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>{CAREER_STAGES[Math.min((profile.careerStage || 1) - 1, CAREER_STAGES.length - 1)].icon} {CAREER_STAGES[Math.min((profile.careerStage || 1) - 1, CAREER_STAGES.length - 1)].title}</div>
              {bestWordsAll > 0 && <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${settings.darkMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'}`}>🏆 En iyi: {bestWordsAll} kelime</div>}
            </div>

            {/* Ana Aksiyonlar */}
            <div className="fade-up fade-up-3 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button onClick={() => startGameWithTime(180, undefined, false)} className="group relative w-full sm:w-auto px-10 md:px-12 py-4 bg-linear-to-b from-amber-400 via-amber-500 to-amber-600 text-white font-bold text-lg rounded-2xl btn-glow transition-all transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden">
                <span className="relative z-10">⚡ Sınava Başla</span>
                <div className="absolute inset-0 bg-linear-to-t from-amber-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button onClick={() => { setExamReady(false); setGameState('exam_setup'); }} className="group relative w-full sm:w-auto px-8 md:px-10 py-4 bg-linear-to-b from-emerald-500 via-emerald-600 to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.03] active:scale-[0.98] overflow-hidden">
                <span className="relative z-10">🎓 Sınav Tadında</span>
                <div className="absolute inset-0 bg-linear-to-t from-emerald-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Diğer Modlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl w-full fade-up fade-up-4">
              {[
                { label: 'Isınma', sub: '30 saniye', icon: '🏃', color: 'text-emerald-400', action: () => startGameWithTime(30, undefined, false) },
                { label: 'Serbest Süre', sub: 'Özel süre', icon: '⏱️', color: 'text-cyan-400', action: () => setShowCustomTime(!showCustomTime) },
                { label: 'Antrenman', sub: '1 dakika', icon: '🏋️', color: 'text-orange-400', action: () => { setSettings(s => ({ ...s, hardMode: true })); setTimeout(() => startGameWithTime(60, undefined, false), 50); } },
                { label: 'Tekerleme', sub: '3 dk · hız & ritim', icon: '🗣️', color: 'text-fuchsia-400', action: () => startGameWithTime(TEKERLEME_DURATION_SEC, undefined, false, 'tekerleme') },
                profile.weakWords.length > 0
                  ? { label: 'Zayıf Nokta', sub: `${profile.weakWords.length} kelime`, icon: '🎯', color: 'text-rose-400', action: () => { const wt = generateWeakWordText(profile.weakWords, 150); startGameWithTime(180, wt, false); } }
                  : { label: 'Hedef Belirle', sub: 'Plan kur', icon: '📋', color: 'text-violet-400', action: () => setShowGoalModal(true) },
                weakestKeyStats.length > 0
                  ? {
                      label: 'Zayıf Tuş',
                      sub: describeTrainerFocus(analytics.keyStats, 'weak'),
                      icon: '⌨️',
                      color: 'text-rose-400',
                      action: () => startTrainerSession({ durationSec: 180, difficulty: 'medium', focus: 'weak' }),
                    }
                  : {
                      label: 'Zayıf Tuş',
                      sub: 'Önce bir test çöz',
                      icon: '⌨️',
                      color: 'text-slate-400',
                      disabled: true,
                    },
                { label: 'Modlar', sub: 'Pratik · Antrenör', icon: '🧭', color: 'text-indigo-400', action: () => setGameState('modes_hub') },
                { label: 'Sınav Modu', sub: `${examProgressSummary.completed}/${examProgressSummary.total} metin`, icon: '📋', color: 'text-violet-400', action: () => setGameState('exam_catalog') },
              ].map((m, i) => (
                <button key={i} onClick={m.action} disabled={m.disabled} className={`group relative py-4 px-3 rounded-2xl text-center transition-all card-hover overflow-hidden ${m.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${settings.darkMode ? 'bg-slate-800/60 border border-slate-700/40 hover:border-slate-600' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'}`}>
                  <span className="block text-2xl mb-1.5 group-hover:scale-110 transition-transform">{m.icon}</span>
                  <span className={`block text-sm font-semibold ${m.color}`}>{m.label}</span>
                  <span className={`block text-xs ${theme.textMuted} mt-0.5`}>{m.sub}</span>
                </button>
              ))}
            </div>

            {/* Alt satır */}
            <div className="flex items-center gap-3 flex-wrap justify-center fade-up fade-up-4">
              <button onClick={() => setGameState('analytics')} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${settings.darkMode ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50'}`}>📊 Analitik</button>
              <button onClick={() => setShowBadges(!showBadges)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${settings.darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>🏆 Rozetler {badges.filter(b => b.earned).length}/{badges.length}</button>
              <button onClick={() => setShowGoalModal(!showGoalModal)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${settings.darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>📋 Hedef</button>
            </div>



            {showCustomTime && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 max-w-2xl w-full`}>
                <div className={`text-sm font-semibold mb-3 ${theme.text}`}>⏱️ Süreyi Seç</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[1, 2, 3, 5, 7, 10, 15, 20].map(m => (
                    <button key={m} onClick={() => setCustomMinutes(m)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${customMinutes === m ? 'bg-cyan-500 text-white' : (settings.darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')}`}>
                      {m} dk
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowCustomTime(false); startGameWithTime(customMinutes * 60, undefined, false); }} className="w-full py-3 bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-xl transition-all">
                  {customMinutes} Dakika ile Başla
                </button>
              </div>
            )}

            {/* Goal & Profile Summary */}
            {(profile.goal || profile.totalTests > 0) && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 max-w-3xl w-full`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>{profile.totalTests}</div>
                    <div className={`text-xs ${theme.textMuted}`}>Toplam Test</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-amber-400`}>{profile.totalPracticeMinutes} dk</div>
                    <div className={`text-xs ${theme.textMuted}`}>Pratik Süresi</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-red-400`}>{profile.weakWords.length}</div>
                    <div className={`text-xs ${theme.textMuted}`}>Zayıf Kelime</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-green-400`}>{profile.dailyLogs.find(l => l.date === new Date().toLocaleDateString('tr-TR'))?.testsCompleted || 0}</div>
                    <div className={`text-xs ${theme.textMuted}`}>Bugün</div>
                  </div>
                </div>
                {profile.goal && (() => {
                  const bestWords = bestWordsAll;
                  const bestChars = bestCharsAll;
                  const wordPct = Math.min(100, (bestWords / profile.goal.targetWords) * 100);
                  const charPct = Math.min(100, (bestChars / (profile.goal.targetChars || 500)) * 100);
                  return (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className={theme.textMuted}>Bitiş: {profile.goal.targetDate}</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={theme.textMuted}>📝 Kelime: {bestWords} / {profile.goal.targetWords}</span>
                          <span className={`font-semibold ${wordPct >= 100 ? 'text-green-400' : 'text-amber-400'}`}>{Math.round(wordPct)}%</span>
                        </div>
                        <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                          <div className={`h-full transition-all ${wordPct >= 100 ? 'bg-green-500' : 'bg-linear-to-r from-purple-500 to-pink-500'}`} style={{ width: `${wordPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={theme.textMuted}>⌨️ Karakter: {bestChars} / {profile.goal.targetChars || 500}</span>
                          <span className={`font-semibold ${charPct >= 100 ? 'text-green-400' : 'text-blue-400'}`}>{Math.round(charPct)}%</span>
                        </div>
                        <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                          <div className={`h-full transition-all ${charPct >= 100 ? 'bg-green-500' : 'bg-linear-to-r from-blue-500 to-cyan-500'}`} style={{ width: `${charPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {showBadges && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6 max-w-4xl w-full`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${theme.text}`}>Rozetler</h3>
                  <div className={`text-sm ${theme.textMuted}`}>{badges.filter(b => b.earned).length}/{badges.length} kazanıldı</div>
                </div>
                <div className="space-y-5">
                  <div>
                    <div className={`text-sm font-semibold mb-3 ${theme.text}`}>✨ Kazanılanlar</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {badges.filter(b => b.earned).map(badge => (
                        <div key={badge.id} className={`${settings.darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4`}>
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{badge.icon}</div>
                            <div>
                              <div className={`text-sm font-semibold ${theme.text}`}>{badge.name}</div>
                              <div className={`text-xs ${theme.textMuted} mt-1 leading-relaxed`}>{badge.description}</div>
                              <div className="text-xs text-green-400 mt-2 font-semibold">✓ Kazanıldı {badge.earnedDate ? `• ${badge.earnedDate}` : ''}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {badges.filter(b => b.earned).length === 0 && <div className={`text-sm ${theme.textMuted}`}>Henüz rozet kazanmadın. İlk sınavını çözüp seriyi başlat!</div>}
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold mb-3 ${theme.text}`}>🔒 Kilitli Rozetler</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {badges.filter(b => !b.earned).map(badge => (
                        <div key={badge.id} className={`${settings.darkMode ? 'bg-slate-700/25 border-slate-700/40' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 opacity-80`}>
                          <div className="flex items-start gap-3">
                            <div className="text-3xl grayscale">{badge.icon}</div>
                            <div>
                              <div className={`text-sm font-semibold ${theme.text}`}>{badge.name}</div>
                              <div className={`text-xs ${theme.textMuted} mt-1 leading-relaxed`}>{badge.description}</div>
                              <div className={`text-xs mt-2 ${theme.textMuted}`}>Açılmayı bekliyor</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {recentHistory.length > 0 && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6 max-w-4xl w-full`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>📈 Gelişim</h3>
                    <p className={`text-xs ${theme.textMuted}`}>Son 30 gün içindeki tüm sınav sonuçları · {recentHistory.length} kayıt</p>
                  </div>
                  <div className={`flex rounded-lg overflow-hidden border ${settings.darkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                    {([['words', 'Kelime'], ['chars', 'Karakter'], ['perf', 'Hız']] as const).map(([key, label]) => (
                      <button key={key} onClick={() => setChartTab(key)} className={`px-4 py-1.5 text-xs font-semibold transition-colors ${chartTab === key ? 'bg-amber-500 text-white' : (settings.darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-gray-600 hover:bg-gray-100')}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grafik açıklaması */}
                <div className="flex items-center gap-4 mb-3">
                  {chartTab === 'words' && <span className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span><span className={theme.textMuted}>Doğru Kelime</span></span>}
                  {chartTab === 'chars' && <span className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span><span className={theme.textMuted}>Doğru Karakter</span></span>}
                  {chartTab === 'perf' && <><span className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1"></span><span className={theme.textMuted}>WPM</span></span><span className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span><span className={theme.textMuted}>Doğruluk %</span></span></>}
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} onClick={(state: any) => { const payload = state?.activePayload?.[0]?.payload; if (payload?.raw) setSelectedChartResult(payload.raw); }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={settings.darkMode ? '#1e293b' : '#f3f4f6'} />
                      <XAxis dataKey="test" stroke={settings.darkMode ? '#64748b' : '#9ca3af'} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={settings.darkMode ? '#64748b' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} width={35} />
                      <Tooltip contentStyle={{ backgroundColor: settings.darkMode ? '#1e293b' : '#fff', border: `1px solid ${settings.darkMode ? '#334155' : '#e5e7eb'}`, borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} itemStyle={{ color: settings.darkMode ? '#e2e8f0' : '#1f2937' }} labelFormatter={(v) => `Sınav #${v}`} />
                      {chartTab === 'words' && <Line type="monotone" dataKey="netWords" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} name="Doğru Kelime" />}
                      {chartTab === 'chars' && <Line type="monotone" dataKey="correctChars" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }} name="Doğru Karakter" />}
                      {chartTab === 'perf' && <Line type="monotone" dataKey="wpm" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} name="En İyi WPM" />}
                      {chartTab === 'perf' && <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} name="En İyi Doğruluk %" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {selectedChartResult && (
                  <div className={`${settings.darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4 mt-4`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className={`text-sm font-semibold ${theme.text}`}>Tıklanan Sınav Detayı</div>
                        <div className={`text-xs ${theme.textMuted}`}>{selectedChartResult.date}</div>
                      </div>
                      <button onClick={() => setSelectedChartResult(null)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${settings.darkMode ? 'bg-slate-700 text-slate-200' : 'bg-white text-gray-700 border border-gray-200'}`}>Kapat</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><div className={theme.textMuted}>Kelime</div><div className="font-semibold"><span className="text-green-400">{selectedChartResult.netWords}</span>/<span className="text-red-400">{selectedChartResult.grossWords - selectedChartResult.netWords}</span></div></div>
                      <div><div className={theme.textMuted}>Karakter</div><div className="font-semibold"><span className="text-green-400">{selectedChartResult.correctChars}</span>/<span className="text-red-400">{selectedChartResult.incorrectChars}</span></div></div>
                      <div><div className={theme.textMuted}>WPM</div><div className="font-semibold text-amber-400">{selectedChartResult.wpm}</div></div>
                      <div><div className={theme.textMuted}>Doğruluk</div><div className={`font-semibold ${selectedChartResult.accuracy >= 95 ? 'text-green-400' : selectedChartResult.accuracy >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{selectedChartResult.accuracy}%</div></div>
                    </div>
                  </div>
                )}

                {/* Son 30 gün sonuç listesi */}
                <div className={`mt-4 max-h-80 overflow-y-auto rounded-lg border ${settings.darkMode ? 'border-slate-700/60' : 'border-gray-200'}`}>
                  <table className="w-full text-xs">
                    <thead className={`${settings.darkMode ? 'bg-slate-900/60' : 'bg-gray-50'} sticky top-0`}>
                      <tr className={`${settings.darkMode ? 'border-slate-700' : 'border-gray-200'} border-b`}>
                        <th className={`text-left py-2 px-3 ${theme.textMuted} font-medium`}>Tarih</th>
                        <th className={`text-right py-2 px-3 ${theme.textMuted} font-medium`}>Kelime</th>
                        <th className={`text-right py-2 px-3 ${theme.textMuted} font-medium`}>Karakter</th>
                        <th className={`text-right py-2 px-3 ${theme.textMuted} font-medium`}>WPM</th>
                        <th className={`text-right py-2 px-3 ${theme.textMuted} font-medium`}>Doğruluk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentHistory.slice().reverse().map((item, index) => (
                        <tr key={`${item.timestamp}-${index}`} className={`${settings.darkMode ? 'border-slate-700/50' : 'border-gray-100'} border-b last:border-0`}>
                          <td className={`py-1.5 px-3 ${theme.textMuted}`}>{item.date}</td>
                          <td className="py-1.5 px-3 text-right font-semibold"><span className="text-green-400">{item.netWords}</span><span className={theme.textMuted}>/</span><span className="text-red-400">{item.grossWords - item.netWords}</span><span className={`ml-1 text-[10px] ${theme.textMuted}`}>({item.grossWords})</span></td>
                          <td className="py-1.5 px-3 text-right font-semibold"><span className="text-green-400">{item.correctChars}</span><span className={theme.textMuted}>/</span><span className="text-red-400">{item.incorrectChars}</span><span className={`ml-1 text-[10px] ${theme.textMuted}`}>({item.totalChars})</span></td>
                          <td className="py-1.5 px-3 text-right text-amber-400 font-semibold">{item.wpm}</td>
                          <td className={`py-1.5 px-3 text-right font-semibold ${item.accuracy >= 95 ? 'text-green-400' : item.accuracy >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{item.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <div className={examFocusMode ? 'flex flex-col gap-2 min-h-[calc(100vh-0.75rem)]' : `space-y-2 ${!settings.zenMode ? 'pb-20' : 'pb-4'}`}>
            {examFocusMode ? (
              <>
                <div className="flex flex-row items-start gap-2 sm:gap-3 flex-1 min-h-0">
                  <div
                    ref={examPanelRef}
                    className={`flex-1 min-w-0 flex flex-col rounded-xl border ${
                      settings.darkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className={`text-[10px] uppercase tracking-wider font-semibold px-3 pt-2 pb-0.5 ${theme.textMuted}`}>
                      Referans Metin
                    </div>
                    <div
                      ref={textContainerRef}
                      className={`font-mono flex-1 min-h-0 overflow-y-auto px-3 pb-2 leading-relaxed tracking-wide ${
                        settings.darkMode ? 'text-slate-200' : 'text-gray-800'
                      }`}
                      style={{
                        fontSize: `${referenceFontSize}px`,
                        lineHeight: REFERENCE_LINE_HEIGHT,
                        maxHeight: 'calc(100vh - 8rem)',
                      }}
                    >
                      {currentText}
                    </div>
                  </div>
                  <div className="flex shrink-0 self-start sticky top-0 pt-1">
                    <AlarmClockTimer
                      seconds={timeRemaining}
                      totalSeconds={initialTimeRef.current}
                      unlimited={examTimerUnlimited}
                      darkMode={settings.darkMode}
                    />
                  </div>
                </div>
                <div
                  className={`shrink-0 rounded-xl border ${
                    settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div
                    ref={writingAreaRef}
                    role="textbox"
                    aria-label="Yazım alanı"
                    onClick={() => inputRef.current?.focus()}
                    className={`relative min-h-16 max-h-20 overflow-hidden rounded-xl ${
                      settings.darkMode ? 'bg-slate-950' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 min-h-16">
                      {completedWords.map((entry, index) => {
                        const display = entry.skipped && !entry.word ? '—' : entry.word || '—';
                        return (
                          <span
                            key={index}
                            className={`font-mono leading-snug select-none opacity-50 ${
                              settings.darkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}
                            style={{
                              fontSize: `${referenceFontSize}px`,
                            }}
                          >
                            {display}
                          </span>
                        );
                      })}
                      <span className="inline-flex items-baseline max-w-full">
                        <input
                          ref={inputRef}
                          type="text"
                          value={currentWordInput}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          size={Math.max(4, currentWordInput.length + 2)}
                          className={`font-mono leading-snug bg-transparent outline-none border-b border-slate-500/60 max-w-full min-w-[3ch] ${
                            settings.darkMode ? 'text-white caret-slate-300' : 'text-gray-900 caret-gray-700'
                          }`}
                          style={{
                            fontSize: `${referenceFontSize}px`,
                          }}
                          placeholder={completedWords.length === 0 ? 'Yazmaya başlayın…' : ''}
                          autoFocus
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                        />
                      </span>
                    </div>
                    {(completedWords.length > 0 || currentWordInput.length > 0) && (
                      <div className={`absolute bottom-1.5 right-3 text-[10px] pointer-events-none ${theme.textMuted}`}>
                        Odak: referans metin
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentWordInput.trim().length > 0) {
                      const tw = splitTextWords(currentText);
                      const ci = completedWordsRef.current.length;
                      const cw = tw[ci] || '';
                      const ic = normalizeExamWord(currentWordInput.trim()) === normalizeExamWord(cw);
                      const entry = { word: currentWordInput.trim(), isCorrect: ic, correctWord: cw, skipped: false };
                      completedWordsRef.current = [...completedWordsRef.current, entry];
                      setCompletedWords([...completedWordsRef.current]);
                    }
                    endGame();
                  }}
                  className={`shrink-0 w-full py-3 rounded-xl font-semibold text-sm ${
                    settings.darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                  }`}
                >
                  Sınavı Bitir
                </button>
              </>
            ) : (
              <>
            {settings.gameMode && (
              <div className={`${settings.darkMode ? 'bg-slate-800/80' : 'bg-white'} ${settings.darkMode ? 'border-slate-600' : 'border-gray-300'} border-2 rounded-xl p-4`}>
                <div className={`text-xs font-semibold mb-2 ${theme.textMuted}`}>🎮 OYUN MODU</div>
                <div className={`h-24 ${settings.darkMode ? 'bg-slate-900' : 'bg-gray-200'} rounded-lg relative overflow-hidden`}>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-600"></div>
                  <div className="absolute bottom-8 left-4 w-12 h-12 bg-amber-500 rounded flex items-center justify-center text-2xl">🏃</div>
                  {gameObstacles.map((obs, i) => (
                    <div key={i} className="absolute bottom-8 w-10 h-10 flex items-center justify-center text-2xl" style={{ left: obs.x }}>
                      {obs.type === 'rock' ? '🪨' : '🌵'}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {settings.usePace && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-lg p-4`}>
                <div className="flex justify-between text-sm mb-2">
                  <span className={theme.textMuted}>🎯 Hedef Ritim: {settings.paceWPM} WPM</span>
                  <span className={theme.textMuted}>{Math.round(paceProgress)}%</span>
                </div>
                <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                  <div className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-1000" style={{ width: `${paceProgress}%` }} />
                </div>
              </div>
            )}


            {settings.distractionMode && <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-center"><span className="text-red-400 font-semibold">🎧 Sınav Salonu Gürültüsü Aktif - Odaklanın!</span></div>}
            {settings.suddenDeath && <div className="px-4 py-2 bg-red-600/20 border border-red-600/30 rounded-lg text-center"><span className="text-red-500 font-semibold">💀 KIRMIZI ÇİZGİ - Tek hata = ELİME!</span></div>}
            {tekerlemeMode && (
              <div className="px-4 py-3 bg-fuchsia-500/10 border border-fuchsia-500/25 rounded-lg text-center">
                <div className="text-sm font-semibold text-fuchsia-300">🗣️ Tekerleme modu · 3 dakika</div>
                <div className="text-xs text-fuchsia-200/90 mt-1">
                  {activeTekerlemeTitle || 'Tekerleme'} — ritim ve doğruluk odaklı yaz; hızı kademeli artır.
                </div>
              </div>
            )}
            {dedicatedExamActive && (
              <div className="px-4 py-3 bg-indigo-500/15 border border-indigo-500/30 rounded-lg text-center">
                <div className="text-sm font-semibold text-indigo-300">📋 Sınav Modu — {activeExamTitle}</div>
                <div className="text-xs text-indigo-200/80 mt-1">Sabit metin · karıştırma kapalı · antrenman enjeksiyonu yok</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div ref={examPanelRef} className={`flex-1 min-w-0 ${settings.darkMode ? 'bg-slate-800/80' : 'bg-white'} ${settings.darkMode ? 'border-slate-600/80' : 'border-gray-300'} border rounded-xl p-3 md:p-4`}>
                <div className={`flex items-center justify-between gap-2 mb-2 ${settings.zenMode ? 'mb-1' : ''}`}>
                  {!settings.zenMode ? (
                    <div className={`text-xs font-semibold ${theme.textMuted} flex items-center min-w-0 flex-1`}>
                      <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      <span className="truncate">REFERANS METİN {settings.aiTextMode && '(🤖 AI)'} {settings.useCustomText && '(📝 Özel)'}</span>
                    </div>
                  ) : <div className="flex-1" />}
                  {!settings.zenMode && !timerStarted && !dedicatedExamActive && (
                    <button onClick={() => { const words = currentText.split(/\s+/); for (let j = words.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [words[j], words[k]] = [words[k], words[j]]; } setCurrentText(words.join(' ')); setCompletedWords([]); setCurrentWordInput(''); }} className={`px-2 py-1 rounded text-xs transition-colors shrink-0 ${settings.darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Kelimeleri karıştır">
                      🔀
                    </button>
                  )}
                </div>
                <div ref={textContainerRef} className={`font-mono px-3 py-3 min-h-44 max-h-[calc(100vh-11rem)] sm:max-h-[calc(100vh-10rem)] leading-relaxed tracking-wide whitespace-normal overflow-y-auto ${settings.darkMode ? 'text-slate-200' : 'text-gray-800'}`} style={{ fontSize: `${gameState === 'playing' ? referenceFontSize : getReferenceFontPx(settings.fontSize)}px`, lineHeight: REFERENCE_LINE_HEIGHT }}>
                  {currentText}
                  {particles.map(p => (
                    <div key={p.id} className="fixed w-2 h-2 rounded-full animate-ping" style={{ left: p.x, top: p.y, backgroundColor: p.color }} />
                  ))}
                </div>
              </div>

              <div className="flex justify-end sm:justify-center shrink-0 sm:self-start sm:sticky sm:top-20 px-0 sm:px-1 pt-2">
                <AlarmClockTimer
                  seconds={timeRemaining}
                  totalSeconds={initialTimeRef.current}
                  unlimited={examTimerUnlimited}
                  darkMode={settings.darkMode}
                />
              </div>
            </div>

            <div className={`${settings.darkMode ? 'bg-slate-800/90 border-amber-500/40 ring-2 ring-amber-500/25' : 'bg-white border-amber-400/50 ring-2 ring-amber-400/20'} border-2 rounded-xl p-2.5 md:p-3 shadow-lg ${settings.darkMode ? 'shadow-black/40' : 'shadow-amber-500/10'}`}>
                {!settings.zenMode && <div className={`text-xs font-semibold mb-1 ${theme.textMuted} flex items-center justify-between`}>
                  <div className="flex items-center text-amber-400/90">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    YAZIM ALANI
                  </div>
                  {capsLockOn && <div className="flex items-center text-red-400 font-semibold text-[11px]">⚠️ CAPSLOCK</div>}
                  {examMode && !dedicatedExamActive && <div className="flex items-center text-emerald-400 font-semibold text-[11px]">🎓 SINAV</div>}
                  {dedicatedExamActive && <div className="flex items-center text-indigo-400 font-semibold text-[11px]">📋 SINAV MODU</div>}
                </div>}
                <div
                  ref={writingAreaRef}
                  role="textbox"
                  aria-label="Yazım alanı"
                  onClick={() => inputRef.current?.focus()}
                  className={`relative min-h-17 max-h-34 overflow-y-auto rounded-lg transition-shadow focus-within:ring-2 focus-within:ring-amber-400/80 focus-within:border-amber-400 ${settings.darkMode ? 'bg-slate-950 border-slate-600' : 'bg-gray-50 border-gray-300'} border-2`}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5 px-3 py-2 min-h-17">
                    {completedWords.map((entry, index) => {
                      const display = entry.skipped && !entry.word ? '—' : entry.word || '—';
                      const tokenClass = entry.skipped
                        ? (settings.darkMode ? 'text-red-400/45' : 'text-red-500/50')
                        : entry.isCorrect
                        ? (settings.darkMode ? 'text-sky-300/50' : 'text-sky-600/55')
                        : (settings.darkMode ? 'text-red-400/55' : 'text-red-500/60');
                      const wordFontSize = gameState === 'playing' ? referenceFontSize : getReferenceFontPx(settings.fontSize);
                      return (
                        <span
                          key={index}
                          className={`font-mono leading-snug select-none opacity-50 scale-[0.98] transition-[opacity,color,filter] duration-200 ${tokenClass}`}
                          style={{
                            fontSize: `${wordFontSize}px`,
                          }}
                        >
                          {display}
                        </span>
                      );
                    })}
                    <span className="inline-flex items-baseline max-w-full">
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentWordInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        size={Math.max(4, currentWordInput.length + 2)}
                        className={`font-mono leading-snug bg-transparent outline-none border-b-2 border-amber-400/90 max-w-full min-w-[3ch] ${settings.darkMode ? 'text-white caret-amber-400' : 'text-gray-900 caret-amber-600'} ${completedWords.length === 0 ? (settings.darkMode ? 'placeholder:text-slate-500' : 'placeholder:text-gray-400') : ''}`}
                        style={{
                          fontSize: `${gameState === 'playing' ? referenceFontSize : getReferenceFontPx(settings.fontSize)}px`,
                        }}
                        placeholder={completedWords.length === 0 ? 'Kelimeyi buraya yazın…' : ''}
                        autoFocus
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    </span>
                  </div>
                </div>
                {!settings.zenMode && <div className={`mt-1 text-[11px] ${theme.textMuted} flex flex-wrap items-center gap-2`}>
                  <span className="flex items-center"><kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] mr-1 ${settings.darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>Space</kbd>Tamamla</span>
                  <span className="flex items-center"><kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] mr-1 ${settings.darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>Enter</kbd>Atla</span>
                  <span className="flex items-center"><kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] mr-1 ${settings.darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>Tab</kbd>Bitir</span>
                </div>}
            </div>
            {!settings.zenMode && (
              <button
                type="button"
                onClick={() => {
                  if (currentWordInput.trim().length > 0) {
                    const tw = splitTextWords(currentText);
                    const ci = completedWordsRef.current.length;
                    const cw = tw[ci] || '';
                    const ic = normalizeExamWord(currentWordInput.trim()) === normalizeExamWord(cw);
                    const entry = { word: currentWordInput.trim(), isCorrect: ic, correctWord: cw, skipped: false };
                    completedWordsRef.current = [...completedWordsRef.current, entry];
                    setCompletedWords([...completedWordsRef.current]);
                  }
                  endGame();
                }}
                className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl font-bold text-sm font-mono tracking-wide shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${settings.darkMode ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 ring-2 ring-red-400/30' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 ring-2 ring-red-400/25'}`}
              >
                Testi Bitir
              </button>
            )}
              </>
            )}
          </div>
        )}

        {gameState === 'finished' && history[0] && (
          <div className="space-y-6">
            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-8`}>
              <h2 className={`text-2xl font-bold text-center mb-4 ${theme.text}`}>{examMode ? '🎓 Sınav Tadında — Sonuçlar' : 'Sınav Sonuçları'}</h2>

              {/* Sınav Tadında Değerlendirme */}
              {examMode && history[0] && (() => {
                const errorRate = history[0].grossWords > 0 ? ((history[0].grossWords - history[0].netWords) / history[0].grossWords) * 100 : 0;
                const passed90 = history[0].netWords >= 90;
                const passedIntegrity = errorRate <= 40;
                const examPassed = passed90 && passedIntegrity;
                return (
                  <div className={`mb-6 p-5 rounded-xl text-center ${examPassed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} border`}>
                    <div className={`text-4xl mb-2`}>{examPassed ? '✅' : '❌'}</div>
                    <div className={`text-xl font-bold ${examPassed ? 'text-emerald-400' : 'text-red-400'}`}>{examPassed ? 'SINAV BAŞARILI' : 'SINAV BAŞARISIZ'}</div>
                    <div className={`text-sm mt-2 space-y-1 ${theme.textMuted}`}>
                      <div className={passed90 ? 'text-emerald-400' : 'text-red-400'}>{passed90 ? '✓' : '✗'} 90 kelime barajı: {history[0].netWords} kelime</div>
                      <div className={passedIntegrity ? 'text-emerald-400' : 'text-red-400'}>{passedIntegrity ? '✓' : '✗'} Anlam bütünlüğü: %{Math.round(errorRate)} hata oranı {!passedIntegrity && '(maks %40)'}</div>
                    </div>
                  </div>
                );
              })()}

              {examMode && history[0] && (() => {
                const wr = history[0].examWordResults;
                const wordCorrect = wr?.length
                  ? wr.filter((r) => r.outcome === 'correct').length
                  : history[0].netWords;
                const wordWrong = wr?.length
                  ? wr.filter((r) => r.outcome === 'wrong').length
                  : Math.max(0, history[0].grossWords - history[0].netWords);
                const wordSkipped = wr?.length ? wr.filter((r) => r.outcome === 'skipped').length : 0;
                return (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4`}>
                      <div className={`text-xs font-semibold uppercase mb-2 ${theme.textMuted}`}>Kelime</div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div><div className="text-xl font-bold text-green-400">{wordCorrect}</div><div className={theme.textMuted}>Doğru</div></div>
                        <div><div className="text-xl font-bold text-red-400">{wordWrong}</div><div className={theme.textMuted}>Yanlış</div></div>
                        <div><div className="text-xl font-bold text-orange-400">{wordSkipped}</div><div className={theme.textMuted}>Atlanan</div></div>
                      </div>
                    </div>
                    <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4`}>
                      <div className={`text-xs font-semibold uppercase mb-2 ${theme.textMuted}`}>Karakter</div>
                      <div className="grid grid-cols-2 gap-2 text-center text-sm">
                        <div><div className="text-xl font-bold text-green-400">{history[0].correctChars}</div><div className={theme.textMuted}>Doğru</div></div>
                        <div><div className="text-xl font-bold text-red-400">{history[0].incorrectChars}</div><div className={theme.textMuted}>Yanlış</div></div>
                      </div>
                    </div>
                  </div>
                  {wr && wr.length > 0 && (
                    <div className="mb-4">
                      <ExamWrongWordsPanel
                        wrongWords={wr.filter((r) => r.outcome === 'wrong' || r.outcome === 'skipped')}
                        theme={theme}
                        darkMode={settings.darkMode}
                      />
                    </div>
                  )}
                </>
                );
              })()}

              {/* Kelime özeti */}
              {!examMode && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className={`text-4xl font-bold mb-1 ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>{history[0].grossWords}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Toplam Kelime</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className="text-4xl font-bold mb-1 text-green-400">{history[0].netWords}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Doğru Kelime</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className="text-4xl font-bold mb-1 text-red-400">{history[0].grossWords - history[0].netWords}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Yanlış Kelime</div>
                </div>
              </div>
              )}

              {/* Karakter özeti */}
              {!examMode && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className={`text-4xl font-bold mb-1 ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>{history[0].totalChars}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Toplam Karakter</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className="text-4xl font-bold mb-1 text-green-400">{history[0].correctChars}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Doğru Karakter</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-5 text-center`}>
                  <div className="text-4xl font-bold mb-1 text-red-400">{history[0].incorrectChars}</div>
                  <div className={`text-sm ${theme.textMuted}`}>Yanlış Karakter</div>
                </div>
              </div>
              )}

              {/* Performans */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold mb-1 ${settings.darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{history[0].wpm}</div>
                  <div className={`text-xs ${theme.textMuted}`}>WPM</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold mb-1 ${history[0].accuracy >= 95 ? 'text-green-400' : history[0].accuracy >= 80 ? 'text-amber-400' : 'text-red-400'}`}>{history[0].accuracy}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>Doğruluk</div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-xl p-4 text-center`}>
                  <div className={`text-3xl font-bold mb-1 ${settings.darkMode ? 'text-red-400' : 'text-red-600'}`}>{history[0].totalChars > 0 ? Math.round((history[0].incorrectChars / history[0].totalChars) * 1000) / 10 : 0}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>Hata Oranı</div>
                </div>
              </div>

              {tekerlemeMode && history[0] && (
                <div className={`mb-6 p-4 rounded-lg border ${settings.darkMode ? 'bg-fuchsia-500/10 border-fuchsia-500/30' : 'bg-fuchsia-50 border-fuchsia-200'}`}>
                  <div className={`font-semibold mb-2 ${theme.text}`}>🗣️ Tekerleme Sonucu — {activeTekerlemeTitle || 'Tekerleme'}</div>
                  <p className={`text-sm mb-3 ${theme.textMuted}`}>
                    Tekerlemeler ritim ve parmak hafızası için idealdir. Doğruluğu koruyarak tekrar etmek sınav hızına daha çok katkı sağlar.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className={`rounded-xl p-3 text-center ${settings.darkMode ? 'bg-slate-900/70' : 'bg-white'}`}>
                      <div className="text-xl font-bold text-fuchsia-400">{history[0].netWords}</div>
                      <div className={`text-xs ${theme.textMuted}`}>Net kelime</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${settings.darkMode ? 'bg-slate-900/70' : 'bg-white'}`}>
                      <div className="text-xl font-bold text-green-400">
                        %{history[0].totalChars > 0 ? Math.round(((history[0].totalChars - history[0].incorrectChars) / history[0].totalChars) * 1000) / 10 : 100}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>Doğruluk</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center col-span-2 md:col-span-1 ${settings.darkMode ? 'bg-slate-900/70' : 'bg-white'}`}>
                      <div className="text-xl font-bold text-amber-400">{history[0].wpm}</div>
                      <div className={`text-xs ${theme.textMuted}`}>WPM</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startGameWithTime(TEKERLEME_DURATION_SEC, undefined, false, 'tekerleme')}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/30"
                  >
                    🔄 Yeni tekerleme dene
                  </button>
                </div>
              )}

              {/* Hedef durumu */}
              <div className={`mb-6 p-4 rounded-lg ${history[0].passedBarrier ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'} border`}>
                <div className="flex items-center justify-center space-x-3">
                  {history[0].passedBarrier ? (
                    <><svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div className="text-center"><div className="text-green-400 font-bold text-lg">Tebrikler!</div><div className={settings.darkMode ? 'text-slate-300' : 'text-gray-600'}>90 kelime hedefini başarıyla aştınız!</div></div></>
                  ) : (
                    <><svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><div className="text-center"><div className="text-amber-400 font-bold text-lg">Hedef Yaklaşılıyor</div><div className={settings.darkMode ? 'text-slate-300' : 'text-gray-600'}>90 net kelime hedefi için {90 - history[0].netWords} kelime daha yazabilirsiniz.</div></div></>
                  )}
                </div>
              </div>

              {/* Detaylı istatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Kelime Analizi
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className={theme.textMuted}>Toplam Kelime:</span><span className={theme.text}>{history[0].grossWords}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Doğru Kelime:</span><span className="text-green-400">{history[0].netWords}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Yanlış Kelime:</span><span className="text-red-400">{history[0].grossWords - history[0].netWords}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Kelime Doğruluğu:</span><span className={theme.text}>{history[0].grossWords > 0 ? Math.round((history[0].netWords / history[0].grossWords) * 1000) / 10 : 0}%</span></div>
                  </div>
                </div>
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Karakter Analizi
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className={theme.textMuted}>Toplam Vuruş:</span><span className={theme.text}>{history[0].totalChars}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Doğru Karakter:</span><span className="text-green-400">{history[0].correctChars}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Yanlış Karakter:</span><span className="text-red-400">{history[0].incorrectChars}</span></div>
                    <div className="flex justify-between"><span className={theme.textMuted}>Hata Oranı:</span><span className="text-red-400">{history[0].totalChars > 0 ? Math.round((history[0].incorrectChars / history[0].totalChars) * 1000) / 10 : 0}%</span></div>
                  </div>
                </div>
              </div>
              {(Object.keys(analytics.keyStats).length > 0 || (latestResult && latestResult.keyPresses.length > 0)) && (
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className={`font-semibold flex items-center ${theme.text}`}>
                      <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                      Klavye Isı Haritası
                    </h3>
                    <button
                      type="button"
                      onClick={() => setGameState('analytics')}
                      className="text-xs px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-semibold hover:bg-amber-500/30"
                    >
                      Detaylı panel →
                    </button>
                  </div>
                  <p className={`text-xs mb-3 ${theme.textMuted}`}>
                    Koyu tuşlar zayıf veya yavaş basımları gösterir. Analitik panelden harf seçerek özel drill başlatabilirsin.
                  </p>
                  <KeyboardHeatmap
                    layout={keyboardLayout}
                    keyStats={analytics.keyStats}
                    darkMode={settings.darkMode}
                    mode="weakness"
                    showModeHint
                  />
                </div>
              )}

              {gameState === 'finished' && resultSuggestions.length > 0 && (
                <ResultSuggestions
                  suggestions={resultSuggestions}
                  darkMode={settings.darkMode}
                  themeText={theme.text}
                  themeMuted={theme.textMuted}
                  onTrainer={() => startTrainerSession({ durationSec: 60, difficulty: 'medium', focus: 'weak' })}
                  onAnalytics={() => setGameState('analytics')}
                />
              )}
              {/* Ritim Grafiği */}
              {rhythmData.length > 2 && (
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Yazım Ritmi
                  </h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rhythmData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="second" stroke={settings.darkMode ? '#9ca3af' : '#6b7280'} fontSize={11} label={{ value: 'saniye', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                        <YAxis stroke={settings.darkMode ? '#9ca3af' : '#6b7280'} fontSize={11} label={{ value: 'kelime', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: settings.darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: settings.darkMode ? '#e2e8f0' : '#1f2937' }} labelStyle={{ color: settings.darkMode ? '#e2e8f0' : '#1f2937' }} />
                        <Line type="monotone" dataKey="wordsAtThatPoint" stroke="#a855f7" strokeWidth={2} dot={{ r: 2 }} name="Kelime" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`mt-2 text-xs ${theme.textMuted}`}>
                    {(() => {
                      if (rhythmData.length < 4) return 'Daha fazla veri gerekli.';
                      const mid = Math.floor(rhythmData.length / 2);
                      const firstHalfRate = rhythmData[mid].wordsAtThatPoint / (rhythmData[mid].second || 1);
                      const secondHalfRate = (rhythmData[rhythmData.length - 1].wordsAtThatPoint - rhythmData[mid].wordsAtThatPoint) / ((rhythmData[rhythmData.length - 1].second - rhythmData[mid].second) || 1);
                      if (secondHalfRate > firstHalfRate * 1.1) return '📈 Hızlanıyorsun! İkinci yarıda daha iyi tempo yakaladın.';
                      if (secondHalfRate < firstHalfRate * 0.9) return '📉 İkinci yarıda yavaşladın. Ritmi korumaya odaklan.';
                      return '✅ Harika! Tutarlı bir ritim yakaladın.';
                    })()}
                  </div>
                </div>
              )}

              {/* Dilim Analizi — 3'erli periyotlar */}
              {rhythmData.length > 3 && initialTimeRef.current >= 180 && (() => {
                const totalSec = initialTimeRef.current;
                const sliceCount = Math.min(Math.ceil(totalSec / 180), 5);
                const sliceSec = totalSec / sliceCount;
                const slices = Array.from({ length: sliceCount }, (_, i) => {
                  const from = Math.round(i * sliceSec);
                  const to = Math.round((i + 1) * sliceSec);
                  const points = rhythmData.filter(r => r.second >= from && r.second < to);
                  const words = points.length;
                  const chars = points.reduce((s, p) => s + (p.chars || 0), 0);
                  const correct = points.filter(p => p.correct).length;
                  return { from, to, words, chars, correct };
                });
                return (
                  <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                    <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                      <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Periyot Analizi
                    </h3>
                    <div className={`grid gap-2 ${sliceCount === 1 ? 'grid-cols-1' : sliceCount === 2 ? 'grid-cols-2' : sliceCount === 3 ? 'grid-cols-3' : sliceCount === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                      {slices.map((s, i) => (
                        <div key={i} className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 text-center`}>
                          <div className={`text-xs font-semibold mb-2 ${theme.textMuted}`}>{Math.floor(s.from / 60)}:{String(s.from % 60).padStart(2, '0')} — {Math.floor(s.to / 60)}:{String(s.to % 60).padStart(2, '0')}</div>
                          <div className="text-xl font-bold text-amber-400">{s.words}</div>
                          <div className={`text-xs ${theme.textMuted}`}>kelime</div>
                          <div className="text-lg font-bold text-blue-400 mt-1">{s.chars}</div>
                          <div className={`text-xs ${theme.textMuted}`}>karakter</div>
                          <div className={`text-xs mt-1 font-semibold ${s.correct === s.words && s.words > 0 ? 'text-green-400' : 'text-amber-400'}`}>{s.words > 0 ? Math.round((s.correct / s.words) * 100) : 0}% doğru</div>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-2 text-xs ${theme.textMuted}`}>
                      {slices.length >= 2 && slices[slices.length - 1].words > slices[0].words ? '📈 Zamanla hızlanıyorsun!' : slices.length >= 2 && slices[slices.length - 1].words < slices[0].words ? '📉 Son periyotlarda yavaşladın.' : '✅ Dengeli bir tempo tutturdun.'}
                    </div>

                    {/* 3dk ortalaması */}
                    {sliceCount > 1 && (() => {
                      const avgWords = Math.round(slices.reduce((s, sl) => s + sl.words, 0) / sliceCount);
                      const avgChars = Math.round(slices.reduce((s, sl) => s + sl.chars, 0) / sliceCount);
                      const totalCorrect = slices.reduce((s, sl) => s + sl.correct, 0);
                      const totalW = slices.reduce((s, sl) => s + sl.words, 0);
                      const avgAcc = totalW > 0 ? Math.round((totalCorrect / totalW) * 100) : 0;
                      const bestSlice = slices.reduce((best, sl) => sl.words > best.words ? sl : best, slices[0]);
                      const bestIdx = slices.indexOf(bestSlice);
                      return (
                        <div className={`mt-3 p-3 rounded-lg ${settings.darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border`}>
                          <div className={`text-xs font-semibold mb-2 ${theme.text}`}>📊 3 Dakikalık Ortalama Performans</div>
                          <div className="grid grid-cols-4 gap-3 text-center">
                            <div>
                              <div className="text-lg font-bold text-amber-400">{avgWords}</div>
                              <div className={`text-xs ${theme.textMuted}`}>ort. kelime</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-blue-400">{avgChars}</div>
                              <div className={`text-xs ${theme.textMuted}`}>ort. karakter</div>
                            </div>
                            <div>
                              <div className={`text-lg font-bold ${avgAcc >= 90 ? 'text-green-400' : 'text-amber-400'}`}>{avgAcc}%</div>
                              <div className={`text-xs ${theme.textMuted}`}>ort. doğruluk</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-400">{bestSlice.words}</div>
                              <div className={`text-xs ${theme.textMuted}`}>en iyi ({bestIdx + 1}. dilim)</div>
                            </div>
                          </div>
                          <div className={`text-xs mt-2 ${theme.textMuted}`}>
                            {avgWords >= 90 ? '🏆 3dk ortalamanız sınav barajını geçiyor!' : avgWords >= 60 ? '📈 İyi gidiyorsun! 90 kelime hedefine yaklaşıyorsun.' : '💪 Pratik yaptıkça ortalamanız yükselecek.'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {latestResult && latestResult.errorWords.length > 0 && (
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Kronik Hata Raporu
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {latestResult.errorWords.map((error, index) => (
                      <div key={index} className={`${settings.darkMode ? 'bg-red-500/20' : 'bg-red-100'} border border-red-500/30 rounded px-3 py-2 text-center`}>
                        <div className={`text-sm font-semibold ${settings.darkMode ? 'text-red-400' : 'text-red-600'}`}>{error.word}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{error.count} kez</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestResult && (
                <div className="mb-8 rounded-lg border border-dashed border-amber-400 p-4">
                  <button
                    onClick={() => setCoachText(formatCoachText(coachReport))}
                    className="w-full px-4 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition"
                  >
                    Bu sınavdaki sonucu Yapay Katip Zeka Koçu ile analiz et
                  </button>
                </div>
              )}

              {coachText && (
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 2.686-6 6a6 6 0 0012 0c0-3.314-2.686-6-6-6z M12 4v4m0 8v4m8-8h-4m-8 0H4" /></svg>
                    Yapay Katip Zeka Koçu Sonuç Analizi
                  </h3>
                  <div className={`whitespace-pre-wrap text-sm ${settings.darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                    {coachText}
                  </div>
                </div>
              )}

              {latestResult?.wordErrorDetails && latestResult.wordErrorDetails.length > 0 && (
                <div className={`${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'} rounded-lg p-4 mb-8`}>
                  <h3 className={`font-semibold mb-3 flex items-center ${theme.text}`}>
                    <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Detaylı Kelime Hata Analizi
                  </h3>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {latestResult.wordErrorDetails.map((item, index) => (
                      <div key={index} className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg p-3 border ${settings.darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className={`text-xs ${theme.textMuted}`}>Doğrusu</div>
                            <div className="text-green-400 font-semibold wrap-break-word">{item.expected}</div>
                          </div>
                          <div>
                            <div className={`text-xs ${theme.textMuted}`}>Senin yazdığın</div>
                            <div className="text-red-400 font-semibold wrap-break-word">{item.typed}</div>
                          </div>
                          <div>
                            <div className={`text-xs ${theme.textMuted}`}>Hata tipi</div>
                            <div className={theme.text}>{item.errorType}</div>
                          </div>
                          <div>
                            <div className={`text-xs ${theme.textMuted}`}>Karakter hatası</div>
                            <div className="text-amber-400 font-bold">{item.charErrors}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* XP Kazanım */}
              <div className={`mb-6 p-4 rounded-xl ${settings.darkMode ? 'bg-linear-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/20' : 'bg-linear-to-r from-amber-50 to-yellow-50 border-amber-200'} border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">⭐</div>
                    <div>
                      <div className={`font-bold ${theme.text}`}>Seviye {Math.floor((profile.xp || 0) / 200) + 1}</div>
                      <div className={`text-xs ${theme.textMuted}`}>{(profile.xp || 0) % 200} / 200 XP</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">+{(() => { let xp = (history[0]?.netWords || 0) * 2 + Math.floor((history[0]?.correctChars || 0) / 10); if ((history[0]?.accuracy || 0) >= 95) xp += 30; if ((history[0]?.accuracy || 0) >= 100) xp += 50; if ((history[0]?.netWords || 0) >= 90) xp += 100; return xp; })()} XP</div>
                    <div className={`text-xs ${theme.textMuted}`}>Bu testten</div>
                  </div>
                </div>
                <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2 mt-3 overflow-hidden`}>
                  <div className="h-full bg-linear-to-r from-amber-400 to-yellow-500 transition-all" style={{ width: `${((profile.xp || 0) % 200) / 200 * 100}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => startGameWithTime(180, undefined, false)} className="px-8 py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105">🔄 Yeni Sınav</button>
                <button onClick={() => setShowShareModal(true)} className="px-8 py-3 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all">📱 Paylaş</button>
                <button onClick={generatePdfReport} className="px-8 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-lg transition-all">📄 PDF Raporu</button>
                <button onClick={() => setGameState('roadmap')} className="px-8 py-3 bg-linear-to-r from-indigo-500 to-sky-600 hover:from-indigo-600 hover:to-sky-700 text-white font-bold rounded-xl shadow-lg transition-all">🗺️ Yol Haritası</button>
                <button onClick={() => { setExamMode(false); setGameState('menu'); }} className={`px-8 py-3 font-semibold rounded-xl transition-colors ${settings.darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>🏠 Ana Menü</button>
              </div>
            </div>
          </div>
        )}

        {gameState === 'analytics' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <AnalyticsPanel
              analytics={analytics}
              keyboardLayout={keyboardLayout}
              darkMode={settings.darkMode}
              theme={theme}
              onStartTrainer={startTrainerSession}
            />
            <button
              type="button"
              onClick={() => setGameState('menu')}
              className={`w-full py-3 rounded-xl font-semibold ${settings.darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
            >
              ← Ana Menü
            </button>
          </div>
        )}

        {gameState === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Profil Hero */}
            <div className={`rounded-2xl overflow-hidden ${theme.border} border`}>
              <div className={`h-24 ${settings.darkMode ? 'bg-linear-to-r from-amber-900/40 via-purple-900/40 to-blue-900/40' : 'bg-linear-to-r from-amber-100 via-purple-100 to-blue-100'}`} />
              <div className={`${theme.cardBg} px-6 pb-6`}>
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-10">
                  {/* Avatar Seçici */}
                  <div className="relative group">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${settings.darkMode ? 'bg-slate-800 ring-4 ring-slate-900' : 'bg-white ring-4 ring-gray-100'} shadow-xl`}>
                      {profile.avatar || '👤'}
                    </div>
                    <div className={`absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer`} onClick={() => {
                      const avatars = ['👤','👨','👩','👨‍💻','👩‍💻','👨‍⚖️','👩‍⚖️','👨‍🎓','👩‍🎓','🧑‍💼','👨‍💼','👩‍💼','🦸','🦹','🧙','🎯','⚡','🔥','💎','👑','🏆','⭐','🎮','🚀'];
                      const current = avatars.indexOf(profile.avatar || '👤');
                      const next = avatars[(current + 1) % avatars.length];
                      const updated = { ...profile, avatar: next };
                      setProfile(updated);
                      saveProfile(updated);
                    }}>
                      <span className="text-white text-xs font-semibold">Değiştir</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className={`text-xl font-bold ${theme.text}`}>{profile.name || (dbUserEmail ? 'Kullanıcı' : 'Misafir Kullanıcı')}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 justify-center md:justify-start">
                      <span className={`text-xs ${theme.textMuted}`}>📅 {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
                      <span className="text-xs text-amber-400 font-semibold">⭐ Lv.{Math.floor((profile.xp || 0) / 200) + 1}</span>
                      <span className="text-xs text-purple-400 font-semibold">{CAREER_STAGES[Math.min((profile.careerStage || 1) - 1, CAREER_STAGES.length - 1)].icon} {CAREER_STAGES[Math.min((profile.careerStage || 1) - 1, CAREER_STAGES.length - 1)].title}</span>
                      {dbUserEmail && <span className="text-xs text-emerald-400 font-semibold">☁️ Cloud Bağlı</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {streak > 0 && <div className="px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-bold">🔥 {streak}</div>}
                    <div className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-bold">{(profile.xp || 0)} XP</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>✏️ Kullanıcı Adı</h3>
              <p className={`text-sm mb-4 ${theme.textMuted}`}>Giriş yaptıktan sonra üst menüde ve hoş geldin mesajında bu isim görünür.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={profileNameDraft}
                  onChange={(e) => { setProfileNameDraft(e.target.value); setProfileNameSaveStatus('idle'); }}
                  placeholder="Adın / Kullanıcı adın"
                  maxLength={40}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm border outline-none focus:border-amber-500 ${settings.darkMode ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-500' : 'bg-white text-gray-900 border-gray-200 placeholder-gray-400'}`}
                />
                <button
                  type="button"
                  disabled={profileNameSaveStatus === 'saving'}
                  onClick={async () => {
                    const trimmed = profileNameDraft.trim();
                    if (!trimmed) {
                      setProfileNameSaveStatus('error');
                      return;
                    }
                    setProfileNameSaveStatus('saving');
                    const updated = { ...profile, name: trimmed };
                    setProfile(updated);
                    saveProfile(updated);
                    if (dbUserEmail) {
                      const { error } = await saveProfileToDb({ name: trimmed, avatar: updated.avatar || '👤' }).catch(() => ({ error: 'Kayıt başarısız' }));
                      if (error) {
                        setProfileNameSaveStatus('error');
                        return;
                      }
                    }
                    setProfileNameSaveStatus('saved');
                    setTimeout(() => setProfileNameSaveStatus('idle'), 2000);
                  }}
                  className="px-5 py-3 rounded-xl text-sm font-bold bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white disabled:opacity-60"
                >
                  {profileNameSaveStatus === 'saving' ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              {profileNameSaveStatus === 'saved' && <p className="text-sm text-green-400 mt-2">Kullanıcı adı kaydedildi.</p>}
              {profileNameSaveStatus === 'error' && <p className="text-sm text-red-400 mt-2">Geçerli bir kullanıcı adı gir.</p>}
            </div>

            {/* İstatistik Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { value: profile.totalTests, label: 'Test', color: settings.darkMode ? 'text-white' : 'text-gray-900' },
                { value: `${profile.totalPracticeMinutes}dk`, label: 'Pratik', color: 'text-amber-400' },
                { value: streak, label: 'Seri', color: 'text-orange-400' },
                { value: bestWordsAll, label: 'Kelime', color: 'text-green-400' },
                { value: bestCharsAll, label: 'Karakter', color: 'text-blue-400' },
                { value: bestWpmAll, label: 'WPM', color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border rounded-xl p-3 text-center`}>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className={`text-xs ${theme.textMuted}`}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme.text}`}>📊 Tuş Analitiği</h3>
                <button
                  type="button"
                  onClick={() => setGameState('analytics')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-semibold hover:bg-amber-500/30"
                >
                  Paneli Aç
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div>
                  <div className="text-xl font-bold text-orange-400">{practiceStreak.currentStreak}</div>
                  <div className={`text-xs ${theme.textMuted}`}>Seri</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-rose-400">{Object.keys(analytics.keyStats).length}</div>
                  <div className={`text-xs ${theme.textMuted}`}>İzlenen tuş</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-400">{practiceStreak.longestStreak}</div>
                  <div className={`text-xs ${theme.textMuted}`}>En uzun seri</div>
                </div>
              </div>
              {Object.keys(analytics.keyStats).length > 0 && (
                <KeyboardHeatmap layout={keyboardLayout} keyStats={analytics.keyStats} darkMode={settings.darkMode} mode="weakness" />
              )}
            </div>

            {/* Günlük Takip */}
            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>📅 Günlük Takip (Son 30 Gün)</h3>
              {profile.dailyLogs.length === 0 ? (
                <p className={theme.textMuted}>Henüz test verisi yok. Sınav çözerek günlük takibini başlat!</p>
              ) : (
                <>
                  <div className="h-48 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profile.dailyLogs.slice(-30)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={settings.darkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="date" stroke={settings.darkMode ? '#9ca3af' : '#6b7280'} fontSize={10} />
                        <YAxis stroke={settings.darkMode ? '#9ca3af' : '#6b7280'} fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: settings.darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                        <Line type="monotone" dataKey="bestWpm" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name="En İyi WPM" />
                        <Line type="monotone" dataKey="totalCorrect" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} name="Doğru Kelime" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {[...profile.dailyLogs].reverse().map((log, i) => (
                      <div key={i} className={`flex justify-between items-center py-2 text-sm ${settings.darkMode ? 'border-slate-700' : 'border-gray-200'} border-b last:border-0`}>
                        <span className={theme.textMuted}>{log.date}</span>
                        <div className="flex items-center gap-4">
                          <span className={theme.text}>{log.testsCompleted} test</span>
                          <span className="text-green-400">{log.totalCorrect} doğru</span>
                          <span className="text-amber-400">{log.bestWpm} WPM</span>
                          <span className={`${log.bestAccuracy >= 95 ? 'text-green-400' : 'text-amber-400'}`}>{log.bestAccuracy}%</span>
                          <span className={theme.textMuted}>{log.practiceMinutes} dk</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Zayıf Kelimeler */}
            {profile.weakWords.length > 0 && (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>🎯 Zayıf Kelimeler (En Çok Hata)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {profile.weakWords.slice(0, 20).map((w, i) => (
                    <div key={i} className={`${settings.darkMode ? 'bg-red-500/10' : 'bg-red-50'} border border-red-500/20 rounded-lg px-3 py-2 text-center`}>
                      <div className={`text-sm font-semibold ${settings.darkMode ? 'text-red-400' : 'text-red-600'}`}>{w.word}</div>
                      <div className={`text-xs ${theme.textMuted}`}>{w.errorCount} hata</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rozetler */}
            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>🏆 Rozetler ({badges.filter(b => b.earned).length}/{badges.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {badges.map(badge => (
                  <div key={badge.id} className={`p-3 rounded-lg text-center ${badge.earned ? (settings.darkMode ? 'bg-amber-500/20 border-amber-500' : 'bg-amber-100 border-amber-300') : (settings.darkMode ? 'bg-slate-700/50 opacity-40' : 'bg-gray-100 opacity-40')} border`}>
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className={`text-xs font-semibold ${theme.text}`}>{badge.name}</div>
                    {badge.earned && <div className="text-xs text-green-400">✓</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Veri Yönetimi */}
            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>💾 Veri Yönetimi</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => {
                  const allData = { profile, history, badges, streak, lastTestDate, settings, analytics, examProgress };
                  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `katiptest-${profile.name || 'backup'}-${new Date().toISOString().slice(0,10)}.json`;
                  a.click();
                }} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${settings.darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                  📥 Verileri İndir
                </button>
                <label className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${settings.darkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}>
                  📤 Verileri Yükle
                  <input type="file" accept=".json" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target?.result as string);
                        if (data.profile) { setProfile(data.profile); saveProfile(data.profile); }
                        if (data.history) setHistory(data.history);
                        if (data.badges) setBadges(data.badges);
                        if (data.streak) setStreak(data.streak);
                        if (data.lastTestDate) setLastTestDate(data.lastTestDate);
                        if (data.settings) setSettings(data.settings);
                        if (data.analytics) {
                          setAnalytics(data.analytics);
                          saveAnalytics(data.analytics);
                        }
                        if (data.examProgress) {
                          setExamProgress(data.examProgress);
                          saveExamProgress(data.examProgress);
                        }
                        alert('Veriler başarıyla yüklendi!');
                      } catch { alert('Dosya okunamadı!'); }
                    };
                    reader.readAsText(file);
                  }} />
                </label>
                <button onClick={() => { if (confirm('Tüm veriler silinecek. Emin misiniz?')) { localStorage.clear(); window.location.reload(); } }} className="px-4 py-2 rounded-lg font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30">
                  🗑️ Sıfırla
                </button>
              </div>
            </div>

            <button onClick={() => setGameState('menu')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Menüye Dön</button>
          </div>
        )}

        {gameState === 'exam_countdown' && dedicatedExamRef.current && (
          <ExamCountdown
            value={countdownValue}
            examTitle={dedicatedExamRef.current.exam.title}
            onComplete={() => {}}
          />
        )}

        {gameState === 'modes_hub' && (
          <div className="py-4">
            <ModesHub
              theme={theme}
              darkMode={settings.darkMode}
              completedExams={examProgressSummary.completed}
              totalExams={examProgressSummary.total}
              onPractice={() => setGameState('menu')}
              onTrainer={() => setGameState('analytics')}
              onExam={() => setGameState('exam_catalog')}
            />
            <button
              type="button"
              onClick={() => setGameState('menu')}
              className={`mt-6 w-full max-w-2xl mx-auto block py-3 rounded-xl font-semibold ${settings.darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}
            >
              ← Ana Menü
            </button>
          </div>
        )}

        {gameState === 'exam_catalog' && (
          <ExamCatalog
            exams={examTexts}
            progress={examProgress}
            theme={theme}
            darkMode={settings.darkMode}
            onBack={() => setGameState('menu')}
            onStart={launchDedicatedExam}
          />
        )}

        {gameState === 'exam_finished' && examLastResult && (
          <ExamResultScreen
            result={examLastResult}
            suggestions={examSuggestions}
            theme={theme}
            darkMode={settings.darkMode}
            onRetry={() => {
              const exam = examTexts.find((e) => e.id === examLastResult.examId);
              if (exam) launchDedicatedExam(exam, 'auto', false);
            }}
            onCatalog={() => setGameState('exam_catalog')}
            onMenu={() => { exitDedicatedExamUi(); setGameState('menu'); }}
            onTrainer={() => {
              setGameState('analytics');
              startTrainerSession({ durationSec: 60, difficulty: 'medium', focus: 'weak' });
            }}
          />
        )}

        {gameState === 'exam_setup' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 max-w-lg mx-auto">
            <div className="text-center space-y-2">
              <div className="text-5xl">🎓</div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Sınav Tadında Mod</h2>
              <p className={`text-sm ${theme.textMuted}`}>Gerçek sınav koşullarını birebir simüle eder</p>
            </div>

            <div className={`w-full space-y-4 ${theme.cardBg} ${theme.border} border rounded-2xl p-6`}>
              {/* Kurallar */}
              <div className={`p-3 rounded-lg text-xs space-y-1 ${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <div className={theme.text}>📌 Süre: Kesin 180 saniye (3 dakika)</div>
                <div className={theme.text}>📌 Büyük/küçük harf duyarsız · Noktalama yok</div>
                <div className={theme.text}>📌 Baraj: Minimum 90 doğru kelime</div>
                <div className={theme.text}>📌 Anlam bütünlüğü: Hata oranı %40'ı geçemez</div>
                <div className={theme.text}>📌 Blur modu kapalı (gerçek sınav gibi)</div>
              </div>

              {/* Klavye Seçimi */}
              <div>
                <div className={`text-sm font-semibold mb-2 ${theme.text}`}>⌨️ Klavye Seçimi</div>
                <div className="grid grid-cols-2 gap-3">
                  {(['F', 'Q'] as const).map(k => (
                    <button key={k} onClick={() => setExamKeyboard(k)} className={`py-3 rounded-xl font-bold text-lg transition-all ${examKeyboard === k ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : (settings.darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}`}>
                      {k} Klavye
                    </button>
                  ))}
                </div>
              </div>

              {/* Donanım Kontrolü */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={examReady} onChange={(e) => setExamReady(e.target.checked)} className="w-5 h-5 rounded accent-emerald-500" />
                <span className={`text-sm ${theme.text}`}>Klavyemin çalışır durumda olduğunu ve boşluk tuşunun bastığını kontrol ettim</span>
              </label>

              {/* Capslock Uyarısı */}
              {capsLockOn && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold text-center">⚠️ CAPSLOCK AÇIK!</div>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button onClick={() => setGameState('menu')} className={`flex-1 py-3 rounded-xl font-semibold ${settings.darkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}>← Geri</button>
              <button disabled={!examReady} onClick={() => { setSettings(s => ({ ...s, hardMode: false, suddenDeath: false, keyboardType: examKeyboard })); setTimeout(() => startGameWithTime(180, undefined, true), 50); }} className={`flex-1 py-3 rounded-xl font-bold transition-all ${examReady ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}>
                🎓 Sınava Başla
              </button>
            </div>
          </div>
        )}

        {gameState === 'career' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="text-5xl">🏛️</div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Kariyer Modu</h2>
              <p className={`text-sm ${theme.textMuted}`}>Stajyerlikten Efsaneliğe — Tüm seviyeler Blur modunda</p>
              <p className={`text-xs ${theme.textMuted} mt-1`}>Resmi sınav: 3 dk'da 90 kelime (~450 karakter)</p>
            </div>

            <div className="space-y-3">
              {CAREER_STAGES.map((s, i) => {
                const stageIndex = (profile.careerStage || 1) - 1;
                const done = i < stageIndex;
                const active = i === stageIndex;
                const locked = i > stageIndex;
                const testsAtStage = active ? (profile.careerTestsAtStage || 0) : 0;
                const bestW = active ? (profile.careerBestWords || 0) : 0;
                const bestA = active ? (profile.careerBestAccuracy || 0) : 0;
                return (
                  <div key={s.id} className={`p-4 rounded-xl border transition-all ${done ? (settings.darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200') : active ? (settings.darkMode ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/30' : 'bg-amber-50 border-amber-200 ring-1 ring-amber-300') : (settings.darkMode ? 'bg-slate-800/30 border-slate-700/30 opacity-50' : 'bg-gray-50 border-gray-200 opacity-50')}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${locked ? 'grayscale' : ''}`}>{s.icon}</div>
                        <div>
                          <div className={`font-bold ${done ? 'text-green-400' : active ? 'text-amber-400' : theme.textMuted}`}>{s.title} {done && '✓'}</div>
                          <div className={`text-xs ${theme.textMuted}`}>{s.description}</div>
                          <div className={`text-xs mt-0.5 ${theme.textMuted}`}>
                            {s.hardMode && '🎯 Blur '}
                            {s.suddenDeath && '💀 Sudden Death '}
                            {!s.hardMode && !s.suddenDeath && '📝 Normal'}
                          </div>
                        </div>
                      </div>
                      {done && <div className="text-green-400 text-sm font-bold">✓</div>}
                      {active && (
                        <button onClick={() => { setSettings(st => ({ ...st, hardMode: s.hardMode, suddenDeath: s.suddenDeath })); setTimeout(() => startGameWithTime(180, undefined, false), 50); }} className="px-4 py-2 bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-purple-500/25 shrink-0">
                          Sınava Gir
                        </button>
                      )}
                      {locked && <div className={`text-xs ${theme.textMuted}`}>🔒</div>}
                    </div>
                    {active && (
                      <div className="space-y-2 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className={theme.textMuted}>Kelime</span><span className={`font-semibold ${bestW >= s.requiredWords ? 'text-green-400' : theme.text}`}>{bestW}/{s.requiredWords}</span></div>
                            <div className={`w-full h-1.5 rounded-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-300'} overflow-hidden`}><div className={`h-full rounded-full ${bestW >= s.requiredWords ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (bestW / s.requiredWords) * 100)}%` }} /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className={theme.textMuted}>≈ Karakter</span><span className={`font-semibold ${bestW * 5 >= s.requiredWords * 5 ? 'text-green-400' : theme.text}`}>{bestW * 5}/{s.requiredWords * 5}</span></div>
                            <div className={`w-full h-1.5 rounded-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-300'} overflow-hidden`}><div className={`h-full rounded-full ${bestW >= s.requiredWords ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (bestW / s.requiredWords) * 100)}%` }} /></div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className={theme.textMuted}>Doğruluk</span><span className={`font-semibold ${bestA >= s.requiredAccuracy ? 'text-green-400' : theme.text}`}>{bestA}%/{s.requiredAccuracy}%</span></div>
                            <div className={`w-full h-1.5 rounded-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-300'} overflow-hidden`}><div className={`h-full rounded-full ${bestA >= s.requiredAccuracy ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${s.requiredAccuracy > 0 ? Math.min(100, (bestA / s.requiredAccuracy) * 100) : 100}%` }} /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className={theme.textMuted}>Test</span><span className={`font-semibold ${testsAtStage >= s.requiredTests ? 'text-green-400' : theme.text}`}>{testsAtStage}/{s.requiredTests}</span></div>
                            <div className={`w-full h-1.5 rounded-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-300'} overflow-hidden`}><div className={`h-full rounded-full ${testsAtStage >= s.requiredTests ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(100, (testsAtStage / s.requiredTests) * 100)}%` }} /></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setGameState('menu')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Menüye Dön</button>
          </div>
        )}

        {gameState === 'leaderboard' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>🏆 Leaderboard</h2>
                <p className={`text-sm ${theme.textMuted}`}>Kullanıcıların sınav performanslarına göre sıralama ekranı</p>
              </div>
              <div className={`flex rounded-xl overflow-hidden border ${settings.darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                {([['all', 'Tüm Zamanlar'], ['daily', 'Günlük'], ['weekly', 'Haftalık'], ['monthly', 'Aylık']] as const).map(([key, label]) => (
                  <button key={key} onClick={async () => { setLeaderboardTab(key); setLeaderboardLoading(true); try { const data = await getLeaderboard(key, 50); setLeaderboardData(data); } finally { setLeaderboardLoading(false); } }} className={`px-4 py-2 text-xs font-semibold transition-colors ${leaderboardTab === key ? 'bg-amber-500 text-white' : (settings.darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-gray-600 hover:bg-gray-100')}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${theme.cardBg} ${theme.border} border rounded-2xl overflow-hidden`}>
              <div className={`grid grid-cols-[64px_1fr_100px_100px_100px_100px] gap-2 px-4 py-3 text-xs font-semibold ${settings.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'} border-b ${theme.textMuted}`}>
                <div>Sıra</div>
                <div>Kullanıcı</div>
                <div className="text-right">Kelime</div>
                <div className="text-right">Karakter</div>
                <div className="text-right">WPM</div>
                <div className="text-right">Seviye</div>
              </div>
              <div className="max-h-[65vh] overflow-y-auto">
                {leaderboardLoading ? (
                  <div className={`p-6 text-center ${theme.textMuted}`}>Yükleniyor...</div>
                ) : leaderboardData.length === 0 ? (
                  <div className={`p-8 text-center ${theme.textMuted}`}>Henüz sıralama verisi yok veya veritabanı bağlantısı kurulmadı.</div>
                ) : (
                  leaderboardData.map((row, index) => (
                    <div key={`${row.id || row.name}-${index}`} className={`grid grid-cols-[64px_1fr_100px_100px_100px_100px] gap-2 items-center px-4 py-3 border-b last:border-0 ${settings.darkMode ? 'border-slate-800 hover:bg-slate-800/40' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <div className={`font-bold ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-orange-400' : theme.text}`}>#{index + 1}</div>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-2xl">{row.avatar || '👤'}</div>
                        <div className="min-w-0">
                          <div className={`font-semibold truncate ${theme.text}`}>{row.name || 'Kullanıcı'}</div>
                          <div className={`text-xs ${theme.textMuted}`}>{row.total_tests || 0} test</div>
                        </div>
                      </div>
                      <div className="text-right font-semibold text-green-400">{row.best_words || 0}</div>
                      <div className="text-right font-semibold text-blue-400">{row.best_chars || 0}</div>
                      <div className="text-right font-semibold text-amber-400">{row.best_wpm || 0}</div>
                      <div className="text-right font-semibold text-purple-400">Lv.{Math.floor((row.xp || 0) / 200) + 1}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button onClick={() => setGameState('landing')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Sayfaya Dön</button>
          </div>
        )}

        {gameState === 'roadmap' && (() => {
          const missions = generateMissions(profile, history);
          const dailyMissions = missions.filter(m => m.category === 'daily');
          const weeklyMissions = missions.filter(m => m.category === 'weekly');
          const milestoneMissions = missions.filter(m => m.category === 'milestone');
          const totalXP = profile.xp || 0;
          const xpLevel = Math.floor(totalXP / 200) + 1;
          const xpInLevel = totalXP % 200;
          const logs = profile.dailyLogs;
          const totalTests = profile.totalTests;
          const bestWords = bestWordsAll;
          const bestChars = bestCharsAll;
          const bestWpm = bestWpmAll;
          const bestAccuracy = bestAccuracyAll;

          const avgAccuracy = history.length > 0 ? Math.round(history.reduce((s, h) => s + h.accuracy, 0) / history.length * 10) / 10 : 0;
          const last7 = logs.slice(-7);
          const last7Tests = last7.reduce((s, l) => s + l.testsCompleted, 0);
          const last7Wpm = safeMax(last7.map(l => l.bestWpm || 0));
          const weakCount = profile.weakWords.length;
          
          // Seviye belirleme
          let level = 1;
          let levelName = 'Başlangıç';
          let levelColor = 'text-slate-400';
          let levelEmoji = '🌱';
          if (bestWords >= 120) { level = 6; levelName = 'Efsane'; levelColor = 'text-purple-400'; levelEmoji = '👑'; }
          else if (bestWords >= 100) { level = 5; levelName = 'Uzman'; levelColor = 'text-amber-400'; levelEmoji = '⭐'; }
          else if (bestWords >= 80) { level = 4; levelName = 'İleri'; levelColor = 'text-blue-400'; levelEmoji = '🚀'; }
          else if (bestWords >= 60) { level = 3; levelName = 'Orta'; levelColor = 'text-green-400'; levelEmoji = '📈'; }
          else if (bestWords >= 30) { level = 2; levelName = 'Gelişen'; levelColor = 'text-cyan-400'; levelEmoji = '🌿'; }
          
          // Tavsiyeler oluştur
          const tips: { icon: string; title: string; desc: string; priority: 'high' | 'medium' | 'low' }[] = [];
          
          if (totalTests === 0) {
            tips.push({ icon: '🎯', title: 'İlk Testini Çöz', desc: 'Mevcut hızını ölçmek için hemen bir sınav başlat', priority: 'high' });
          }
          if (totalTests > 0 && totalTests < 5) {
            tips.push({ icon: '🔄', title: 'Daha Fazla Test Çöz', desc: 'En az 5 test çözerek tutarlı bir ortalama oluştur', priority: 'high' });
          }
          if (avgAccuracy < 90 && totalTests > 3) {
            tips.push({ icon: '🎯', title: 'Doğruluğa Odaklan', desc: `Ortalama doğruluğun %${avgAccuracy}. Hız yerine doğruluğa odaklan. Hedef: %95+`, priority: 'high' });
          }
          if (avgAccuracy >= 90 && bestWords < 60) {
            tips.push({ icon: '⚡', title: 'Hızını Artır', desc: 'Doğruluğun iyi! Şimdi hızlanma zamanı. Daha hızlı yazarak kelime sayını artır', priority: 'high' });
          }
          if (weakCount > 10) {
            tips.push({ icon: '💪', title: 'Zayıf Noktalarını Çalış', desc: `${weakCount} zayıf kelimen var. Zayıf Noktalar modunu kullanarak bunları azalt`, priority: 'high' });
          }
          if (last7Tests < 3 && totalTests > 5) {
            tips.push({ icon: '📅', title: 'Düzenli Pratik Yap', desc: 'Son 7 günde sadece ' + last7Tests + ' test çözmüşsün. Günde en az 1 test hedefle', priority: 'medium' });
          }
          if (streak === 0 && totalTests > 0) {
            tips.push({ icon: '🔥', title: 'Seriyi Başlat', desc: 'Günlük serin yok! Bugün bir test çözerek seriyi başlat', priority: 'medium' });
          }
          if (bestWords >= 60 && bestWords < 90) {
            tips.push({ icon: '🏆', title: '90 Kelime Hedefi Yakın', desc: `En iyisin ${bestWords} kelime. 90 hedefine ${90 - bestWords} kelime kaldı!`, priority: 'medium' });
          }
          if (bestWords >= 90) {
            tips.push({ icon: '🎉', title: '90 Hedefini Aştın!', desc: `Tebrikler! En iyi skorun ${bestWords}. Şimdi 120 kelimeyi hedefle`, priority: 'low' });
          }
          if (totalTests > 10 && bestWpm > 0) {
            tips.push({ icon: '📊', title: 'Ritim Tutarlılığı', desc: `En iyi WPM: ${bestWpm}. Farklı sürelerde pratik yaparak ritmini koru`, priority: 'low' });
          }
          if (totalTests > 20) {
            tips.push({ icon: '🎮', title: 'Farklı Modları Dene', desc: 'Zor mod, oyun modu ve sınav gürültüsü ile antrenmanını çeşitlendir', priority: 'low' });
          }
          
          tips.sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return p[a.priority] - p[b.priority]; });
          
          // Haftalık plan
          const weeklyPlan = [
            { day: 'Pazartesi', task: 'Isınma (30sn) + Sınav (3dk) x3', focus: 'Hız' },
            { day: 'Salı', task: 'Zayıf Noktalar (3dk) + Sınav (3dk) x2', focus: 'Doğruluk' },
            { day: 'Çarşamba', task: 'Kolay mod x2 + Orta mod x2', focus: 'Tekrar' },
            { day: 'Perşembe', task: 'Serbest Süre (9dk) x1 + Sınav (3dk) x2', focus: 'Dayanıklılık' },
            { day: 'Cuma', task: 'Zor mod x3 + Isınma (30sn)', focus: 'Zorluk' },
            { day: 'Cumartesi', task: 'Serbest Süre (5dk) x2 + Sınav (3dk) x2', focus: 'Karma' },
            { day: 'Pazar', task: 'Hafif pratik: Kolay mod x2', focus: 'Dinlenme' },
          ];
          const todayIndex = new Date().getDay();
          const todayPlan = weeklyPlan[todayIndex === 0 ? 6 : todayIndex - 1];
          
          return (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>🗺️ Kişisel Yol Haritası</h2>
                <p className={`text-sm ${theme.textMuted} mt-1`}>Sonuçlarına göre otomatik oluşan günlük analiz, görevler ve gelişim önerileri</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}><div className="text-2xl font-bold text-amber-400">{dailyMissions.filter(m => m.completed).length}/{dailyMissions.length}</div><div className={`text-xs ${theme.textMuted}`}>Günlük Görev</div></div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}><div className="text-2xl font-bold text-blue-400">{weeklyMissions.filter(m => m.completed).length}/{weeklyMissions.length}</div><div className={`text-xs ${theme.textMuted}`}>Haftalık Görev</div></div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}><div className="text-2xl font-bold text-purple-400">{milestoneMissions.filter(m => m.completed).length}/{milestoneMissions.length}</div><div className={`text-xs ${theme.textMuted}`}>Başarım Görevi</div></div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}><div className="text-2xl font-bold text-green-400">{profile.weakWords.length}</div><div className={`text-xs ${theme.textMuted}`}>Zayıf Kelime</div></div>
              </div>
              
              {/* Seviye Kartı */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{levelEmoji}</div>
                    <div>
                      <div className={`text-2xl font-bold ${levelColor}`}>Seviye {level}: {levelName}</div>
                      <div className={`text-sm ${theme.textMuted}`}>{profile.name || 'Adsız Kullanıcı'} • {totalTests} test tamamlandı</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${theme.text}`}>{bestWords}</div>
                    <div className={`text-xs ${theme.textMuted}`}>En İyi Kelime</div>
                  </div>
                </div>
                {/* Seviye barı */}
                <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                  <div className="h-full bg-linear-to-r from-amber-500 to-amber-600 transition-all" style={{ width: `${Math.min(100, (bestWords / 120) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={theme.textMuted}>0</span>
                  <span className={bestWords >= 30 ? 'text-cyan-400' : theme.textMuted}>30</span>
                  <span className={bestWords >= 60 ? 'text-green-400' : theme.textMuted}>60</span>
                  <span className={bestWords >= 90 ? 'text-blue-400' : theme.textMuted}>90</span>
                  <span className={bestWords >= 120 ? 'text-purple-400' : theme.textMuted}>120</span>
                </div>
              </div>

              {/* Bugünün Planı */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>📅 Bugünün Planı ({todayPlan.day})</h3>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${todayPlan.focus === 'Dinlenme' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{todayPlan.focus}</div>
                  <div className={theme.text}>{todayPlan.task}</div>
                </div>
                <div className={`mt-3 text-xs ${theme.textMuted}`}>Bugün {profile.dailyLogs.find(l => l.date === new Date().toLocaleDateString('tr-TR'))?.testsCompleted || 0} test çözdün</div>
              </div>

              {/* Anlık Durum */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}>
                  <div className="text-2xl font-bold text-green-400">{bestWords}</div>
                  <div className={`text-xs ${theme.textMuted}`}>En İyi Kelime</div>
                </div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}>
                  <div className="text-2xl font-bold text-blue-400">{bestChars}</div>
                  <div className={`text-xs ${theme.textMuted}`}>En İyi Karakter</div>
                </div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}>
                  <div className="text-2xl font-bold text-amber-400">{bestWpm}</div>
                  <div className={`text-xs ${theme.textMuted}`}>En İyi WPM</div>
                </div>
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${bestAccuracy >= 95 ? 'text-green-400' : 'text-amber-400'}`}>{bestAccuracy}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>En İyi Doğruluk</div>
                </div>
              </div>

              {/* Akıllı Tavsiyeler */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>🧠 Sana Özel Tavsiyeler</h3>
                <div className="space-y-3">
                  {tips.slice(0, 5).map((tip, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${tip.priority === 'high' ? (settings.darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200') : tip.priority === 'medium' ? (settings.darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200') : (settings.darkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200')} border`}>
                      <div className="text-2xl">{tip.icon}</div>
                      <div>
                        <div className={`font-semibold text-sm ${theme.text}`}>{tip.title}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{tip.desc}</div>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full ml-auto shrink-0 ${tip.priority === 'high' ? 'bg-red-500/20 text-red-400' : tip.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>{tip.priority === 'high' ? 'Öncelikli' : tip.priority === 'medium' ? 'Önerilen' : 'İyi'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Haftalık Plan */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>📋 Haftalık Antrenman Planı</h3>
                <div className="space-y-2">
                  {weeklyPlan.map((plan, i) => {
                    const isToday = i === (todayIndex === 0 ? 6 : todayIndex - 1);
                    return (
                      <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${isToday ? (settings.darkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200') : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-20 text-sm font-semibold ${isToday ? 'text-amber-400' : theme.textMuted}`}>{plan.day}</div>
                          <div className={`text-sm ${isToday ? theme.text : theme.textMuted}`}>{plan.task}</div>
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${plan.focus === 'Dinlenme' ? 'bg-green-500/20 text-green-400' : plan.focus === 'Hız' ? 'bg-blue-500/20 text-blue-400' : plan.focus === 'Doğruluk' ? 'bg-purple-500/20 text-purple-400' : plan.focus === 'Zorluk' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>{plan.focus}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Son 7 Gün Özet */}
              {last7.length > 0 && (
                <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                  <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>📊 Son 7 Gün Analiz</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${theme.text}`}>{last7Tests}</div>
                      <div className={`text-xs ${theme.textMuted}`}>Test Çözüldü</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">{last7Wpm}</div>
                      <div className={`text-xs ${theme.textMuted}`}>En İyi WPM</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{last7.length}</div>
                      <div className={`text-xs ${theme.textMuted}`}>Aktif Gün</div>
                    </div>
                  </div>
                  <div className={`text-sm ${theme.textMuted} p-3 rounded-lg ${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                    {last7Tests === 0 && '⚠️ Son 7 günde hiç test çözmedin. Hemen başla!'}
                    {last7Tests > 0 && last7Tests < 7 && `📌 Günde ortalama ${(last7Tests / 7).toFixed(1)} test çözüyorsun. Hedef: günde en az 1 test.`}
                    {last7Tests >= 7 && last7Tests < 21 && `✅ İyi gidiyorsun! Günde ortalama ${(last7Tests / 7).toFixed(1)} test. Düzeni koru.`}
                    {last7Tests >= 21 && `🔥 Harika performans! Günde ${(last7Tests / 7).toFixed(1)} test çözüyorsun. Ama yorulma, dinlenme de önemli!`}
                  </div>
                </div>
              )}

              {/* XP ve Seviye */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${theme.text}`}>⭐ Seviye {xpLevel}</h3>
                  <span className={`text-sm font-bold text-amber-400`}>{totalXP} XP</span>
                </div>
                <div className={`w-full ${settings.darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                  <div className="h-full bg-linear-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${(xpInLevel / 200) * 100}%` }} />
                </div>
                <div className={`text-xs mt-1 ${theme.textMuted}`}>{xpInLevel} / 200 XP → Seviye {xpLevel + 1}</div>
              </div>

              {/* Günlük Görevler */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>📋 Günlük Görevler</h3>
                <div className="space-y-3">
                  {dailyMissions.map(m => (
                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg ${m.completed ? (settings.darkMode ? 'bg-green-500/10' : 'bg-green-50') : (settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100')}`}>
                      <div className="text-2xl">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${m.completed ? 'text-green-400 line-through' : theme.text}`}>{m.title}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{m.description}</div>
                        <div className={`w-full ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded-full h-1.5 mt-1 overflow-hidden`}>
                          <div className={`h-full transition-all ${m.completed ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${(m.current / m.target) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-semibold ${m.completed ? 'text-green-400' : theme.textMuted}`}>{m.current}/{m.target}</div>
                        {m.completed && !(profile.completedMissionIds || []).includes(m.id) ? (
                          <button onClick={() => { setProfile(prev => { const u = claimMissionXP(prev, m.id, m.xp); saveProfile(u); return u; }); }} className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded mt-1">+{m.xp} XP</button>
                        ) : m.completed ? (
                          <div className="text-xs text-green-400">✓</div>
                        ) : (
                          <div className={`text-xs ${theme.textMuted}`}>+{m.xp} XP</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Haftalık Görevler */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>🗓️ Haftalık Görevler</h3>
                <div className="space-y-3">
                  {weeklyMissions.map(m => (
                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg ${m.completed ? (settings.darkMode ? 'bg-green-500/10' : 'bg-green-50') : (settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100')}`}>
                      <div className="text-2xl">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${m.completed ? 'text-green-400 line-through' : theme.text}`}>{m.title}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{m.description}</div>
                        <div className={`w-full ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded-full h-1.5 mt-1 overflow-hidden`}>
                          <div className={`h-full transition-all ${m.completed ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(m.current / m.target) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-semibold ${m.completed ? 'text-green-400' : theme.textMuted}`}>{m.current}/{m.target}</div>
                        {m.completed && !(profile.completedMissionIds || []).includes(m.id) ? (
                          <button onClick={() => { setProfile(prev => { const u = claimMissionXP(prev, m.id, m.xp); saveProfile(u); return u; }); }} className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded mt-1">+{m.xp} XP</button>
                        ) : m.completed ? (
                          <div className="text-xs text-green-400">✓</div>
                        ) : (
                          <div className={`text-xs ${theme.textMuted}`}>+{m.xp} XP</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Görevler */}
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>🏆 Başarım Görevleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {milestoneMissions.map(m => (
                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-lg ${m.completed ? (settings.darkMode ? 'bg-green-500/10' : 'bg-green-50') : (settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100')}`}>
                      <div className="text-2xl">{m.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${m.completed ? 'text-green-400' : theme.text}`}>{m.title}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{m.description}</div>
                        <div className={`w-full ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded-full h-1 mt-1 overflow-hidden`}>
                          <div className={`h-full ${m.completed ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${(m.current / m.target) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.completed && !(profile.completedMissionIds || []).includes(m.id) ? (
                          <button onClick={() => { setProfile(prev => { const u = claimMissionXP(prev, m.id, m.xp); saveProfile(u); return u; }); }} className="text-xs px-2 py-1 bg-purple-500 text-white rounded font-semibold">+{m.xp} XP</button>
                        ) : m.completed ? (
                          <div className="text-xs text-green-400 font-semibold">✓ {m.xp} XP</div>
                        ) : (
                          <div className={`text-xs ${theme.textMuted}`}>{m.current}/{m.target}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setGameState('menu')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Menüye Dön</button>
            </div>
          );
        })()}

        {gameState === 'contact' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${theme.cardBg} ${theme.border} border rounded-2xl p-6`}>
                <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>İletişim</h2>
                <p className={`text-sm ${theme.textMuted} leading-relaxed mb-6`}>KatipTest ile ilgili önerilerin, hata bildirimlerin, içerik taleplerin veya iş birliği mesajların bizim için çok değerli. Aşağıdaki formu doldur, ekibimiz sana en kısa sürede dönüş yapsın.</p>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📧</div>
                    <div>
                      <div className={`font-semibold ${theme.text}`}>E-posta</div>
                      <div className={theme.textMuted}>info@katiptest.com</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">⏱️</div>
                    <div>
                      <div className={`font-semibold ${theme.text}`}>Geri Dönüş</div>
                      <div className={theme.textMuted}>24-48 saat içinde yanıt</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">💡</div>
                    <div>
                      <div className={`font-semibold ${theme.text}`}>Bize Yazabileceklerin</div>
                      <div className={theme.textMuted}>Öneri, bug bildirimi, içerik talebi, iş birliği</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${theme.cardBg} ${theme.border} border rounded-2xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Mesaj Gönder</h3>
                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim());
                  if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
                    setContactStatus({ type: 'error', message: 'Lütfen gerekli alanları doldurun.' });
                    return;
                  }
                  if (!emailOk) {
                    setContactStatus({ type: 'error', message: 'Lütfen geçerli bir e-posta adresi girin.' });
                    return;
                  }
                  setContactStatus({ type: 'sending', message: 'Mesaj gönderiliyor...' });
                  try {
                    const result = await saveContactMessage(contactForm);
                    if (result.error) {
                      try {
                        const raw = localStorage.getItem('katiptest_contact_messages');
                        const fallback = raw ? JSON.parse(raw) : [];
                        const safeFallback = Array.isArray(fallback) ? fallback : [];
                        safeFallback.push({ ...contactForm, createdAt: new Date().toISOString() });
                        localStorage.setItem('katiptest_contact_messages', JSON.stringify(safeFallback));
                      } catch {
                        localStorage.setItem('katiptest_contact_messages', JSON.stringify([{ ...contactForm, createdAt: new Date().toISOString() }]));
                      }
                    }
                    setContactStatus({ type: 'success', message: 'Mesajın başarıyla alındı. Teşekkür ederiz!' });
                    setContactForm({ name: '', email: '', subject: '', message: '' });
                  } catch {
                    setContactStatus({ type: 'error', message: 'Mesaj gönderilemedi. Lütfen tekrar dene.' });
                  }
                }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={contactForm.name} onChange={(e) => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Ad Soyad *" className={`px-4 py-3 rounded-xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'} border outline-none focus:border-amber-500`} />
                    <input type="email" value={contactForm.email} onChange={(e) => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="E-posta *" className={`px-4 py-3 rounded-xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'} border outline-none focus:border-amber-500`} />
                  </div>
                  <input value={contactForm.subject} onChange={(e) => setContactForm(f => ({ ...f, subject: e.target.value }))} placeholder="Konu" className={`w-full px-4 py-3 rounded-xl text-sm ${settings.darkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'} border outline-none focus:border-amber-500`} />
                  <textarea value={contactForm.message} onChange={(e) => setContactForm(f => ({ ...f, message: e.target.value }))} placeholder="Mesajınız *" rows={6} className={`w-full px-4 py-3 rounded-xl text-sm resize-none ${settings.darkMode ? 'bg-slate-800 text-white placeholder-slate-500 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'} border outline-none focus:border-amber-500`} />
                  {contactStatus.type !== 'idle' && (
                    <div className={`text-sm p-3 rounded-xl ${contactStatus.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : contactStatus.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{contactStatus.message}</div>
                  )}
                  <p className={`text-xs ${theme.textMuted}`}>* DB bağlantısı yoksa mesajın yerel olarak kaydedilir ve daha sonra incelenebilir.</p>
                  <button type="submit" className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20">Mesaj Gönder</button>
                </form>
              </div>
            </div>
            <button onClick={() => setGameState('landing')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Sayfaya Dön</button>
          </div>
        )}

        {gameState === 'blog' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>📚 Blog ve Rehber Merkezi</h2>
              <p className={`text-sm ${theme.textMuted} mt-1`}>Sınav taktikleri, klavye çalışmaları, mesleki bilgiler ve güncel haberleri tek yerde topla.</p>
            </div>
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden">
              <img src="/images/blog-hero.png" alt="Blog" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent flex items-end p-6">
                <div>
                  <h2 className="text-3xl font-bold text-white">Rehber & İpuçları</h2>
                  <p className="text-slate-300 text-sm mt-1">Sınava hazırlık için bilmen gereken her şey</p>
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
              {[
                { icon: '🎯', title: 'Sınav Stratejileri', desc: '90 kelime barajı, hata oranı ve sınav taktikleri' },
                { icon: '⌨️', title: 'On Parmak Teknikleri', desc: 'Parmak yerleşimi, ritim ve hız artırma yöntemleri' },
                { icon: '🏛️', title: 'Mesleki Rehber', desc: 'Zabıt katipliği kariyeri, görevler ve atama süreci' },
              ].map((f, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border rounded-xl p-4`}>
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className={`font-semibold ${theme.text}`}>{f.title}</div>
                  <div className={`text-sm ${theme.textMuted} mt-1`}>{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Güncel Haberler */}
            <div className={`rounded-xl overflow-hidden ${theme.border} border`}>
              <div className={`px-6 py-4 ${settings.darkMode ? 'bg-linear-to-r from-blue-900/50 to-indigo-900/50' : 'bg-linear-to-r from-blue-50 to-indigo-50'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-xl">📰</div>
                  <div>
                    <h3 className={`font-semibold ${theme.text}`}>Güncel Haberler</h3>
                    <p className={`text-xs ${theme.textMuted}`}>Zabıt katipliği ve adalet bakanlığı</p>
                  </div>
                </div>
                <button onClick={() => {
                  setNewsLoading(true);
                  fetch('/api/news').then(r => r.json()).then(data => { if (data.news) setNews(data.news); }).catch(() => {}).finally(() => setNewsLoading(false));
                }} className={`p-2 rounded-lg transition-colors ${settings.darkMode ? 'bg-slate-700/50 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-gray-100 text-gray-600'}`} title="Yenile">
                  <svg className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
              <div className={`${theme.cardBg} p-4`}>
                {newsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`p-4 rounded-lg ${settings.darkMode ? 'bg-slate-700/30' : 'bg-gray-100'} animate-pulse`}>
                        <div className={`h-4 ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded w-3/4 mb-2`}></div>
                        <div className={`h-3 ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/3`}></div>
                      </div>
                    ))}
                  </div>
                ) : news.length > 0 ? (
                  <div className="space-y-2">
                    {news.map((item, i) => (
                      <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" className={`flex items-start gap-3 p-3 rounded-lg transition-all group ${settings.darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-sm font-bold ${i === 0 ? 'bg-red-500/20 text-red-400' : i < 3 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium leading-snug ${theme.text} group-hover:text-amber-500 transition-colors`}>{item.title}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs ${theme.textMuted}`}>📅 {item.date}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${settings.darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>{item.source}</span>
                          </div>
                        </div>
                        <svg className={`w-4 h-4 shrink-0 mt-1 ${theme.textMuted} group-hover:text-amber-500 transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 ${theme.textMuted}`}>
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-sm font-medium">Haberler yüklenemedi</p>
                    <p className="text-xs mt-1">Vercel'e deploy edildikten sonra haberler otomatik görünecektir</p>
                  </div>
                )}
              </div>
            </div>

            {/* Makale Listesi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: '⌨️', tag: 'Temel', tagColor: 'bg-blue-500/20 text-blue-400', title: 'Zabıt Katipliği Sınavı Nedir?', content: 'Adalet Bakanlığı tarafından düzenlenen zabıt katipliği sınavı adayların klavye hızını ve doğruluğunu ölçen bir uygulama sınavıdır. Sınavda adaylara 3 dakika süre verilir ve bu sürede mümkün olduğunca çok kelimeyi doğru yazmaları beklenir.' },
                { icon: '🎯', tag: 'Strateji', tagColor: 'bg-amber-500/20 text-amber-400', title: '90 Kelime Hedefine Nasıl Ulaşılır?', content: 'Günlük düzenli pratik yaparak hedefe ulaşabilirsiniz. Her gün en az 15-20 dakika çalışmak önemlidir. Başlangıçta hız yerine doğruluğa odaklanın. Doğruluk oranınız %95 üzerine çıktığında hızınızı artırmaya başlayın.' },
                { icon: '🖐️', tag: 'Teknik', tagColor: 'bg-purple-500/20 text-purple-400', title: 'On Parmak Yazma Tekniği', content: 'On parmak tekniğinde her parmağın sorumlu olduğu tuşlar bellidir. Sol elin serçe parmağı A tuşunda sağ elin serçe parmağı Ş tuşunda durur. F ve J tuşlarındaki kabartılar parmaklarınızın doğru konumda olduğunu kontrol etmenizi sağlar.' },
                { icon: '📊', tag: 'Strateji', tagColor: 'bg-amber-500/20 text-amber-400', title: 'Doğruluk mu Hız mı?', content: 'Sınava hazırlanırken öncelik sırası doğruluk olmalıdır. Yanlış yazılan kelimeler net sayınızdan düşer. Önce %95 üzeri doğruluk oranı yakalayın sonra hızınızı artırın. Yanlış alışkanlıkları düzeltmek çok daha zordur.' },
                { icon: '🔥', tag: 'Motivasyon', tagColor: 'bg-orange-500/20 text-orange-400', title: 'Günlük Seri Neden Önemli?', content: 'Kas hafızası düzenli tekrarla gelişir. Her gün en az bir test çözmek parmaklarınızın esnekliğini korur ve yazma hızınızın düşmesini engeller. Günlük seri tutmak motivasyonunuzu da yüksek tutar.' },
                { icon: '😰', tag: 'Psikoloji', tagColor: 'bg-red-500/20 text-red-400', title: 'Sınav Stresini Yenmek', content: 'Sınav salonunda onlarca kişi aynı anda yazacaktır. Bu gürültüye evde alışmak zordur. Sınav Salonu Gürültüsü modunu açarak gerçekçi bir ortamda pratik yapabilirsiniz. Derin nefes egzersizleri de faydalıdır.' },
                { icon: '⏱️', tag: 'Teknik', tagColor: 'bg-purple-500/20 text-purple-400', title: 'Zaman Yönetimi', content: '3 dakika kısa gibi görünse de düzenli pratikle çok verimli kullanılabilir. İlk dakikada ısınma etkisi olabilir bu normaldir. Takılıdığınız bir kelimede fazla durmayın hemen sonrakine geçin.' },
                { icon: '💪', tag: 'Antrenman', tagColor: 'bg-green-500/20 text-green-400', title: 'Zayıf Nokta Antrenmanı', content: 'Sınavda en çok hata yapılan kelimeler genellikle uzun hukuki terimlerdir. Zayıf Noktalar özelliği en çok hata yaptığınız kelimeleri tespit eder ve bunlarla özel antrenman yapmanızı sağlar.' },
                { icon: '🪑', tag: 'Sağlık', tagColor: 'bg-cyan-500/20 text-cyan-400', title: 'Doğru Oturuş Pozisyonu', content: 'Sırtınız dik olmalı dirsekleriniz 90 derece bükülmeli ve bilekleriniz masa seviyesinde kalmalıdır. Ekrana yaklaşık 50-70 cm mesafeden bakın. Ayaklarınız yere düz basmalıdır.' },
                { icon: '📈', tag: 'Takip', tagColor: 'bg-indigo-500/20 text-indigo-400', title: 'Gelişim Takibi', content: 'Profilim sayfasından günlük gelişiminizi grafik olarak takip edebilirsiniz. Verilerinizi JSON olarak indirip farklı cihazlarda kullanabilirsiniz. Düzenli ilerleme kaydetmek motivasyonu yüksek tutar.' }
              ].map((article, i) => (
                <div key={i} className={`${theme.cardBg} ${theme.border} border rounded-xl p-5 hover:shadow-lg transition-shadow group`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl mt-1">{article.icon}</div>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${article.tagColor}`}>{article.tag}</span>
                      <h3 className={`font-semibold mb-2 ${theme.text} group-hover:text-amber-500 transition-colors`}>{article.title}</h3>
                      <p className={`text-sm ${theme.textMuted} leading-relaxed`}>{article.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setGameState('menu')} className="w-full py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl">← Ana Menüye Dön</button>
          </div>
        )}
      </main>

      {showFatigueWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full text-center`}>
            <div className="text-5xl mb-4">😴</div>
            <h3 className={`text-xl font-bold mb-2 ${theme.text}`}>Mola Zamanı!</h3>
            <p className={`${theme.textMuted} mb-4`}>Son testlerde performansın düşüyor. Parmakların yorulmuş olabilir. 5 dakika ara verip tekrar denemeye ne dersin?</p>
            <button onClick={() => setShowFatigueWarning(false)} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg">Tamam dinleneyim 🍵</button>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`${settings.darkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full`}>
            <h3 className={`text-xl font-bold mb-4 ${theme.text}`}>🎯 Hedef Belirle</h3>
            <div className="space-y-4">
              <div>
                <label className={`text-sm ${theme.textMuted}`}>Hedef Net Kelime</label>
                <input type="number" value={goalInput.targetWords} onChange={(e) => setGoalInput(g => ({ ...g, targetWords: parseInt(e.target.value) || 0 }))} className={`w-full mt-1 px-4 py-2 rounded-lg ${settings.darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`} />
              </div>
              <div>
                <label className={`text-sm ${theme.textMuted}`}>Hedef Doğru Karakter</label>
                <input type="number" value={goalInput.targetChars} onChange={(e) => setGoalInput(g => ({ ...g, targetChars: parseInt(e.target.value) || 0 }))} className={`w-full mt-1 px-4 py-2 rounded-lg ${settings.darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`} />
              </div>
              <div>
                <label className={`text-sm ${theme.textMuted}`}>Kaç Haftada Ulaşmak İstiyorsun?</label>
                <input type="number" value={goalInput.weeks} onChange={(e) => setGoalInput(g => ({ ...g, weeks: parseInt(e.target.value) || 1 }))} className={`w-full mt-1 px-4 py-2 rounded-lg ${settings.darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`} />
              </div>
              <div className={`text-xs ${theme.textMuted} p-3 rounded-lg ${settings.darkMode ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <p>📝 En iyi kelime: <strong>{bestWordsAll}</strong></p>
                <p>⌨️ En iyi karakter: <strong>{bestCharsAll}</strong></p>
                <p>📈 Haftalık artış: <strong>~{goalInput.weeks > 0 ? Math.round((goalInput.targetWords - bestWordsAll) / goalInput.weeks) : 0}</strong> kelime</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => {
                const best = bestWordsAll;
                const goal = createGoal(goalInput.targetWords, goalInput.targetChars, goalInput.weeks, best);
                setProfile(prev => { const updated = { ...prev, goal }; saveProfile(updated); return updated; });
                setShowGoalModal(false);
              }} className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg">Hedefi Kaydet</button>
              <button onClick={() => setShowGoalModal(false)} className={`flex-1 px-4 py-2 rounded-lg font-semibold ${settings.darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowSettings(false)} onKeyDown={(e) => { if (e.key === 'Escape') setShowSettings(false); }} tabIndex={0}>
          <div className={`${settings.darkMode ? 'bg-slate-900' : 'bg-white'} rounded-2xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`px-6 py-4 ${settings.darkMode ? 'bg-slate-800' : 'bg-gray-50'} border-b ${settings.darkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h2 className={`text-xl font-bold ${theme.text}`}>⚙️ Ayarlar</h2>
              <button onClick={() => setShowSettings(false)} className={`p-1.5 rounded-lg ${settings.darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
                <svg className={`w-5 h-5 ${theme.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Zorluk */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>📝 Metin Zorluk Seviyesi</h3>
                <div className="grid grid-cols-4 gap-2">
                  {([['easy', '🟢', 'Kolay'], ['medium', '🟡', 'Orta'], ['hard', '🔴', 'Zor'], ['all', '⚪', 'Hepsi']] as const).map(([val, emoji, label]) => (
                    <button key={val} onClick={() => setSettings(s => ({ ...s, difficultyFilter: val }))} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${settings.difficultyFilter === val ? (val === 'easy' ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' : val === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : val === 'hard' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25') : (settings.darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}`}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yazım Ayarları */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>👁️ Yazım Ayarları</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm ${theme.text}`}>🎯 Zor Mod</div>
                      <div className={`text-xs ${theme.textMuted}`}>Ekstra XP bonusu (+50%)</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.hardMode} onChange={(e) => setSettings(s => ({ ...s, hardMode: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2"><span className={theme.textMuted}>Font Boyutu</span><span className={theme.text}>{settings.fontSize}px</span></div>
                    <div className={`relative w-full h-2 rounded-full ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}>
                      <div className="absolute h-full bg-amber-500 rounded-full" style={{ width: `${((settings.fontSize - 14) / 10) * 100}%` }} />
                      <input type="range" min="14" max="24" value={settings.fontSize} onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2"><span className={theme.textMuted}>Satır Aralığı</span><span className={theme.text}>{settings.lineHeight}</span></div>
                    <div className={`relative w-full h-2 rounded-full ${settings.darkMode ? 'bg-slate-600' : 'bg-gray-300'}`}>
                      <div className="absolute h-full bg-amber-500 rounded-full" style={{ width: `${((settings.lineHeight - 1.4) / 0.8) * 100}%` }} />
                      <input type="range" min="1.4" max="2.2" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings(s => ({ ...s, lineHeight: parseFloat(e.target.value) }))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metin Kaynağı */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>📄 Metin Kaynağı</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>🤖 AI Metin Üretici</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.aiTextMode} onChange={(e) => setSettings(s => ({ ...s, aiTextMode: e.target.checked, useCustomText: false }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>📝 Özel Metin</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.useCustomText} onChange={(e) => setSettings(s => ({ ...s, useCustomText: e.target.checked, aiTextMode: false }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  {settings.useCustomText && (
                    <textarea value={settings.customText} onChange={(e) => { setSettings(s => ({ ...s, customText: e.target.value.replace(/[.,!?;:()'"\-]/g, ' ').replace(/\s+/g, ' ').trim() })); }} className={`w-full h-24 px-3 py-2 rounded-lg text-sm ${settings.darkMode ? 'bg-slate-700 text-white placeholder-slate-500' : 'bg-gray-200 text-gray-900 placeholder-gray-400'}`} placeholder="Metninizi yapıştırın..." />
                  )}
                </div>
              </div>

              {/* Antrenman Modları */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>🎮 Antrenman Modları</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm ${theme.text}`}>🎧 Sınav Gürültüsü</div>
                      <div className={`text-xs ${theme.textMuted}`}>Gerçekçi sınav salonu sesleri</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.distractionMode} onChange={(e) => setSettings(s => ({ ...s, distractionMode: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm ${theme.text}`}>🎮 Oyun Modu</div>
                      <div className={`text-xs ${theme.textMuted}`}>Engelli koşu oyunu</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.gameMode} onChange={(e) => setSettings(s => ({ ...s, gameMode: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm ${theme.text}`}>💀 Kırmızı Çizgi</div>
                      <div className={`text-xs ${theme.textMuted}`}>Tek hata = test biter</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.suddenDeath} onChange={(e) => setSettings(s => ({ ...s, suddenDeath: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Genel */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>⚡ Genel</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>🌙 Karanlık Mod</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.darkMode} onChange={(e) => setSettings(s => ({ ...s, darkMode: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>🔊 Sesli Geri Bildirim</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => setSettings(s => ({ ...s, soundEnabled: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>🧘 Zen Modu</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.zenMode} onChange={(e) => setSettings(s => ({ ...s, zenMode: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${theme.text}`}>✨ Görsel Efektler</div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.showEffects} onChange={(e) => setSettings(s => ({ ...s, showEffects: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Klavye */}
              <div className={`p-4 rounded-xl ${settings.darkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${theme.text}`}>⌨️ Klavye Düzeni</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['F', 'Q'] as const).map(k => (
                    <button key={k} onClick={() => setSettings(s => ({ ...s, keyboardType: k }))} className={`py-3 rounded-xl font-bold text-lg transition-all ${settings.keyboardType === k ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : (settings.darkMode ? 'bg-slate-700 text-slate-400 hover:bg-slate-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}`}>
                      {k} Klavye
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!settings.zenMode && (
        <footer className={`${settings.darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-gray-200'} border-t mt-12`}>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <img src="/images/logo.png" alt="KatipTest" className="w-8 h-8 rounded-lg object-cover" />
                  <span className={`text-lg font-bold ${theme.text}`}>Katip<span className="text-amber-500">Test</span></span>
                </div>
                <p className={`text-sm ${theme.textMuted} leading-relaxed`}>Zabıt katipliği sınavına hazırlık için geliştirilmiş profesyonel klavye hız testi platformu.</p>
              </div>
              <div>
                <h4 className={`font-semibold mb-3 ${theme.text}`}>Hızlı Erişim</h4>
                <div className="space-y-2">
                  <button onClick={() => setGameState('menu')} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>⚡ Sınava Başla</button>
                  <button onClick={() => setGameState('career')} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>🏛️ Kariyer Modu</button>
                  <button onClick={async () => { setLeaderboardLoading(true); setGameState('leaderboard'); try { const data = await getLeaderboard(leaderboardTab, 50); setLeaderboardData(data); } finally { setLeaderboardLoading(false); } }} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>🏆 Leaderboard</button>
                  <button onClick={() => setGameState('blog')} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>📚 Blog</button>
                  <button onClick={() => setGameState('roadmap')} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>🗺️ Yol Haritası</button>
                  <button onClick={() => setGameState('contact')} className={`block text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>📬 Contact Us</button>
                </div>
              </div>
              <div>
                <h4 className={`font-semibold mb-3 ${theme.text}`}>İletişim</h4>
                <div className="space-y-2">
                  <a href="mailto:info@katiptest.com" className={`flex items-center gap-2 text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    info@katiptest.com
                  </a>
                  <a href="https://twitter.com/katiptest" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    @katiptest
                  </a>
                  <a href="https://instagram.com/katiptest" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm ${theme.textMuted} hover:text-amber-400 transition-colors`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zm-4 10a2 2 0 100-4 2 2 0 000 4zm4.5-6a.5.5 0 100-1 .5.5 0 000 1z" /></svg>
                    @katiptest
                  </a>
                </div>
              </div>
            </div>
            <div className={`pt-6 border-t ${settings.darkMode ? 'border-slate-800' : 'border-gray-200'} flex flex-col md:flex-row items-center justify-between gap-2`}>
              <p className={`text-xs ${theme.textMuted}`}>© 2026 KatipTest — Zabıt Katipliği Sınav Simülasyonu</p>
              <p className={`text-xs ${theme.textMuted}`}>Bu uygulama eğitim ve sınav hazırlığı amaçlıdır.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}



