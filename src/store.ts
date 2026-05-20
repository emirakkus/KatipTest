// Persistent data layer using LocalStorage as DB

export interface WeakWord {
  word: string;
  errorCount: number;
  lastSeen: number;
}

export interface DailyLog {
  date: string;
  testsCompleted: number;
  totalWords: number;
  totalCorrect: number;
  totalChars: number;
  correctChars: number;
  bestWpm: number;
  bestAccuracy: number;
  practiceMinutes: number;
}

export interface UserGoal {
  targetWords: number;
  targetChars: number;
  targetDate: string;
  createdAt: number;
  weeklyMilestones: number[];
}

export interface RhythmPoint {
  second: number;
  wordsAtThatPoint: number;
  chars?: number;
  correct?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  completed: boolean;
  completedDate?: string;
  category: 'daily' | 'weekly' | 'milestone';
  xp: number;
}

export interface CareerStage {
  id: number;
  title: string;
  icon: string;
  requiredWords: number;
  requiredAccuracy: number;
  requiredTests: number;
  hardMode: boolean;
  suddenDeath: boolean;
  description: string;
}

export const CAREER_STAGES: CareerStage[] = [
  { id: 1, title: 'Stajyer', icon: '📋', requiredWords: 15, requiredAccuracy: 0, requiredTests: 1, hardMode: true, suddenDeath: false, description: '75 karakter (15 kelime)' },
  { id: 2, title: 'Katip Adayı', icon: '✏️', requiredWords: 30, requiredAccuracy: 70, requiredTests: 3, hardMode: true, suddenDeath: false, description: '150 karakter (30 kelime) %70' },
  { id: 3, title: 'Zabıt Katibi', icon: '⚖️', requiredWords: 50, requiredAccuracy: 80, requiredTests: 5, hardMode: true, suddenDeath: false, description: '250 karakter (50 kelime) %80' },
  { id: 4, title: 'Kıdemli Katip', icon: '🏛️', requiredWords: 70, requiredAccuracy: 85, requiredTests: 10, hardMode: true, suddenDeath: false, description: '350 karakter (70 kelime) %85' },
  { id: 5, title: 'Ağır Ceza Katibi', icon: '🔨', requiredWords: 90, requiredAccuracy: 90, requiredTests: 15, hardMode: true, suddenDeath: false, description: '450 karakter (90 kelime) %90 — Resmi sınav seviyesi' },
  { id: 6, title: 'Başkatip', icon: '👨‍⚖️', requiredWords: 120, requiredAccuracy: 95, requiredTests: 25, hardMode: true, suddenDeath: false, description: '600 karakter (120 kelime) %95' },
  { id: 7, title: 'Efsane', icon: '👑', requiredWords: 150, requiredAccuracy: 98, requiredTests: 50, hardMode: true, suddenDeath: true, description: '750+ karakter — Sudden Death + %98' },
];

export interface UserProfile {
  name: string;
  avatar: string;
  createdAt: number;
  totalTests: number;
  totalPracticeMinutes: number;
  weakWords: WeakWord[];
  dailyLogs: DailyLog[];
  goal: UserGoal | null;
  lastFatigueWarning: number;
  xp: number;
  completedMissionIds: string[];
  lastDailyReset: string;
  careerStage: number;
  careerTestsAtStage: number;
  careerBestWords: number;
  careerBestAccuracy: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  avatar: '👤',
  createdAt: Date.now(),
  totalTests: 0,
  totalPracticeMinutes: 0,
  weakWords: [],
  dailyLogs: [],
  goal: null,
  lastFatigueWarning: 0,
  xp: 0,
  completedMissionIds: [],
  lastDailyReset: '',
  careerStage: 1,
  careerTestsAtStage: 0,
  careerBestWords: 0,
  careerBestAccuracy: 0
};

export function loadProfile(): UserProfile {
  try {
    const data = localStorage.getItem('katiptest_profile');
    if (data) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
    }
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem('katiptest_profile', JSON.stringify(profile));
  } catch (err) {
    console.error('saveProfile error:', err);
  }
}

export function updateWeakWords(
  profile: UserProfile,
  errorWords: { word: string; count: number }[],
  correctWords: string[] = []
): UserProfile {
  // Case-insensitive map oluştur
  const weakMap = new Map<string, WeakWord>();
  const keyMap = new Map<string, string>(); // lowercase → original key
  
  profile.weakWords.forEach(w => {
    weakMap.set(w.word, { ...w });
    keyMap.set(w.word.toLocaleLowerCase('tr-TR'), w.word);
  });
  
  // Hatalı kelimeleri ekle/artır
  errorWords.forEach(({ word, count }) => {
    const key = keyMap.get(word.toLocaleLowerCase('tr-TR')) || word;
    const existing = weakMap.get(key);
    if (existing) {
      existing.errorCount += count;
      existing.lastSeen = Date.now();
    } else {
      weakMap.set(word, { word, errorCount: count, lastSeen: Date.now() });
      keyMap.set(word.toLocaleLowerCase('tr-TR'), word);
    }
  });

  // Doğru yazılan kelimelerin hata sayısını düşür, 0 veya altına inince sil
  // Aynı kelime birden fazla kez doğru yazıldıysa her birini say
  const correctCounts = new Map<string, number>();
  correctWords.forEach(word => {
    const lowerWord = word.toLocaleLowerCase('tr-TR');
    correctCounts.set(lowerWord, (correctCounts.get(lowerWord) || 0) + 1);
  });

  correctCounts.forEach((count, lowerWord) => {
    const originalKey = keyMap.get(lowerWord);
    if (originalKey) {
      const existing = weakMap.get(originalKey);
      if (existing) {
        existing.errorCount -= count;
        if (existing.errorCount <= 0) {
          weakMap.delete(originalKey);
          keyMap.delete(lowerWord);
        }
      }
    }
  });

  const sorted = Array.from(weakMap.values())
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 100);

  return { ...profile, weakWords: sorted };
}

export function updateDailyLog(
  profile: UserProfile,
  netWords: number,
  grossWords: number,
  wpm: number,
  accuracy: number,
  durationSeconds: number,
  correctCharsCount: number = 0,
  totalCharsCount: number = 0
): UserProfile {
  const today = new Date().toLocaleDateString('tr-TR');
  const logs = [...profile.dailyLogs];
  const todayLog = logs.find(l => l.date === today);

  if (todayLog) {
    todayLog.testsCompleted++;
    todayLog.totalWords += grossWords;
    todayLog.totalCorrect += netWords;
    todayLog.totalChars = (todayLog.totalChars || 0) + totalCharsCount;
    todayLog.correctChars = (todayLog.correctChars || 0) + correctCharsCount;
    todayLog.bestWpm = Math.max(todayLog.bestWpm, wpm);
    todayLog.bestAccuracy = Math.max(todayLog.bestAccuracy, accuracy);
    todayLog.practiceMinutes += Math.max(1, Math.round(durationSeconds / 60));
  } else {
    logs.push({
      date: today,
      testsCompleted: 1,
      totalWords: grossWords,
      totalCorrect: netWords,
      totalChars: totalCharsCount,
      correctChars: correctCharsCount,
      bestWpm: wpm,
      bestAccuracy: accuracy,
      practiceMinutes: Math.max(1, Math.round(durationSeconds / 60))
    });
  }

  // Keep last 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const filtered = logs.filter(l => {
    const parts = l.date.split('.');
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return d.getTime() > cutoff;
  });

  return {
    ...profile,
    dailyLogs: filtered,
    totalTests: profile.totalTests + 1,
    totalPracticeMinutes: profile.totalPracticeMinutes + Math.max(1, Math.round(durationSeconds / 60))
  };
}

export function generateWeakWordText(weakWords: WeakWord[], count: number = 50): string {
  if (weakWords.length === 0) return '';
  const words: string[] = [];
  const top = weakWords.slice(0, 20);
  
  // Her kelimeyi en az errorCount kadar ekle — doğru yazıldığında tam silinsin
  top.forEach(w => {
    for (let i = 0; i < Math.max(1, w.errorCount); i++) {
      words.push(w.word);
    }
  });
  
  // Yeterli değilse rastgele ekle
  while (words.length < count) {
    const w = top[Math.floor(Math.random() * top.length)];
    words.push(w.word);
  }
  
  // Karıştır
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  
  return words.slice(0, count).join(' ');
}

export function checkFatigue(profile: UserProfile): boolean {
  const now = Date.now();
  // Don't warn more than once per 30 minutes
  if (now - profile.lastFatigueWarning < 30 * 60 * 1000) return false;

  const today = new Date().toLocaleDateString('tr-TR');
  const todayLog = profile.dailyLogs.find(l => l.date === today);
  if (!todayLog || todayLog.testsCompleted < 5) return false;

  // Check if last 3 results show declining performance
  try {
    const appData = localStorage.getItem('keyboardTestApp');
    if (!appData) return false;
    const { history } = JSON.parse(appData);
    if (!history || history.length < 3) return false;
    const last3 = history.slice(0, 3);
    if (last3[0]?.wpm < last3[1]?.wpm && last3[1]?.wpm < last3[2]?.wpm) {
      return true;
    }
  } catch { return false; }
  return false;
}

export function getWeeklyMilestone(goal: UserGoal, currentWeek: number): number {
  if (!goal.weeklyMilestones || currentWeek >= goal.weeklyMilestones.length) {
    return goal.targetWords;
  }
  return goal.weeklyMilestones[currentWeek];
}

export function createGoal(targetWords: number, targetChars: number, weeksToReach: number, currentBest: number): UserGoal {
  const milestones: number[] = [];
  const increment = (targetWords - currentBest) / weeksToReach;
  for (let i = 0; i < weeksToReach; i++) {
    milestones.push(Math.round(currentBest + increment * (i + 1)));
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToReach * 7);

  return {
    targetWords,
    targetChars,
    targetDate: targetDate.toLocaleDateString('tr-TR'),
    createdAt: Date.now(),
    weeklyMilestones: milestones
  };
}

export function generateMissions(profile: UserProfile, history: { netWords: number; accuracy: number; correctChars: number }[]): Mission[] {
  const today = new Date().toLocaleDateString('tr-TR');
  const todayLog = profile.dailyLogs.find(l => l.date === today);
  const todayTests = todayLog?.testsCompleted || 0;
  const todayWords = todayLog?.totalCorrect || 0;
  const todayChars = todayLog?.correctChars || 0;
  const bestWords = history.length > 0 ? Math.max(...history.map(h => h.netWords)) : 0;
  const bestAccuracy = history.length > 0 ? Math.max(...history.map(h => h.accuracy)) : 0;
  const completed = profile.completedMissionIds || [];
  const missions: Mission[] = [];

  // Günlük
  missions.push({ id: `d1_${today}`, title: 'İlk Adım', description: 'Bugün 1 test çöz', icon: '🎯', target: 1, current: Math.min(todayTests, 1), completed: todayTests >= 1, category: 'daily', xp: 10 });
  missions.push({ id: `d3_${today}`, title: 'Üçlü Seri', description: 'Bugün 3 test çöz', icon: '🔥', target: 3, current: Math.min(todayTests, 3), completed: todayTests >= 3, category: 'daily', xp: 25 });
  missions.push({ id: `d5_${today}`, title: 'Beşli Patron', description: 'Bugün 5 test çöz', icon: '⚡', target: 5, current: Math.min(todayTests, 5), completed: todayTests >= 5, category: 'daily', xp: 50 });
  missions.push({ id: `dw_${today}`, title: 'Kelime Avcısı', description: 'Bugün 50 doğru kelime yaz', icon: '📝', target: 50, current: Math.min(todayWords, 50), completed: todayWords >= 50, category: 'daily', xp: 30 });
  missions.push({ id: `dc_${today}`, title: 'Karakter Ustası', description: 'Bugün 300 doğru karakter yaz', icon: '⌨️', target: 300, current: Math.min(todayChars, 300), completed: todayChars >= 300, category: 'daily', xp: 30 });

  // Haftalık
  const last7 = profile.dailyLogs.slice(-7);
  const weekTests = last7.reduce((s, l) => s + l.testsCompleted, 0);
  missions.push({ id: 'w15', title: 'Haftalık Savaşçı', description: 'Bu hafta 15 test çöz', icon: '🗓️', target: 15, current: Math.min(weekTests, 15), completed: weekTests >= 15, category: 'weekly', xp: 100 });
  missions.push({ id: 'w5d', title: '5 Gün Aktif', description: 'Bu hafta 5 farklı gün çalış', icon: '📅', target: 5, current: Math.min(last7.length, 5), completed: last7.length >= 5, category: 'weekly', xp: 75 });

  // Milestone
  const ms: [string, string, string, string, number, number, number][] = [
    ['m1', 'İlk Test', 'İlk testini tamamla', '🌱', 1, profile.totalTests, 10],
    ['m10', '10 Test', '10 test tamamla', '📊', 10, profile.totalTests, 50],
    ['m50', '50 Test', '50 test tamamla', '🏅', 50, profile.totalTests, 150],
    ['m100', '100 Test', '100 test tamamla', '🎓', 100, profile.totalTests, 300],
    ['mw30', '30 Kelime', 'Bir testte 30+ kelime yaz', '🌿', 30, bestWords, 25],
    ['mw60', '60 Kelime', 'Bir testte 60+ kelime yaz', '📈', 60, bestWords, 75],
    ['mw90', '90 Kelime', 'Bir testte 90+ kelime yaz', '🏆', 90, bestWords, 200],
    ['mw120', '120 Kelime', 'Bir testte 120+ kelime yaz', '👑', 120, bestWords, 500],
    ['ma95', 'Keskin Nişancı', '%95+ doğruluk yakala', '🎯', 95, Math.round(bestAccuracy), 100],
    ['ma100', 'Mükemmeliyetçi', '%100 doğruluk yakala', '⭐', 100, Math.round(bestAccuracy), 250],
    ['mc', 'Temiz Sayfa', 'Tüm zayıf kelimeleri temizle', '✨', 1, (profile.weakWords.length === 0 && profile.totalTests > 0) ? 1 : 0, 200],
  ];
  ms.forEach(([id, title, desc, icon, target, current, xp]) => {
    missions.push({ id, title, description: desc, icon, target, current: Math.min(current, target), completed: current >= target || completed.includes(id), category: 'milestone', xp });
  });

  return missions;
}

export function claimMissionXP(profile: UserProfile, missionId: string, xp: number): UserProfile {
  const ids = profile.completedMissionIds || [];
  if (ids.includes(missionId)) return profile;
  // Günlük görev ID'lerini temizle (30 günden eski olanları sil)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cleanedIds = ids.filter(id => {
    const dateMatch = id.match(/_(\d+\.\d+\.\d+)$/);
    if (!dateMatch) return true; // milestone/weekly, koru
    const parts = dateMatch[1].split('.');
    const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return d.getTime() > cutoffDate.getTime();
  });
  return { ...profile, xp: (profile.xp || 0) + xp, completedMissionIds: [...cleanedIds, missionId] };
}

export function updateCareer(profile: UserProfile, netWords: number, accuracy: number): { profile: UserProfile; promoted: boolean; newStage?: CareerStage } {
  const stage = profile.careerStage || 1;
  if (stage > CAREER_STAGES.length) return { profile, promoted: false };
  
  const current = CAREER_STAGES[stage - 1];
  const newTestsAtStage = (profile.careerTestsAtStage || 0) + 1;
  const newBestWords = Math.max(profile.careerBestWords || 0, netWords);
  const newBestAccuracy = Math.max(profile.careerBestAccuracy || 0, accuracy);
  
  let updated = { ...profile, careerTestsAtStage: newTestsAtStage, careerBestWords: newBestWords, careerBestAccuracy: newBestAccuracy };
  
  // Terfi kontrolü (accuracy'yi yuvarla)
  const roundedAccuracy = Math.round(accuracy * 10) / 10;
  if (netWords >= current.requiredWords && roundedAccuracy >= current.requiredAccuracy && newTestsAtStage >= current.requiredTests) {
    if (stage < CAREER_STAGES.length) {
      const nextStage = CAREER_STAGES[stage];
      updated = { ...updated, careerStage: stage + 1, careerTestsAtStage: 0, careerBestWords: 0, careerBestAccuracy: 0 };
      return { profile: updated, promoted: true, newStage: nextStage };
    }
  }
  
  return { profile: updated, promoted: false };
}
