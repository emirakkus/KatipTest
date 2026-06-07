import { TEXTS_EASY, TEXTS_MEDIUM, TEXTS_HARD } from '../data/texts';
import type { KeyStat, TrainerConfig, TrainerDifficulty, TrainerFocus } from './types';
import { LEFT_HAND_KEYS, RIGHT_HAND_KEYS } from './types';
import { getWeakestKeys, normalizeKey } from './keyStats';

const PUNCT_CHARS = '.,;:!?';

/** Metin havuzundan benzersiz kelimeler */
const WORD_POOL: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  const raw = [...TEXTS_EASY, ...TEXTS_MEDIUM, ...TEXTS_HARD].join(' ');
  for (const w of raw.split(/\s+/)) {
    const clean = w.replace(/[.,!?;:()"'“”‘’…\-]/g, '').toLocaleLowerCase('tr-TR').trim();
    if (clean.length >= 3 && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
})();

/** Havuzda kelime yoksa kullanılacak yedekler */
const KEY_FALLBACK_WORDS: Record<string, string[]> = {
  ş: ['işlem', 'başvuru', 'mahkeme', 'karışık', 'yüksek', 'şikayet', 'gerekçe'],
  ı: ['sınav', 'hüküm', 'icra', 'birlikte', 'hakim', 'dosya', 'zabıt'],
  ğ: ['dağıtım', 'değerlendirme', 'doğruluk', 'bağlantı', 'yükümlülük'],
  ü: ['hüküm', 'görüş', 'süreç', 'tutanak', 'yükümlü'],
  ö: ['görüş', 'öneri', 'sözlü', 'yüksek', 'bölüm'],
  ç: ['içerik', 'karar', 'işlem', 'açıklama', 'geçici'],
  i: ['icra', 'birlikte', 'işlem', 'dilekçe', 'mahkeme'],
  e: ['değerlendirme', 'tebligat', 'gerekçe', 'celp', 'dava'],
  a: ['adalet', 'karar', 'dava', 'başvuru', 'katip'],
  k: ['katip', 'karar', 'yüksek', 'hakim', 'celp'],
  l: ['celp', 'davalı', 'mahkeme', 'dosya', 'talep'],
  r: ['karar', 'gerekçe', 'duruşma', 'zorla', 'birlikte'],
  t: ['tutanak', 'tebligat', 'temyiz', 'taraf', 'talep'],
  n: ['sanık', 'tanık', 'davanın', 'inceleme', 'sonuç'],
  m: ['mahkeme', 'temyiz', 'komisyon', 'emir', 'tamam'],
  s: ['sanık', 'savunma', 'sınav', 'süreç', 'sonuç'],
  d: ['dava', 'davalı', 'dosya', 'değerlendirme', 'duruşma'],
  g: ['gerekçe', 'görüş', 'gürültü', 'genel', 'görev'],
  h: ['hüküm', 'hakim', 'haciz', 'heyet', 'hukuk'],
  u: ['uzlaşma', 'usul', 'uyap', 'uygulama', 'uzun'],
  o: ['olay', 'oturum', 'oran', 'onay', 'oy'],
  p: ['para', 'protokol', 'parti', 'puan', 'plan'],
  z: ['zabıt', 'zorla', 'zaman', 'zincir', 'zarar'],
  v: ['vekalet', 'vergi', 'vakıf', 'vücut', 'varlık'],
  y: ['yargı', 'yazım', 'yüksek', 'yürütme', 'yasal'],
  c: ['celp', 'ceza', 'celse', 'ciddi', 'cümle'],
  b: ['beraat', 'borç', 'başvuru', 'bölüm', 'bilirkişi'],
  f: ['fail', 'fesih', 'fazla', 'fiili', 'form'],
  j: ['jandarma', 'juri', 'jeton'],
  x: ['ekstra', 'aksiyon'],
  q: ['iraq'],
  w: ['web'],
  space: ['kelime', 'arasında', 'metin', 'yazım', 'boşluk'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordsContainingKey(key: string): string[] {
  const k = normalizeKey(key);
  if (!k || k === 'space') return KEY_FALLBACK_WORDS.space || [];
  return WORD_POOL.filter((w) => w.includes(k));
}

function resolveTargetStats(
  stats: Record<string, KeyStat>,
  focus: TrainerFocus,
  targetKey?: string
): KeyStat[] {
  if (focus === 'letter' && targetKey) {
    const k = normalizeKey(targetKey);
    const stat = stats[k];
    if (stat && stat.totalPresses >= 1) return [stat];
    return [
      {
        key: k,
        totalPresses: 1,
        wrongPresses: 1,
        accuracy: 75,
        avgReactionMs: 350,
        consistency: 40,
        trend: 'stable',
        weakKeyScore: 45,
        lastUpdated: Date.now(),
      },
    ];
  }
  if (focus === 'left') {
    return Object.values(stats)
      .filter((s) => LEFT_HAND_KEYS.has(s.key) && s.totalPresses >= 2)
      .sort((a, b) => b.weakKeyScore - a.weakKeyScore)
      .slice(0, 8);
  }
  if (focus === 'right') {
    return Object.values(stats)
      .filter((s) => RIGHT_HAND_KEYS.has(s.key) && s.totalPresses >= 2)
      .sort((a, b) => b.weakKeyScore - a.weakKeyScore)
      .slice(0, 8);
  }
  if (focus === 'retry') {
    return getWeakestKeys(stats, 8);
  }
  return getWeakestKeys(stats, 10);
}

function defaultStatsForFocus(focus: TrainerFocus): KeyStat[] {
  const keys =
    focus === 'left'
      ? ['a', 's', 'd', 'f', 'g', 'r', 'e']
      : focus === 'right'
        ? ['h', 'j', 'k', 'l', 'i', 'o', 'u']
        : ['a', 'e', 'i', 'k', 'l', 'r', 'n'];
  return keys.map((key) => ({
    key,
    totalPresses: 1,
    wrongPresses: 1,
    accuracy: 70,
    avgReactionMs: 400,
    consistency: 50,
    trend: 'stable' as const,
    weakKeyScore: 50,
    lastUpdated: Date.now(),
  }));
}

function pickWordForKey(stat: KeyStat, used: Set<string>): string {
  const key = normalizeKey(stat.key);
  let candidates = wordsContainingKey(key);
  if (candidates.length === 0) {
    candidates = KEY_FALLBACK_WORDS[key] || [`${key}arak`, `${key}eden`, `tekrar${key}`];
  }
  const fresh = candidates.filter((w) => !used.has(w));
  const pool = fresh.length > 0 ? fresh : candidates;
  const word = pool[Math.floor(Math.random() * pool.length)];
  used.add(word);
  return word;
}

/** Tek harfe odaklı drill — kelime tekrarı + harf yoğunluğu */
function generateLetterDrillText(
  targetKey: string,
  difficulty: TrainerDifficulty,
  stats: Record<string, KeyStat>
): string {
  const targetStats = resolveTargetStats(stats, 'letter', targetKey);
  const wordCount =
    difficulty === 'easy' ? 28 : difficulty === 'medium' ? 48 : 68;
  const words = buildWordList(targetStats, wordCount);
  const key = normalizeKey(targetKey);

  if (difficulty === 'easy') {
    return words.join(' ');
  }

  if (difficulty === 'medium') {
    const doubled = words
      .filter((w) => w.includes(key))
      .slice(0, 6)
      .map((w) => `${w} ${w}`);
    return [...doubled, ...words].join(' ');
  }

  let text = words.join(' ');
  text = injectPunctuation(text, targetStats);
  const burst = wordsContainingKey(key).slice(0, 4);
  if (burst.length >= 2) {
    text = `${burst.join(' ')} ${text}`;
  }
  return text;
}

function buildWordList(targetStats: KeyStat[], wordCount: number): string[] {
  const words: string[] = [];
  const used = new Set<string>();
  let guard = 0;

  while (words.length < wordCount && guard < wordCount * 20) {
    guard++;
    for (const stat of targetStats) {
      const weight = Math.max(1, Math.min(6, Math.ceil(stat.weakKeyScore / 12)));
      for (let i = 0; i < weight && words.length < wordCount; i++) {
        words.push(pickWordForKey(stat, used));
      }
    }
  }

  return shuffle(words);
}

function injectPunctuation(text: string, keys: KeyStat[]): string {
  const punctKeys = keys.filter((k) => PUNCT_CHARS.includes(k.key));
  if (punctKeys.length === 0) return text;
  const parts = text.split(' ');
  const punct = punctKeys[0]?.key || '.';
  for (let i = 3; i < parts.length; i += 7) {
    parts[i] = `${parts[i]}${punct}`;
  }
  return parts.join(' ');
}

export function generateTrainerText(
  stats: Record<string, KeyStat>,
  config: TrainerConfig
): string {
  if (config.focus === 'letter' && config.targetKey) {
    return generateLetterDrillText(config.targetKey, config.difficulty, stats);
  }

  let targetStats = resolveTargetStats(stats, config.focus, config.targetKey);
  if (targetStats.length === 0) {
    targetStats = defaultStatsForFocus(config.focus);
  }

  const wordCount =
    config.difficulty === 'easy' ? 35 : config.difficulty === 'medium' ? 55 : 75;

  const words = buildWordList(targetStats, wordCount);
  let text = words.join(' ');

  if (config.difficulty === 'hard') {
    text = injectPunctuation(text, targetStats);
  }

  return text;
}

/** Önizleme: hangi tuşlara odaklanıldığını göster */
export function describeTrainerFocus(
  stats: Record<string, KeyStat>,
  focus: TrainerFocus,
  targetKey?: string
): string {
  if (focus === 'letter' && targetKey) {
    return normalizeKey(targetKey).toUpperCase();
  }
  const targets = resolveTargetStats(stats, focus, targetKey);
  const keys = (targets.length > 0 ? targets : defaultStatsForFocus(focus))
    .slice(0, 5)
    .map((s) => s.key.toUpperCase())
    .join(', ');
  return keys || '—';
}

export function previewTrainerText(
  stats: Record<string, KeyStat>,
  config: TrainerConfig,
  maxLen = 140
): string {
  const text = generateTrainerText(stats, config);
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

export const TRAINER_FOCUS_INFO: Record<
  TrainerFocus,
  { title: string; desc: string; icon: string }
> = {
  weak: {
    icon: '🎯',
    title: 'Zayıf tuşlar',
    desc: 'En yüksek zayıflık skoruna sahip 10 tuştan kelimeler seçilir; hata yaptığın harfler ağırlıklı tekrarlanır',
  },
  retry: {
    icon: '🔁',
    title: 'Tekrar zayıf',
    desc: 'Son oturumlarda en çok düşen tuşlara odaklanır; aynı hatayı tekrarlamamak için yoğun tekrar',
  },
  left: {
    icon: '🤚',
    title: 'Sol el',
    desc: 'Sol el bölgesindeki (F/Q sol yarı) zayıf tuşlar için kelime drilli',
  },
  right: {
    icon: '✋',
    title: 'Sağ el',
    desc: 'Sağ el bölgesindeki zayıf tuşlar için kelime drilli',
  },
  letter: {
    icon: '🔤',
    title: 'Harf bazlı',
    desc: 'Seçtiğin tek harfi içeren kelimelerle kısa drill; kolayda tekrar, zorda noktalama ve yoğun tekrar',
  },
};

/** Türkçe klavyede sık zorlanan harfler */
export const COMMON_DRILL_LETTERS = ['ş', 'ı', 'ğ', 'ü', 'ö', 'ç', 'i', 'e', 'a', 'k', 'l', 'r'] as const;

export function trainerLabel(config: TrainerConfig): string {
  const focusLabels: Record<TrainerFocus, string> = {
    weak: 'Zayıf Tuşlar',
    left: 'Sol El',
    right: 'Sağ El',
    retry: 'Tekrar Zayıf',
    letter: config.targetKey ? `Harf: ${normalizeKey(config.targetKey).toUpperCase()}` : 'Harf Bazlı',
  };
  const diffLabels: Record<TrainerDifficulty, string> = {
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
  };
  return `${focusLabels[config.focus]} · ${diffLabels[config.difficulty]} · ${config.durationSec}s`;
}
