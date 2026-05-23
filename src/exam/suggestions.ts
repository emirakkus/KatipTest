import type { AnalyticsStore } from '../analytics/types';
import { getHandAccuracy, getWeakestKeys } from '../analytics/keyStats';
import type { ExamLiveResult } from './types';

export interface ExamSuggestion {
  id: string;
  icon: string;
  text: string;
  action?: 'trainer' | 'practice';
}

export function generateExamSuggestions(
  result: ExamLiveResult,
  analytics: AnalyticsStore
): ExamSuggestion[] {
  const tips: ExamSuggestion[] = [];

  if (result.accuracy < 90) {
    tips.push({
      id: 'slow',
      icon: '🎯',
      text: 'Doğruluk düşük. Tempoyu azaltıp kontrollü pratik modunda tekrar dene.',
      action: 'practice',
    });
  }

  const left = getHandAccuracy(analytics.keyStats, 'left');
  const right = getHandAccuracy(analytics.keyStats, 'right');
  if (left < right - 4) {
    tips.push({ id: 'left', icon: '🤚', text: 'Sol el doğruluğu zayıf. Sol el antrenör drilli önerilir.', action: 'trainer' });
  } else if (right < left - 4) {
    tips.push({ id: 'right', icon: '✋', text: 'Sağ el doğruluğu zayıf. Sağ el antrenör drilli önerilir.', action: 'trainer' });
  }

  const weak = getWeakestKeys(analytics.keyStats, 3);
  if (weak.length > 0) {
    tips.push({
      id: 'weak-key',
      icon: '⌨️',
      text: `"${weak[0].key.toUpperCase()}" tuşu zayıf. Antrenör modunda bu tuşa odaklan.`,
      action: 'trainer',
    });
  }

  const punct = weak.find((k) => /[.,!?;:'"()-]/.test(k.key));
  if (punct) {
    tips.push({ id: 'punct', icon: '📝', text: 'Noktalama hataları tekrar ediyor. Kısa noktalama alıştırması yap.', action: 'trainer' });
  }

  if (result.wpm >= 50 && result.accuracy < 92) {
    tips.push({ id: 'speed-acc', icon: '⚖️', text: 'Hız iyi ama tutarlılık zayıf. Hızı koruyarak doğruluğu artır.', action: 'practice' });
  }

  if (result.completion < 70) {
    tips.push({ id: 'complete', icon: '⏱️', text: 'Metni tamamlayamadın. Süreyi artır veya daha kısa metinle başla.', action: 'practice' });
  }

  if (result.badge === 'excellent') {
    tips.push({ id: 'great', icon: '🏆', text: 'Harika performans! Bir üst zorluk seviyesini dene.', action: 'practice' });
  }

  return tips.slice(0, 5);
}
