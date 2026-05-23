import { memo } from 'react';
import type { ResultSuggestion } from '../../analytics/types';

interface ResultSuggestionsProps {
  suggestions: ResultSuggestion[];
  darkMode: boolean;
  themeText: string;
  themeMuted: string;
  onTrainer?: () => void;
  onAnalytics?: () => void;
}

export const ResultSuggestions = memo(function ResultSuggestions({
  suggestions,
  darkMode,
  themeText,
  themeMuted,
  onTrainer,
  onAnalytics,
}: ResultSuggestionsProps) {
  if (suggestions.length === 0) return null;

  const priorityStyle = {
    high: darkMode ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50',
    medium: darkMode ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50',
    low: darkMode ? 'border-green-500/30 bg-green-500/10' : 'border-green-200 bg-green-50',
  };

  return (
    <div className={`rounded-lg p-4 mb-8 border ${darkMode ? 'border-slate-600' : 'border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${themeText}`}>
        <span>💡</span> Akıllı Öneriler
      </h3>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div
            key={s.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${priorityStyle[s.priority]}`}
          >
            <span className="text-xl shrink-0">{s.icon}</span>
            <p className={`text-sm flex-1 ${themeText}`}>{s.text}</p>
            {s.action === 'trainer' && onTrainer && (
              <button
                type="button"
                onClick={onTrainer}
                className="shrink-0 text-xs px-2 py-1 rounded bg-rose-500 text-white font-semibold"
              >
                Antrenör
              </button>
            )}
            {s.action === 'analytics' && onAnalytics && (
              <button
                type="button"
                onClick={onAnalytics}
                className="shrink-0 text-xs px-2 py-1 rounded bg-amber-500 text-white font-semibold"
              >
                Analitik
              </button>
            )}
          </div>
        ))}
      </div>
      <p className={`text-xs mt-2 ${themeMuted}`}>Öneriler zayıf tuş, seri ve oturum trendlerine göre üretilir.</p>
    </div>
  );
});
