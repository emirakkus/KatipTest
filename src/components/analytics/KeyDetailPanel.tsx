import { memo } from 'react';
import type { KeyStat } from '../../analytics/types';
import { getKeyTrainingTip } from '../../analytics/heatmap';
import { LEFT_HAND_KEYS, RIGHT_HAND_KEYS } from '../../analytics/types';

interface ThemeTokens {
  text: string;
  textMuted: string;
}

interface KeyDetailPanelProps {
  keyLabel: string;
  stat: KeyStat | null;
  darkMode: boolean;
  theme: ThemeTokens;
  onTrain?: (key: string) => void;
}

function handLabel(key: string): string {
  if (LEFT_HAND_KEYS.has(key)) return 'Sol el';
  if (RIGHT_HAND_KEYS.has(key)) return 'Sağ el';
  return 'Orta / özel';
}

function trendLabel(trend: KeyStat['trend']): { text: string; className: string } {
  if (trend === 'improving') return { text: 'İyileşiyor ↑', className: 'text-green-400 bg-green-500/15' };
  if (trend === 'declining') return { text: 'Kötüleşiyor ↓', className: 'text-red-400 bg-red-500/15' };
  return { text: 'Stabil →', className: 'text-slate-400 bg-slate-500/15' };
}

export const KeyDetailPanel = memo(function KeyDetailPanel({
  keyLabel,
  stat,
  darkMode,
  theme,
  onTrain,
}: KeyDetailPanelProps) {
  const displayKey = keyLabel === 'space' ? 'Boşluk' : keyLabel.toUpperCase();
  const norm = keyLabel === 'Space' ? 'space' : keyLabel.toLowerCase();

  if (!stat || stat.totalPresses === 0) {
    return (
      <div className={`rounded-xl p-4 border ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
        <div className={`text-sm font-semibold ${theme.text}`}>{displayKey}</div>
        <p className={`text-xs mt-2 ${theme.textMuted}`}>
          Bu tuş için henüz yeterli veri yok. Test veya antrenman yapınca istatistikler dolacak.
        </p>
        {onTrain && (
          <button
            type="button"
            onClick={() => onTrain(norm)}
            className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
          >
            🔤 Bu harfe antrenman başlat
          </button>
        )}
      </div>
    );
  }

  const trend = trendLabel(stat.trend);
  const errorRate = Math.round((stat.wrongPresses / Math.max(1, stat.totalPresses)) * 1000) / 10;

  return (
    <div className={`rounded-xl p-4 border space-y-3 ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`text-2xl font-bold font-mono ${theme.text}`}>{displayKey}</div>
          <div className={`text-xs ${theme.textMuted}`}>{handLabel(stat.key)} · {stat.totalPresses} basım</div>
        </div>
        <span className={`text-[10px] px-2 py-1 rounded font-semibold ${trend.className}`}>{trend.text}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className={`rounded-lg p-2 ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
          <div className="text-lg font-bold text-amber-400">{stat.weakKeyScore}</div>
          <div className={`text-[10px] ${theme.textMuted}`}>Zayıflık</div>
        </div>
        <div className={`rounded-lg p-2 ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
          <div className="text-lg font-bold text-green-400">%{stat.accuracy}</div>
          <div className={`text-[10px] ${theme.textMuted}`}>Doğruluk</div>
        </div>
        <div className={`rounded-lg p-2 ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
          <div className="text-lg font-bold text-blue-400">{stat.avgReactionMs}ms</div>
          <div className={`text-[10px] ${theme.textMuted}`}>Tepki</div>
        </div>
        <div className={`rounded-lg p-2 ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
          <div className="text-lg font-bold text-red-400">%{errorRate}</div>
          <div className={`text-[10px] ${theme.textMuted}`}>Hata oranı</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={theme.textMuted}>
          Yanlış basım: <span className="text-red-400 font-semibold">{stat.wrongPresses}</span> / {stat.totalPresses}
        </div>
        <div className={theme.textMuted}>
          Tutarlılık (σ): <span className={theme.text}>{stat.consistency}ms</span>
        </div>
      </div>

      <p className={`text-xs leading-relaxed ${theme.textMuted}`}>💡 {getKeyTrainingTip(stat)}</p>

      {onTrain && (
        <button
          type="button"
          onClick={() => onTrain(stat.key)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20 hover:opacity-95"
        >
          🎯 {displayKey} harfine özel antrenman
        </button>
      )}
    </div>
  );
});
