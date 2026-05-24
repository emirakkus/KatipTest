export type ExamWordOutcome = 'correct' | 'wrong' | 'skipped';

export interface ExamWordResult {
  index: number;
  expected: string;
  typed: string;
  outcome: ExamWordOutcome;
  charStart: number;
  charEnd: number;
  expectedCharCount: number;
  charErrors: number;
}

export interface CompletedWordEntry {
  word: string;
  isCorrect: boolean;
  correctWord: string;
  skipped?: boolean;
}

export function normalizeExamWord(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/[.,!?;:()"'“”‘’…\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildTextWordSpans(text: string) {
  const spans: { index: number; word: string; charStart: number; charEnd: number }[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = re.exec(text)) !== null) {
    spans.push({ index, word: match[0], charStart: match.index, charEnd: match.index + match[0].length });
    index += 1;
  }
  return spans;
}

function computeWordCharErrors(typed: string, expected: string): number {
  const t = normalizeExamWord(typed);
  const c = normalizeExamWord(expected);
  if (t === c) return 0;
  const m = t.length;
  const n = c.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        t[i - 1] === c[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return Math.min(dp[m][n] + Math.abs(m - n), n);
}

export function buildExamWordResultsFromSession(
  completedWords: CompletedWordEntry[],
  textWords: string[],
  fullText: string,
): ExamWordResult[] {
  const spans = buildTextWordSpans(fullText);
  const results: ExamWordResult[] = [];
  let refIdx = 0;

  for (const cw of completedWords) {
    if (refIdx >= textWords.length) break;
    const expected = textWords[refIdx];
    const span = spans[refIdx];
    const expectedCharCount = normalizeExamWord(expected).length;

    if (cw.skipped) {
      results.push({
        index: refIdx,
        expected,
        typed: '',
        outcome: 'skipped',
        charStart: span?.charStart ?? 0,
        charEnd: span?.charEnd ?? expected.length,
        expectedCharCount,
        charErrors: expectedCharCount,
      });
      refIdx++;
      continue;
    }

    const typed = cw.word.trim();
    const isCorrect = typed.length > 0 && normalizeExamWord(typed) === normalizeExamWord(expected);
    results.push({
      index: refIdx,
      expected,
      typed,
      outcome: isCorrect ? 'correct' : 'wrong',
      charStart: span?.charStart ?? 0,
      charEnd: span?.charEnd ?? expected.length,
      expectedCharCount,
      charErrors: isCorrect ? 0 : typed ? computeWordCharErrors(typed, expected) : expectedCharCount,
    });
    refIdx++;
  }

  return results;
}

export function summarizeWordResults(results: ExamWordResult[]) {
  const correct = results.filter((r) => r.outcome === 'correct').length;
  const wrong = results.filter((r) => r.outcome === 'wrong').length;
  const skipped = results.filter((r) => r.outcome === 'skipped').length;
  return {
    correct,
    wrong,
    skipped,
    wrongWords: results.filter((r) => r.outcome === 'wrong' || r.outcome === 'skipped'),
  };
}

export function formatTextPosition(charStart: number, charEnd: number): string {
  return `${charStart + 1}–${charEnd}`;
}
