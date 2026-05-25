import { memo, useMemo, useState, lazy, Suspense } from 'react';
import type { AnalyticsStore, TrainerConfig, TrainerDifficulty, TrainerFocus } from '../../analytics/types';
import { STREAK_MILESTONES } from '../../analytics/types';
import { getWeakestKeys } from '../../analytics/keyStats';
import { normalizeKey } from '../../analytics/keyStats';
import { getHeatmapSummary, getHandSummary, HEATMAP_MODE_INFO } from '../../analytics/heatmap';
import { buildProgressComparisons, chartCompareData } from '../../analytics/progressCompare';
import { refreshStreakForToday, getNextMilestone } from '../../analytics/streak';
import {
  describeTrainerFocus,
  trainerLabel,
  previewTrainerText,
  TRAINER_FOCUS_INFO,
  COMMON_DRILL_LETTERS,
} from '../../analytics/trainer';
import { KeyboardHeatmap } from './KeyboardHeatmap';
import { KeyDetailPanel } from './KeyDetailPanel';

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
  const [selectedHeatKey, setSelectedHeatKey] = useState<string | null>(null);
  const [trainerDuration, setTrainerDuration] = useState(60);
  const [trainerDifficulty, setTrainerDifficulty] = useState<TrainerDifficulty>('medium');
  const [trainerFocus, setTrainerFocus] = useState<TrainerFocus>('weak');
  const [trainerLetter, setTrainerLetter] = useState('');

  const streak = useMemo(
    () => refreshStreakForToday(analytics.practiceStreak),
    [analytics.practiceStreak]
  );
  const weakest = useMemo(() => getWeakestKeys(analytics.keyStats, 12), [analytics.keyStats]);
  const heatSummary = useMemo(() => getHeatmapSummary(analytics.keyStats), [analytics.keyStats]);
  const handSummary = useMemo(() => getHandSummary(analytics.keyStats), [analytics.keyStats]);
  const comparisons = useMemo(
    () => buildProgressComparisons(analytics.sessionSnapshots),
    [analytics.sessionSnapshots]
  );
  const chartData = useMemo(
    () => chartCompareData(analytics.sessionSnapshots),
    [analytics.sessionSnapshots]
  );
  const nextMilestone = getNextMilestone(streak.currentStreak);

  const effectiveLetter = useMemo(() => {
    if (trainerLetter) return normalizeKey(trainerLetter);
    if (weakest[0]) return weakest[0].key;
    return 'ş';
  }, [trainerLetter, weakest]);

  const trainerConfig = useMemo(
    (): TrainerConfig => ({
      durationSec: trainerDuration,
      difficulty: trainerDifficulty,
      focus: trainerFocus,
      targetKey: trainerFocus === 'letter' ? effectiveLetter : undefined,
    }),
    [trainerDuration, trainerDifficulty, trainerFocus, effectiveLetter]
  );

  const drillPreview = useMemo(
    () => previewTrainerText(analytics.keyStats, trainerConfig),
    [analytics.keyStats, trainerConfig]
  );

  const selectedKeyStat = useMemo(() => {
    if (!selectedHeatKey) return null;
    return analytics.keyStats[selectedHeatKey] || null;
  }, [selectedHeatKey, analytics.keyStats]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'weak', label: 'Zayıf Tuşlar' },
    { id: 'heatmap', label: 'Isı Haritası' },
    { id: 'trainer', label: 'Harf Antrenörü' },
    { id: 'daily', label: 'Günlük' },
    { id: 'streak', label: 'Seri' },
    { id: 'compare', label: 'Karşılaştır' },
  ];

  const startTrainer = (focus: TrainerFocus, targetKey?: string) => {
    onStartTrainer({
      durationSec: trainerDuration,
      difficulty: trainerDifficulty,
      focus,
      targetKey: focus === 'letter' ? targetKey || effectiveLetter : undefined,
    });
  };

  const startLetterTrainer = (key: string) => {
    setTrainerFocus('letter');
    setTrainerLetter(key);
    setTab('trainer');
    startTrainer('letter', key);
  };

  return (
    <div className={`${theme.cardBg} ${theme.border} border rounded-2xl p-4 sm:p-6 space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className={`text-xl font-bold ${theme.text}`}>📊 Analitik Panel</h2>
          <p className={`text-xs ${theme.textMuted}`}>
            Tuş ısı haritası, harf bazlı drill ve performans takibi
          </p>
        </div>
        <button
          type="button"
          onClick={() => startTrainer('weak')}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-semibold shadow-lg shadow-rose-500/20"
        >
          🎯 Hızlı Antrenman
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
          <p className={`text-sm ${theme.textMuted}`}>
            Zayıflık skoru: doğruluk, hata sıklığı, tepki süresi ve tutarlılığın birleşimi. Yüksek skor = öncelikli antrenman.
          </p>
          {weakest.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Henüz yeterli tuş verisi yok. Birkaç test çözün.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {weakest.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => startLetterTrainer(k.key)}
                  className={`rounded-lg p-3 border text-left transition-colors hover:border-amber-500/50 ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-gray-50 border-gray-200'
                  }`}
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
                  <div className="text-xs text-red-400">
                    {k.wrongPresses}/{k.totalPresses} hata
                  </div>
                  <div className="text-[10px] text-rose-400 mt-1 font-semibold">Antrenman →</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="space-y-4">
          {heatSummary.trackedKeys > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { v: heatSummary.trackedKeys, l: 'İzlenen tuş', c: 'text-amber-400' },
                { v: `%${heatSummary.avgAccuracy}`, l: 'Ort. doğruluk', c: 'text-green-400' },
                { v: `${heatSummary.avgReactionMs}ms`, l: 'Ort. tepki', c: 'text-blue-400' },
                { v: heatSummary.totalErrors, l: 'Toplam hata', c: 'text-red-400' },
              ].map((s) => (
                <div
                  key={s.l}
                  className={`rounded-lg p-3 text-center border ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className={`text-lg font-bold ${s.c}`}>{s.v}</div>
                  <div className={`text-[10px] ${theme.textMuted}`}>{s.l}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${theme.textMuted}`}>Isı haritası için en az bir test oturumu gerekli.</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'}`}>
              <span className="text-blue-400 font-semibold">Sol el</span>
              <span className={`ml-2 ${theme.text}`}>%{handSummary.left}</span>
            </div>
            <div className={`rounded-lg p-3 border ${darkMode ? 'border-purple-500/30 bg-purple-500/10' : 'border-purple-200 bg-purple-50'}`}>
              <span className="text-purple-400 font-semibold">Sağ el</span>
              <span className={`ml-2 ${theme.text}`}>%{handSummary.right}</span>
            </div>
          </div>

          {heatSummary.weakestKey && (
            <p className={`text-xs ${theme.textMuted}`}>
              En zayıf tuş:{' '}
              <button
                type="button"
                className="text-amber-400 font-mono font-bold hover:underline"
                onClick={() => setSelectedHeatKey(heatSummary.weakestKey!.key)}
              >
                {heatSummary.weakestKey.key.toUpperCase()}
              </button>{' '}
              (skor {heatSummary.weakestKey.weakKeyScore}) · İyileşen {heatSummary.improvingCount} · Kötüleşen{' '}
              {heatSummary.decliningCount}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {(['weakness', 'errors', 'speed'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setHeatMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  heatMode === m ? 'bg-amber-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200'
                }`}
              >
                {HEATMAP_MODE_INFO[m].title}
              </button>
            ))}
          </div>

          <KeyboardHeatmap
            layout={keyboardLayout}
            keyStats={analytics.keyStats}
            darkMode={darkMode}
            mode={heatMode}
            selectedKey={selectedHeatKey}
            onKeySelect={setSelectedHeatKey}
            showModeHint
          />

          <KeyDetailPanel
            keyLabel={selectedHeatKey || (heatSummary.weakestKey?.key ?? '')}
            stat={selectedKeyStat || (selectedHeatKey ? null : heatSummary.weakestKey)}
            darkMode={darkMode}
            theme={theme}
            onTrain={startLetterTrainer}
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
                    <button
                      key={k}
                      type="button"
                      onClick={() => startLetterTrainer(k)}
                      className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-mono hover:bg-red-500/25"
                    >
                      {k}
                    </button>
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
        <div className="space-y-5">
          <div className={`rounded-xl p-4 border ${darkMode ? 'border-rose-500/30 bg-rose-500/5' : 'border-rose-200 bg-rose-50/50'}`}>
            <h3 className={`text-sm font-bold ${theme.text}`}>🔤 Harf bazlı antrenman modu</h3>
            <p className={`text-xs mt-1 ${theme.textMuted}`}>
              Seçtiğin harfi içeren kelimelerden oluşan kısa drill. Ana sınavdan bağımsız çalışır; zayıf harfleri
              kas hafızasına oturtmak için tasarlandı.
            </p>
          </div>

          <div>
            <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Hedef harf</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_DRILL_LETTERS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setTrainerLetter(l);
                    setTrainerFocus('letter');
                  }}
                  className={`w-9 h-9 rounded-lg font-mono font-bold text-sm ${
                    effectiveLetter === l && trainerFocus === 'letter'
                      ? 'bg-amber-500 text-white'
                      : darkMode
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <input
              type="text"
              maxLength={2}
              value={trainerLetter}
              onChange={(e) => {
                setTrainerLetter(e.target.value);
                setTrainerFocus('letter');
              }}
              placeholder="Özel harf (ör. ş)"
              className={`w-full px-3 py-2 rounded-lg text-sm font-mono ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'}`}
            />
          </div>

          <div>
            <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Süre</div>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 90, 120, 180].map((sec) => (
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
          </div>

          <div>
            <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Zorluk</div>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard'] as TrainerDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTrainerDifficulty(d)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    trainerDifficulty === d ? 'bg-amber-500 text-white' : darkMode ? 'bg-slate-700' : 'bg-gray-200'
                  }`}
                >
                  {d === 'easy' ? 'Kolay — tekrar' : d === 'medium' ? 'Orta — çift kelime' : 'Zor — noktalama + yoğun'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Antrenman türü</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(TRAINER_FOCUS_INFO) as TrainerFocus[]).map((focus) => {
                const info = TRAINER_FOCUS_INFO[focus];
                const active = trainerFocus === focus;
                return (
                  <button
                    key={focus}
                    type="button"
                    onClick={() => setTrainerFocus(focus)}
                    className={`text-left p-3 rounded-xl border transition-colors ${
                      active
                        ? 'border-amber-500 bg-amber-500/10'
                        : darkMode
                          ? 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <span className={`text-sm font-semibold ${theme.text}`}>{info.title}</span>
                    </div>
                    <p className={`text-[11px] mt-1 leading-snug ${theme.textMuted}`}>{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl p-3 border ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-gray-200 bg-gray-50'}`}>
            <div className={`text-xs font-semibold mb-1 ${theme.textMuted}`}>Metin önizlemesi</div>
            <p className={`text-sm font-mono leading-relaxed ${theme.text}`}>{drillPreview}</p>
            <p className={`text-[10px] mt-2 ${theme.textMuted}`}>
              {trainerLabel(trainerConfig)} · Odak:{' '}
              <span className="text-amber-400">{describeTrainerFocus(analytics.keyStats, trainerFocus, effectiveLetter)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => startTrainer(trainerFocus, trainerFocus === 'letter' ? effectiveLetter : undefined)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold shadow-lg shadow-rose-500/25 hover:opacity-95"
          >
            ▶ {trainerFocus === 'letter' ? `${effectiveLetter.toUpperCase()} harfi antrenmanını başlat` : 'Antrenmanı başlat'}
          </button>
        </div>
      )}
    </div>
  );
});
