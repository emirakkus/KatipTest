import { memo, useMemo } from 'react';
import type { KeyStat } from '../../analytics/types';
import { normalizeKey } from '../../analytics/keyStats';
import { HEATMAP_MODE_INFO } from '../../analytics/heatmap';

interface KeyboardHeatmapProps {
  layout: string[][];
  keyStats: Record<string, KeyStat>;
  darkMode: boolean;
  mode?: 'weakness' | 'errors' | 'speed';
  selectedKey?: string | null;
  onKeySelect?: (key: string | null) => void;
  showLegend?: boolean;
  showModeHint?: boolean;
}

function heatIntensity(stat: KeyStat | undefined, mode: KeyboardHeatmapProps['mode']): number {
  if (!stat || stat.totalPresses === 0) return 0;
  if (mode === 'speed') {
    return Math.min(1, stat.avgReactionMs / 500);
  }
  if (mode === 'errors') {
    return stat.wrongPresses / Math.max(1, stat.totalPresses);
  }
  return Math.min(1, stat.weakKeyScore / 80);
}

function heatBg(intensity: number, darkMode: boolean): string {
  if (intensity <= 0) return darkMode ? 'bg-slate-700/80' : 'bg-gray-200';
  const t = 1 - intensity;
  if (t > 0.75) return darkMode ? 'bg-emerald-600/90' : 'bg-emerald-400';
  if (t > 0.5) return darkMode ? 'bg-lime-600/80' : 'bg-lime-400';
  if (t > 0.25) return darkMode ? 'bg-amber-600/80' : 'bg-amber-400';
  return darkMode ? 'bg-red-600/90' : 'bg-red-500';
}

export const KeyboardHeatmap = memo(function KeyboardHeatmap({
  layout,
  keyStats,
  darkMode,
  mode = 'weakness',
  selectedKey = null,
  onKeySelect,
  showLegend = true,
  showModeHint = false,
}: KeyboardHeatmapProps) {
  const lookup = useMemo(() => {
    const map = new Map<string, KeyStat>();
    Object.values(keyStats).forEach((s) => map.set(normalizeKey(s.key), s));
    return map;
  }, [keyStats]);

  const modeInfo = HEATMAP_MODE_INFO[mode];

  return (
    <div className="space-y-3">
      {showModeHint && (
        <div className={`rounded-lg p-3 text-xs ${darkMode ? 'bg-slate-800/60 text-slate-300' : 'bg-gray-50 text-gray-600'}`}>
          <span className="font-semibold text-amber-400">{modeInfo.title}:</span> {modeInfo.desc}
        </div>
      )}

      <div className="flex justify-center overflow-x-auto">
        <div className="space-y-1 min-w-fit">
          {layout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1">
              {row.map((key) => {
                const norm = key === 'Space' ? 'space' : normalizeKey(key);
                const stat = lookup.get(norm);
                const intensity = heatIntensity(stat, mode);
                const label = key === 'Space' ? '␣' : key.length > 3 ? key.slice(0, 2) : key;
                const isSelected = selectedKey === norm;
                const hasData = stat && stat.totalPresses > 0;
                const tooltip = stat
                  ? `${key.toUpperCase()} · Doğruluk %${stat.accuracy} · Hata ${stat.wrongPresses}/${stat.totalPresses} · Ort. ${stat.avgReactionMs}ms · Zayıflık ${stat.weakKeyScore} · ${stat.trend === 'improving' ? '↑' : stat.trend === 'declining' ? '↓' : '→'}`
                  : `${key} · henüz veri yok — tıkla ve antrenman planla`;

                return (
                  <button
                    key={key}
                    type="button"
                    title={tooltip}
                    onClick={() => onKeySelect?.(isSelected ? null : norm)}
                    disabled={!onKeySelect}
                    className={`w-9 h-8 sm:w-10 sm:h-9 rounded flex items-center justify-center text-[10px] sm:text-xs font-mono transition-all ${heatBg(intensity, darkMode)} ${darkMode ? 'text-white' : 'text-gray-900'} ${
                      onKeySelect ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400/60' : ''
                    } ${isSelected ? 'ring-2 ring-amber-400 scale-105 z-10' : ''} ${!hasData && onKeySelect ? 'opacity-70' : ''} disabled:cursor-default`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
          {showLegend && (
            <div className={`flex flex-col gap-1 mt-2 px-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              <div className="flex justify-between text-[10px]">
                <span>{modeInfo.legend.split('→')[0]?.trim()}</span>
                <span>{modeInfo.legend.split('→')[1]?.trim() || 'Zayıf (koyu)'}</span>
              </div>
              {onKeySelect && (
                <p className="text-[10px] text-center text-amber-400/90">Tuşa tıklayarak detay ve harf antrenmanı</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
