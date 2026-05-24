import { memo } from 'react';
import type { ExamWordResult } from '../../exam/wordTracking';
import { formatTextPosition } from '../../exam/wordTracking';

interface ThemeTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
}

interface ExamWrongWordsPanelProps {
  wrongWords: ExamWordResult[];
  theme: ThemeTokens;
  darkMode: boolean;
}

export const ExamWrongWordsPanel = memo(function ExamWrongWordsPanel({
  wrongWords,
  theme,
  darkMode,
}: ExamWrongWordsPanelProps) {
  if (wrongWords.length === 0) return null;

  return (
    <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-5 space-y-3`}>
      <h3 className={`font-semibold ${theme.text}`}>
        Yanlış ve atlanan kelimeler
        <span className={`ml-2 text-xs font-normal ${theme.textMuted}`}>({wrongWords.length})</span>
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {wrongWords.map((item) => (
          <div
            key={`${item.index}-${item.charStart}`}
            className={`rounded-lg p-3 border text-sm ${
              darkMode ? 'bg-slate-800/70 border-slate-700' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
              <span className={`font-mono px-1.5 py-0.5 rounded ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                Kelime #{item.index + 1}
              </span>
              <span className={theme.textMuted}>Konum {formatTextPosition(item.charStart, item.charEnd)}</span>
              {item.outcome === 'skipped' && (
                <span className="text-orange-400 font-semibold">atlandı</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Beklenen</div>
                <div className="text-green-400 font-semibold font-mono break-words">{item.expected}</div>
              </div>
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Sizin yazdığınız</div>
                <div className="text-red-400 font-semibold font-mono break-words">
                  {item.outcome === 'skipped' ? '—' : item.typed || '(boş)'}
                </div>
              </div>
            </div>
            <div className={`text-xs mt-2 pt-2 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <span className={theme.textMuted}>Karakter hatası: </span>
              <span className="text-red-400 font-bold">{item.charErrors}</span>
              <span className={theme.textMuted}> / {item.expectedCharCount} beklenen</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
