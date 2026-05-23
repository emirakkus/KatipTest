import { memo } from 'react';
import type { ExamLiveResult } from '../../exam/types';
import type { ExamSuggestion } from '../../exam/suggestions';
import { badgeColor, badgeLabel, formatDuration } from '../../exam/utils';

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
  const stats = [
    { label: 'WPM', value: result.wpm, color: 'text-amber-400' },
    { label: 'Doğruluk', value: `%${result.accuracy}`, color: 'text-green-400' },
    { label: 'Hata', value: result.mistakes, color: 'text-red-400' },
    { label: 'Tamamlama', value: `%${result.completion}`, color: 'text-blue-400' },
    { label: 'Süre', value: formatDuration(result.timeSpent), color: theme.text },
    { label: 'Tepki hızı', value: `${result.avgReactionMs}ms`, color: 'text-purple-400' },
    { label: 'Doğru karakter', value: result.correctChars, color: 'text-green-400' },
    { label: 'Yanlış karakter', value: result.incorrectChars, color: 'text-red-400' },
    { label: 'Toplam vuruş', value: result.totalTypedChars, color: theme.text },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <div className="text-4xl">📋</div>
        <h2 className={`text-2xl font-bold ${theme.text}`}>Sınav Sonucu</h2>
        <p className={`text-sm ${theme.textMuted}`}>{result.examTitle}</p>
        <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${badgeColor(result.badge)} bg-slate-800/50 border border-slate-700`}>
          {badgeLabel(result.badge)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${theme.cardBg} ${theme.border} border rounded-xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs ${theme.textMuted}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-5 space-y-3`}>
          <h3 className={`font-semibold ${theme.text}`}>💡 Öneriler</h3>
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

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRetry} className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold">
          🔄 Tekrar Dene
        </button>
        <button type="button" onClick={onCatalog} className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
          📋 Sınav Listesi
        </button>
        <button type="button" onClick={onMenu} className={`px-6 py-3 rounded-xl font-semibold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200'}`}>
          🏠 Ana Menü
        </button>
      </div>
    </div>
  );
});
