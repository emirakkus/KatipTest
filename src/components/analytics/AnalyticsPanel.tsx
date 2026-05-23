import { memo, useMemo, useState, lazy, Suspense } from 'react';
import type { AnalyticsStore, TrainerConfig, TrainerDifficulty, TrainerFocus } from '../../analytics/types';
import { STREAK_MILESTONES } from '../../analytics/types';
import { getWeakestKeys } from '../../analytics/keyStats';
import { buildProgressComparisons, chartCompareData } from '../../analytics/progressCompare';
import { refreshStreakForToday, getNextMilestone } from '../../analytics/streak';
import { describeTrainerFocus, trainerLabel } from '../../analytics/trainer';
import { KeyboardHeatmap } from './KeyboardHeatmap';

const CompareChart = lazy(() =>
  import('./CompareChart').then((m) => ({ default: m.CompareChart }))
);

interface ThemeTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
}

interface AnalyticsPanelProps {
  analytics: AnalyticsStore;
  keyboardLayout: string[][];
  darkMode: boolean;
  theme: ThemeTokens;
  onStartTrainer: (config: TrainerConfig) => void;
}

type TabId = 'weak' | 'heatmap' | 'daily' | 'streak' | 'compare' | 'trainer';

export const AnalyticsPanel = memo(function AnalyticsPanel({
  analytics,
  keyboardLayout,
  darkMode,
  theme,
  onStartTrainer,
}: AnalyticsPanelProps) {
  const [tab, setTab] = useState<TabId>('weak');
  const [heatMode, setHeatMode] = useState<'weakness' | 'errors' | 'speed'>('weakness');
  const [trainerDuration, setTrainerDuration] = useState(60);
  const [trainerDifficulty, setTrainerDifficulty] = useState<TrainerDifficulty>('medium');
  const [trainerFocus, setTrainerFocus] = useState<TrainerFocus>('weak');

  const streak = useMemo(
    () => refreshStreakForToday(analytics.practiceStreak),
    [analytics.practiceStreak]
  );
  const weakest = useMemo(() => getWeakestKeys(analytics.keyStats, 12), [analytics.keyStats]);
  const comparisons = useMemo(
    () => buildProgressComparisons(analytics.sessionSnapshots),
    [analytics.sessionSnapshots]
  );
  const chartData = useMemo(
    () => chartCompareData(analytics.sessionSnapshots),
    [analytics.sessionSnapshots]
  );
  const nextMilestone = getNextMilestone(streak.currentStreak);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'weak', label: 'Zayıf Tuşlar' },
    { id: 'heatmap', label: 'Isı Haritası' },
    { id: 'daily', label: 'Günlük' },
    { id: 'streak', label: 'Seri' },
    { id: 'compare', label: 'Karşılaştır' },
    { id: 'trainer', label: 'Antrenör' },
  ];

  const startTrainer = (focus: TrainerFocus) => {
    onStartTrainer({
      durationSec: trainerDuration,
      difficulty: trainerDifficulty,
      focus,
    });
  };

  return (
    <div className={`${theme.cardBg} ${theme.border} border rounded-2xl p-4 sm:p-6 space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className={`text-xl font-bold ${theme.text}`}>📊 Analitik Panel</h2>
          <p className={`text-xs ${theme.textMuted}`}>Tuş performansı, seri ve antrenman</p>
        </div>
        <button
          type="button"
          onClick={() => startTrainer('weak')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/20"
        >
          🎯 Antrenörü Başlat
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? 'bg-amber-500 text-white'
                : darkMode
                  ? 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'weak' && (
        <div className="space-y-3">
          {weakest.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Henüz yeterli tuş verisi yok. Birkaç test çözün.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {weakest.map((k) => (
                <div
                  key={k.key}
                  className={`rounded-lg p-3 border ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${theme.text}`}>{k.key.toUpperCase()}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        k.trend === 'improving'
                          ? 'bg-green-500/20 text-green-400'
                          : k.trend === 'declining'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {k.trend === 'improving' ? '↑' : k.trend === 'declining' ? '↓' : '→'}
                    </span>
                  </div>
                  <div className={`text-xs mt-1 ${theme.textMuted}`}>Skor {k.weakKeyScore}</div>
                  <div className="text-xs text-amber-400">%{k.accuracy} · {k.avgReactionMs}ms</div>
                  <div className="text-xs text-red-400">{k.wrongPresses}/{k.totalPresses} hata</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['weakness', 'errors', 'speed'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setHeatMode(m)}
                className={`px-3 py-1 rounded-lg text-xs ${
                  heatMode === m ? 'bg-amber-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200'
                }`}
              >
                {m === 'weakness' ? 'Zayıflık' : m === 'errors' ? 'Hata' : 'Hız'}
              </button>
            ))}
          </div>
          <KeyboardHeatmap
            layout={keyboardLayout}
            keyStats={analytics.keyStats}
            darkMode={darkMode}
            mode={heatMode}
          />
        </div>
      )}

      {tab === 'daily' && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {analytics.dailyWeakKeys.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Günlük zayıf tuş kaydı henüz yok.</p>
          ) : (
            [...analytics.dailyWeakKeys].reverse().slice(0, 14).map((day) => (
              <div
                key={day.date}
                className={`rounded-lg p-3 border ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className={theme.text}>{day.date}</span>
                  <span className={theme.textMuted}>{day.mistakes} hata</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {day.weakestKeys.map((k) => (
                    <span
                      key={k}
                      className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-mono"
                    >
                      {k}
                    </span>
                  ))}
                </div>
                <div className={`text-xs ${theme.textMuted}`}>
                  Ort. doğruluk %{day.avgAccuracy} · Ort. hız {day.avgSpeed} WPM
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'streak' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`rounded-xl p-4 text-center border ${darkMode ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-200 bg-orange-50'}`}>
              <div className="text-3xl">🔥</div>
              <div className="text-2xl font-bold text-orange-400">{streak.currentStreak}</div>
              <div className={`text-xs ${theme.textMuted}`}>Güncel seri</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${theme.border}`}>
              <div className="text-2xl font-bold text-amber-400">{streak.longestStreak}</div>
              <div className={`text-xs ${theme.textMuted}`}>En uzun</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${theme.border}`}>
              <div className={`text-lg font-bold ${streak.todayCompleted ? 'text-green-400' : theme.text}`}>
                {streak.todayCompleted ? '✓' : '—'}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Bugün tamam</div>
            </div>
            <div className={`rounded-xl p-4 text-center border ${theme.border}`}>
              <div className="text-lg font-bold text-purple-400">{nextMilestone ?? '100+'}</div>
              <div className={`text-xs ${theme.textMuted}`}>Sonraki km</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {STREAK_MILESTONES.map((m) => (
              <div
                key={m}
                className={`px-3 py-2 rounded-lg text-xs font-semibold ${
                  streak.currentStreak >= m
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : darkMode
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {m}g {streak.currentStreak >= m ? '✓' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          {comparisons.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Karşılaştırma için daha fazla oturum gerekli.</p>
          ) : (
            <div className="space-y-2">
              {comparisons.map((c) => (
                <div
                  key={c.label}
                  className={`rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}
                >
                  <div className={`col-span-2 sm:col-span-4 font-semibold ${theme.text}`}>{c.label}</div>
                  <div>
                    <span className={theme.textMuted}>Doğruluk </span>
                    <span className={c.accuracyDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {c.accuracyDelta >= 0 ? '+' : ''}
                      {c.accuracyDelta}%
                    </span>
                  </div>
                  <div>
                    <span className={theme.textMuted}>WPM </span>
                    <span className={c.wpmDelta >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {c.wpmDelta >= 0 ? '+' : ''}
                      {c.wpmDelta}
                    </span>
                  </div>
                  <div>
                    <span className={theme.textMuted}>Hata </span>
                    <span className={c.errorDelta <= 0 ? 'text-green-400' : 'text-red-400'}>
                      {c.errorDelta >= 0 ? '+' : ''}
                      {c.errorDelta}
                    </span>
                  </div>
                  <div>
                    <span className={theme.textMuted}>İyileşen tuş </span>
                    <span className="text-amber-400">+{c.weakKeyImprovement}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {chartData.length >= 2 && (
            <Suspense fallback={<div className={`h-36 ${theme.textMuted} text-sm`}>Grafik yükleniyor...</div>}>
              <CompareChart data={chartData} darkMode={darkMode} />
            </Suspense>
          )}
        </div>
      )}

      {tab === 'trainer' && (
        <div className="space-y-4">
          <p className={`text-sm ${theme.textMuted}`}>
            Ana sınav akışından bağımsız kısa antrenman. Zayıf tuşlara odaklı metin üretilir.
          </p>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setTrainerDuration(sec)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  trainerDuration === sec ? 'bg-cyan-500 text-white' : darkMode ? 'bg-slate-700' : 'bg-gray-200'
                }`}
              >
                {sec < 60 ? `${sec}sn` : `${sec / 60}dk`}
              </button>
            ))}
            <input
              type="number"
              min={15}
              max={600}
              value={trainerDuration}
              onChange={(e) => setTrainerDuration(Math.max(15, Number(e.target.value) || 60))}
              className={`w-20 px-2 py-2 rounded-lg text-sm ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'}`}
              title="Özel süre (sn)"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard'] as TrainerDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setTrainerDifficulty(d)}
                className={`px-3 py-2 rounded-lg text-sm capitalize ${
                  trainerDifficulty === d ? 'bg-amber-500 text-white' : darkMode ? 'bg-slate-700' : 'bg-gray-200'
                }`}
              >
                {d === 'easy' ? 'Kolay' : d === 'medium' ? 'Orta' : 'Zor'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setTrainerFocus('weak'); startTrainer('weak'); }}
              className="py-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-sm hover:bg-rose-500/30"
            >
              🎯 Zayıf tuşlar
            </button>
            <button
              type="button"
              onClick={() => { setTrainerFocus('retry'); startTrainer('retry'); }}
              className="py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold text-sm"
            >
              🔁 Tekrar zayıf
            </button>
            <button
              type="button"
              onClick={() => { setTrainerFocus('left'); startTrainer('left'); }}
              className="py-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold text-sm"
            >
              🤚 Sol el
            </button>
            <button
              type="button"
              onClick={() => { setTrainerFocus('right'); startTrainer('right'); }}
              className="py-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold text-sm"
            >
              ✋ Sağ el
            </button>
          </div>
          <p className={`text-xs ${theme.textMuted}`}>
            Önizleme: {trainerLabel({ durationSec: trainerDuration, difficulty: trainerDifficulty, focus: trainerFocus })}
          </p>
          <p className={`text-xs ${theme.textMuted}`}>
            Odak tuşlar: <span className="text-amber-400 font-mono">{describeTrainerFocus(analytics.keyStats, trainerFocus)}</span>
            {' '}— her oturumda bu tuşları içeren farklı kelimeler üretilir.
          </p>
        </div>
      )}
    </div>
  );
});
