import type { KeyStat } from './types';
import { getHandAccuracy, getWeakestKeys } from './keyStats';

export interface HeatmapSummary {
  trackedKeys: number;
  totalPresses: number;
  totalErrors: number;
  avgAccuracy: number;
  avgReactionMs: number;
  weakestKey: KeyStat | null;
  improvingCount: number;
  decliningCount: number;
}

export function getHeatmapSummary(stats: Record<string, KeyStat>): HeatmapSummary {
  const active = Object.values(stats).filter((s) => s.totalPresses > 0);
  const totalPresses = active.reduce((s, k) => s + k.totalPresses, 0);
  const totalErrors = active.reduce((s, k) => s + k.wrongPresses, 0);
  const avgAccuracy =
    active.length > 0
      ? Math.round((active.reduce((s, k) => s + k.accuracy, 0) / active.length) * 10) / 10
      : 100;
  const withReaction = active.filter((k) => k.avgReactionMs > 0);
  const avgReactionMs =
    withReaction.length > 0
      ? Math.round(withReaction.reduce((s, k) => s + k.avgReactionMs, 0) / withReaction.length)
      : 0;

  return {
    trackedKeys: active.length,
    totalPresses,
    totalErrors,
    avgAccuracy,
    avgReactionMs,
    weakestKey: getWeakestKeys(stats, 1)[0] || null,
    improvingCount: active.filter((k) => k.trend === 'improving').length,
    decliningCount: active.filter((k) => k.trend === 'declining').length,
  };
}

export function getHandSummary(stats: Record<string, KeyStat>) {
  return {
    left: getHandAccuracy(stats, 'left'),
    right: getHandAccuracy(stats, 'right'),
  };
}

export function getKeyTrainingTip(stat: KeyStat): string {
  if (stat.accuracy < 85) {
    return 'Doğruluğu artırmak için yavaş ve ritmik tekrar yap; hızı sonra yükselt.';
  }
  if (stat.avgReactionMs > 380) {
    return 'Tepki süresi yüksek — bu harfi içeren kısa kelime drillleri ile kas hafızası oluştur.';
  }
  if (stat.consistency > 80) {
    return 'Tutarsız basım var — aynı harfi art arda 10 kez doğru yazmayı dene.';
  }
  if (stat.trend === 'declining') {
    return 'Son oturumlarda kötüleşme var — bugün bu harfe 2 dakika odaklan.';
  }
  return 'Genel performans iyi; zor metinlerde bu harfi içeren kelimelerle pekiştir.';
}

export const HEATMAP_MODE_INFO: Record<
  'weakness' | 'errors' | 'speed',
  { title: string; desc: string; legend: string }
> = {
  weakness: {
    title: 'Zayıflık skoru',
    desc: 'Doğruluk, hata sıklığı, tepki süresi ve tutarlılık birleşerek hesaplanır. Koyu kırmızı = en zayıf tuş.',
    legend: 'Yeşil (güçlü) → Kırmızı (zayıf)',
  },
  errors: {
    title: 'Hata yoğunluğu',
    desc: 'Tuş başına yanlış basım oranı. Sık hata yaptığın harfler daha koyu görünür.',
    legend: 'Açık (az hata) → Koyu (çok hata)',
  },
  speed: {
    title: 'Tepki süresi',
    desc: 'Ortalama ms gecikmesi. Yavaş tepki verdiğin tuşlar daha koyu renklendirilir.',
    legend: 'Hızlı (açık) → Yavaş (koyu)',
  },
};
