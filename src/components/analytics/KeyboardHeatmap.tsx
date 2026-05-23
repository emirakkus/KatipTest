import { memo, useMemo } from 'react';
import type { KeyStat } from '../../analytics/types';
import { normalizeKey } from '../../analytics/keyStats';

interface KeyboardHeatmapProps {
  layout: string[][];
  keyStats: Record<string, KeyStat>;
  darkMode: boolean;
  mode?: 'weakness' | 'errors' | 'speed';
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
}: KeyboardHeatmapProps) {
  const lookup = useMemo(() => {
    const map = new Map<string, KeyStat>();
    Object.values(keyStats).forEach((s) => map.set(normalizeKey(s.key), s));
    return map;
  }, [keyStats]);

  return (
    <div className="flex justify-center overflow-x-auto">
      <div className="space-y-1 min-w-fit">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {row.map((key) => {
              const norm = key === 'Space' ? 'space' : normalizeKey(key);
              const stat = lookup.get(norm);
              const intensity = heatIntensity(stat, mode);
              const label = key === 'Space' ? '␣' : key.length > 3 ? key.slice(0, 2) : key;
              const tooltip = stat
                ? `${key.toUpperCase()} · Doğruluk %${stat.accuracy} · Hata ${stat.wrongPresses} · Ort. ${stat.avgReactionMs}ms · Skor ${stat.weakKeyScore}`
                : `${key} · veri yok`;
              return (
                <div
                  key={key}
                  title={tooltip}
                  className={`w-9 h-8 sm:w-10 sm:h-8 rounded flex items-center justify-center text-[10px] sm:text-xs font-mono transition-colors ${heatBg(intensity, darkMode)} ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        ))}
        <div className={`flex justify-between text-[10px] mt-2 px-1 ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
          <span>Güçlü (açık)</span>
          <span>Zayıf (koyu)</span>
        </div>
      </div>
    </div>
  );
});
