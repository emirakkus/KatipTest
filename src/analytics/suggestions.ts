import type { AnalyticsStore, ResultSuggestion } from './types';
import { getHandAccuracy, getWeakestKeys } from './keyStats';
import { getNextMilestone } from './streak';

export interface SuggestionInput {
  accuracy: number;
  wpm: number;
  mistakes: number;
  incorrectChars: number;
  analytics: AnalyticsStore;
  trainerSession?: boolean;
}

export function generateResultSuggestions(input: SuggestionInput): ResultSuggestion[] {
  const { accuracy, wpm, mistakes, incorrectChars, analytics, trainerSession } = input;
  const suggestions: ResultSuggestion[] = [];
  const weakest = getWeakestKeys(analytics.keyStats, 5);
  const sessions = analytics.sessionSnapshots.filter((s) => !s.trainerSession);
  const last3 = sessions.slice(0, 3);
  const prev3 = sessions.slice(3, 6);

  if (weakest.length > 0) {
    const top = weakest[0];
  suggestions.push({
      id: 'weak-key',
      priority: 'high',
      icon: '🎯',
      text: `"${top.key.toUpperCase()}" tuşu zayıf (skor ${top.weakKeyScore}). Antrenör modunu dene.`,
      action: 'trainer',
    });
  }

  const leftAcc = getHandAccuracy(analytics.keyStats, 'left');
  const rightAcc = getHandAccuracy(analytics.keyStats, 'right');
  if (leftAcc < rightAcc - 5 && leftAcc < 92) {
    suggestions.push({
      id: 'left-hand',
      priority: 'high',
      icon: '🤚',
      text: `Sol el doğruluğu düştü (%${leftAcc}). Sol el antrenmanı önerilir.`,
      action: 'trainer',
    });
  } else if (rightAcc < leftAcc - 5 && rightAcc < 92) {
    suggestions.push({
      id: 'right-hand',
      priority: 'high',
      icon: '✋',
      text: `Sağ el doğruluğu düştü (%${rightAcc}). Sağ el antrenmanı önerilir.`,
      action: 'trainer',
    });
  }

  if (last3.length >= 2 && prev3.length >= 2) {
    const recentWpm = last3.reduce((s, x) => s + x.wpm, 0) / last3.length;
    const prevWpm = prev3.reduce((s, x) => s + x.wpm, 0) / prev3.length;
    const recentAcc = last3.reduce((s, x) => s + x.accuracy, 0) / last3.length;
    const prevAcc = prev3.reduce((s, x) => s + x.accuracy, 0) / prev3.length;
    if (recentWpm > prevWpm + 3 && recentAcc < prevAcc - 2) {
      suggestions.push({
        id: 'speed-accuracy',
        priority: 'medium',
        icon: '⚖️',
        text: 'Hız arttı ama doğruluk düştü. Tempoyu biraz düşürüp kontrollü yaz.',
      });
    }
    if (recentAcc > prevAcc + 2) {
      suggestions.push({
        id: 'accuracy-up',
        priority: 'low',
        icon: '📈',
        text: 'Doğruluk trendin yükseliyor. Bu tempoyu koru.',
      });
    }
  }

  const improving = weakest.filter((k) => k.trend === 'improving').slice(0, 2);
  improving.forEach((k) => {
    suggestions.push({
      id: `improve-${k.key}`,
      priority: 'low',
      icon: '✨',
      text: `"${k.key.toUpperCase()}" tuşunda tepki süresi ve doğruluk iyileşiyor.`,
    });
  });

  const punct = weakest.find((k) => /[.,!?;:'"()-]/.test(k.key));
  if (punct) {
    suggestions.push({
      id: 'punctuation',
      priority: 'medium',
      icon: '⌨️',
      text: 'Noktalama işaretlerinde tekrarlayan hatalar var. Kısa noktalama drilli yap.',
      action: 'trainer',
    });
  }

  const streak = analytics.practiceStreak;
  const nextMs = getNextMilestone(streak.currentStreak);
  if (!trainerSession && nextMs) {
    suggestions.push({
      id: 'streak',
      priority: 'medium',
      icon: '🔥',
      text: `Serin ${streak.currentStreak} gün. ${nextMs} günlük kilometreye ${nextMs - streak.currentStreak} gün kaldı.`,
    });
  }

  if (accuracy < 90 && incorrectChars > 5) {
    suggestions.push({
      id: 'accuracy-focus',
      priority: 'high',
      icon: '🎯',
      text: 'Doğruluğa odaklan: kelimeyi bitirmeden önce kısa kontrol yap.',
    });
  }

  if (wpm < 40 && accuracy >= 90) {
    suggestions.push({
      id: 'speed-up',
      priority: 'medium',
      icon: '⚡',
      text: 'Doğruluğun iyi; ritim çalışmasıyla WPM artırabilirsin.',
    });
  }

  if (mistakes === 0 && accuracy >= 98) {
    suggestions.push({
      id: 'great',
      priority: 'low',
      icon: '🏆',
      text: 'Mükemmel oturum! Zor metin veya daha uzun süre ile kendini zorla.',
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 6);
}
