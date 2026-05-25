import { memo, useMemo } from 'react';
import type { ExamLiveResult } from '../../exam/types';
import type { ExamSuggestion } from '../../exam/suggestions';
import { badgeColor, badgeLabel, formatDuration } from '../../exam/utils';
import { summarizeWordResults } from '../../exam/wordTracking';
import { ExamWrongWordsPanel } from './ExamWrongWordsPanel';

interface ThemeTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
}

interface ExamResultScreenProps {
  result: ExamLiveResult;
  suggestions: ExamSuggestion[];
  theme: ThemeTokens;
  darkMode: boolean;
  onRetry: () => void;
  onCatalog: () => void;
  onMenu: () => void;
  onTrainer?: () => void;
}

export const ExamResultScreen = memo(function ExamResultScreen({
  result,
  suggestions,
  theme,
  darkMode,
  onRetry,
  onCatalog,
  onMenu,
  onTrainer,
}: ExamResultScreenProps) {
  const wordStats = useMemo(() => {
    const fromResult = {
      correct: result.correctWordCount,
      wrong: result.wrongWordCount,
      skipped: result.skippedWordCount,
    };
    const totalFromResult = fromResult.correct + fromResult.wrong + fromResult.skipped;
    if (totalFromResult > 0) return fromResult;
    const summary = summarizeWordResults(result.wordResults);
    return { correct: summary.correct, wrong: summary.wrong, skipped: summary.skipped };
  }, [result.correctWordCount, result.wrongWordCount, result.skippedWordCount, result.wordResults]);

  const wrongWords = useMemo(
    () => result.wordResults.filter((r) => r.outcome === 'wrong' || r.outcome === 'skipped'),
    [result.wordResults],
  );

  return (
    <div className="space-y-6 max-w-3xl mx-auto pt-2">
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-bold ${theme.text}`}>Sınav Sonucu</h2>
        <p className={`text-sm ${theme.textMuted}`}>{result.examTitle}</p>
        <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${badgeColor(result.badge)} bg-slate-800/50 border border-slate-700`}>
          {badgeLabel(result.badge)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4`}>
          <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.textMuted}`}>Kelime</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{wordStats.correct}</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Doğru</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{wordStats.wrong}</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Yanlış</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{wordStats.skipped}</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Atlanan</div>
            </div>
          </div>
        </div>
        <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-4`}>
          <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.textMuted}`}>Karakter</div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{result.correctChars}</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Doğru</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{result.incorrectChars}</div>
              <div className={`text-[10px] ${theme.textMuted}`}>Yanlış</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'WPM', value: result.wpm, color: 'text-amber-400' },
          { label: 'Doğruluk', value: `%${result.accuracy}`, color: 'text-green-400' },
          { label: 'Tamamlama', value: `%${result.completion}`, color: 'text-blue-400' },
          { label: 'Süre', value: formatDuration(result.timeSpent), color: theme.text },
        ].map((s) => (
          <div key={s.label} className={`${theme.cardBg} ${theme.border} border rounded-xl p-3 text-center`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-[10px] ${theme.textMuted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      <ExamWrongWordsPanel wrongWords={wrongWords} theme={theme} darkMode={darkMode} />

      {suggestions.length > 0 && (
        <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-5 space-y-3`}>
          <h3 className={`font-semibold ${theme.text}`}>Öneriler</h3>
          {suggestions.map((s) => (
            <div
              key={s.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-gray-50'}`}
            >
              <span className="text-xl">{s.icon}</span>
              <p className={`text-sm flex-1 ${theme.text}`}>{s.text}</p>
              {s.action === 'trainer' && onTrainer && (
                <button type="button" onClick={onTrainer} className="text-xs px-2 py-1 rounded bg-rose-500 text-white font-semibold shrink-0">
                  Antrenör
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 pb-4">
        <button type="button" onClick={onRetry} className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold">
          Tekrar Dene
        </button>
        <button type="button" onClick={onCatalog} className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
          Sınav Listesi
        </button>
        <button type="button" onClick={onMenu} className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
          Ana Menü
        </button>
      </div>
    </div>
  );
});
