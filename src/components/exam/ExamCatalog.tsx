import { memo, useMemo, useState } from 'react';
import type { ExamText } from '../../data/examTexts';
import { EXAM_CATEGORIES } from '../../data/examTexts';
import type { ExamProgressStore, ExamTimerMode } from '../../exam/types';
import { getExamProgressSummary } from '../../exam/persistence';
import { formatDuration } from '../../exam/utils';
import { EXAM_AUTO_DURATION_SEC, resolveExamTimerSeconds } from '../../data/examTexts';

interface ThemeTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
}

interface ExamCatalogProps {
  exams: ExamText[];
  progress: ExamProgressStore;
  theme: ThemeTokens;
  darkMode: boolean;
  onBack: () => void;
  onStart: (exam: ExamText, timerMode: ExamTimerMode, fullscreen: boolean) => void;
}

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export const ExamCatalog = memo(function ExamCatalog({
  exams,
  progress,
  theme,
  darkMode,
  onBack,
  onStart,
}: ExamCatalogProps) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [category, setCategory] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<ExamTimerMode>('auto');
  const [fullscreen, setFullscreen] = useState(false);

  const summary = useMemo(() => getExamProgressSummary(progress, exams.length), [progress, exams.length]);

  const solvedExamIds = useMemo(
    () =>
      new Set(
        Object.entries(progress.bestByExam)
          .filter(([, b]) => (b?.attempts ?? 0) > 0)
          .map(([id]) => id),
      ),
    [progress.bestByExam],
  );

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (difficulty !== 'all' && e.difficulty !== difficulty) return false;
      if (category !== 'all' && e.category !== category) return false;
      return true;
    });
  }, [exams, difficulty, category]);

  const effectiveSelectedId =
    selectedId && filtered.some((e) => e.id === selectedId) ? selectedId : filtered[0]?.id ?? null;

  const selected = filtered.find((e) => e.id === effectiveSelectedId) ?? filtered[0];
  const timerPreview = selected ? resolveExamTimerSeconds(selected, timerMode) : 0;

  const diffStyle = (d: string) =>
    d === 'easy'
      ? 'bg-green-500/20 text-green-400'
      : d === 'hard'
        ? 'bg-red-500/20 text-red-400'
        : 'bg-amber-500/20 text-amber-400';

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-bold ${theme.text}`}>📋 Sınav Modu</h2>
          <p className={`text-sm ${theme.textMuted}`}>Sabit metin · geri sayım · detaylı sonuç</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}
        >
          ← Geri
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Tamamlanan', value: summary.completedCount },
          { label: 'Kalan', value: summary.remainingCount },
          { label: 'Ort. doğruluk', value: `%${summary.avgAccuracy}` },
          { label: 'Gelişim', value: `${summary.improvementPct >= 0 ? '+' : ''}${summary.improvementPct}` },
        ].map((s) => (
          <div key={s.label} className={`${theme.cardBg} ${theme.border} border rounded-xl p-3 text-center`}>
            <div className="text-lg font-bold text-indigo-400">{s.value}</div>
            <div className={`text-xs ${theme.textMuted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              difficulty === d ? 'bg-indigo-500 text-white' : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200'
            }`}
          >
            {d === 'all' ? 'Tümü' : d === 'easy' ? 'Kolay' : d === 'medium' ? 'Orta' : 'Zor'}
          </button>
        ))}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-xs ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-100'}`}
        >
          <option value="all">Tüm kategoriler</option>
          {EXAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={`space-y-2 max-h-[420px] overflow-y-auto pr-1`}>
          {filtered.length === 0 ? (
            <p className={`text-sm p-4 ${theme.textMuted}`}>Bu filtreyle eşleşen sınav metni yok.</p>
          ) : null}
          {filtered.map((exam, index) => {
            const b = progress.bestByExam[exam.id];
            const solved = solvedExamIds.has(exam.id);
            const active = exam.id === selected?.id;
            return (
              <button
                key={`${exam.id}-${index}`}
                type="button"
                onClick={() => setSelectedId(exam.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  active
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : darkMode
                      ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between gap-2 items-start">
                  <div className={`font-semibold text-sm ${theme.text}`}>{exam.title}</div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {solved && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                        ✓ Çözüldü
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${diffStyle(exam.difficulty)}`}>
                      {exam.difficulty}
                    </span>
                  </div>
                </div>
                <div className={`text-xs mt-1 ${theme.textMuted}`}>
                  {exam.category} · {formatDuration(EXAM_AUTO_DURATION_SEC)} (otomatik)
                </div>
                {exam.source === 'Gerçek sınav' && (
                  <div className="text-[10px] mt-1 text-emerald-400 font-semibold">✓ Gerçek sınav metni</div>
                )}
                {b && (
                  <div className="text-xs mt-2 text-indigo-400">
                    En iyi: {b.bestWpm} WPM · %{b.bestAccuracy} · {b.attempts} deneme
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className={`${theme.cardBg} ${theme.border} border rounded-2xl p-5 space-y-4 sticky top-4`}>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-lg font-bold ${theme.text}`}>{selected.title}</h3>
                {solvedExamIds.has(selected.id) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                    ✓ Çözüldü
                  </span>
                )}
              </div>
              <p className={`text-xs ${theme.textMuted} mt-1`}>
                {selected.category}
                {selected.source ? ` · ${selected.source}` : ''}
              </p>
            </div>
            <p className={`text-sm line-clamp-4 ${theme.textMuted}`}>{selected.text}</p>

            <div>
              <div className={`text-xs font-semibold mb-2 ${theme.text}`}>Süre</div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['auto', 'Otomatik (3 dk)'],
                    [60, '1 dk'],
                    [180, '3 dk'],
                    [300, '5 dk'],
                    [0, 'Sınırsız'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={String(mode)}
                    type="button"
                    onClick={() => setTimerMode(mode as ExamTimerMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs ${
                      timerMode === mode ? 'bg-indigo-500 text-white' : darkMode ? 'bg-slate-700' : 'bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className={`text-xs mt-2 ${theme.textMuted}`}>
                {timerMode === 0
                  ? 'Süre sınırı yok'
                  : `Seçilen süre: ${timerPreview === 0 ? '—' : formatDuration(timerPreview)}`}
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={(e) => setFullscreen(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span className={`text-sm ${theme.text}`}>Tam ekran sınav deneyimi</span>
            </label>

            <button
              type="button"
              onClick={() => onStart(selected, timerMode, fullscreen)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/25"
            >
              Sınavı Başlat
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
