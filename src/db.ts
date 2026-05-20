// Supabase Database Layer
// Kullanıcı verilerini bulutta saklar

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase credentials — .env veya Vercel environment variables'dan alınır
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function isDbEnabled(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ============================
// AUTH — Kullanıcı Kayıt/Giriş
// ============================

export async function signUp(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Veritabanı bağlantısı yok' };
  
  const emailRedirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { emailRedirectTo }
  });
  if (error) return { error: error.message };
  return { data, error: null };
}

export async function signIn(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { error: 'Veritabanı bağlantısı yok' };
  
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { data, error: null };
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export async function getUser() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

// ============================
// PROFILES — Kullanıcı Profili
// ============================

export interface DbProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  xp: number;
  career_stage: number;
  career_tests: number;
  career_best_words: number;
  career_best_accuracy: number;
  total_tests: number;
  total_practice_minutes: number;
  streak: number;
  best_words: number;
  best_chars: number;
  best_wpm: number;
  weak_words: any[];
  daily_logs: any[];
  completed_missions: string[];
  settings: any;
  created_at: string;
  updated_at: string;
}

export async function saveProfileToDb(profileData: Partial<DbProfile>) {
  const sb = getSupabase();
  if (!sb) return { error: 'DB yok' };
  
  const user = await getUser();
  if (!user) return { error: 'Giriş yapılmamış' };

  const { error } = await sb
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      ...profileData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) return { error: error.message };
  return { error: null };
}

export async function loadProfileFromDb(): Promise<DbProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;
  
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as DbProfile;
}

// ============================
// TEST RESULTS — Sınav Sonuçları
// ============================

export async function saveTestResult(result: {
  net_words: number;
  gross_words: number;
  correct_chars: number;
  total_chars: number;
  accuracy: number;
  wpm: number;
  time_limit: number;
  hard_mode: boolean;
  sudden_death: boolean;
}) {
  const sb = getSupabase();
  if (!sb) return { error: 'DB yok' };
  
  const user = await getUser();
  if (!user) return { error: 'Giriş yapılmamış' };

  const { error } = await sb
    .from('test_results')
    .insert({
      user_id: user.id,
      ...result,
      created_at: new Date().toISOString()
    });

  if (error) return { error: error.message };
  return { error: null };
}

export async function getTestHistory(limit: number = 50) {
  const sb = getSupabase();
  if (!sb) return [];
  
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from('test_results')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

// ============================
// LEADERBOARD — Sıralama
// ============================

export async function getLeaderboard(
  period: 'all' | 'daily' | 'weekly' | 'monthly' = 'all',
  limit: number = 20
) {
  const sb = getSupabase();
  if (!sb) return [];

  const table =
    period === 'daily'
      ? 'public_leaderboard_daily'
      : period === 'weekly'
      ? 'public_leaderboard_weekly'
      : period === 'monthly'
      ? 'public_leaderboard_monthly'
      : 'public_leaderboard';

  const { data, error } = await sb
    .from(table)
    .select('name, avatar, best_words, best_chars, best_wpm, xp, career_stage, total_tests, created_at')
    .order('best_words', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

// ============================
// SYNC — LocalStorage ↔ DB
// ============================

export async function syncToCloud(localProfile: any, localHistory: any[]) {
  const sb = getSupabase();
  if (!sb) return false;
  
  const user = await getUser();
  if (!user) return false;

  // Profili kaydet
  await saveProfileToDb({
    name: localProfile.name || '',
    avatar: localProfile.avatar || '👤',
    xp: localProfile.xp || 0,
    career_stage: localProfile.careerStage || 1,
    career_tests: localProfile.careerTestsAtStage || 0,
    career_best_words: localProfile.careerBestWords || 0,
    career_best_accuracy: localProfile.careerBestAccuracy || 0,
    total_tests: localProfile.totalTests || 0,
    total_practice_minutes: localProfile.totalPracticeMinutes || 0,
    best_words: localHistory.length > 0 ? Math.max(...localHistory.map((h: any) => h.netWords || 0)) : 0,
    best_chars: localHistory.length > 0 ? Math.max(...localHistory.map((h: any) => h.correctChars || 0)) : 0,
    best_wpm: localHistory.length > 0 ? Math.max(...localHistory.map((h: any) => h.wpm || 0)) : 0,
    weak_words: localProfile.weakWords || [],
    daily_logs: localProfile.dailyLogs || [],
    completed_missions: localProfile.completedMissionIds || [],
    settings: {}
  });

  return true;
}

export async function saveContactMessage(message: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const sb = getSupabase();
  if (!sb) return { error: 'DB yok' };
  const { error } = await sb.from('contact_messages').insert({
    ...message,
    created_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { error: null };
}

/*
============================
SUPABASE KURULUM REHBERİ
============================

1. https://supabase.com adresine git, ücretsiz hesap aç
2. "New Project" → proje adı: katiptest
3. Database password'u kaydet
4. Proje oluşunca Settings → API → URL ve anon key'i kopyala

5. Vercel'de Environment Variables ekle:
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOi...

6. Supabase SQL Editor'de bu tabloları oluştur:

-- Kullanıcı profilleri
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT DEFAULT '',
  avatar TEXT DEFAULT '👤',
  xp INTEGER DEFAULT 0,
  career_stage INTEGER DEFAULT 1,
  career_tests INTEGER DEFAULT 0,
  career_best_words INTEGER DEFAULT 0,
  career_best_accuracy REAL DEFAULT 0,
  total_tests INTEGER DEFAULT 0,
  total_practice_minutes INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  best_words INTEGER DEFAULT 0,
  best_chars INTEGER DEFAULT 0,
  best_wpm INTEGER DEFAULT 0,
  weak_words JSONB DEFAULT '[]',
  daily_logs JSONB DEFAULT '[]',
  completed_missions JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sonuçları
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  net_words INTEGER DEFAULT 0,
  gross_words INTEGER DEFAULT 0,
  correct_chars INTEGER DEFAULT 0,
  total_chars INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  wpm INTEGER DEFAULT 0,
  time_limit INTEGER DEFAULT 180,
  hard_mode BOOLEAN DEFAULT false,
  sudden_death BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) Politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own results" ON test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard için public read (sadece isim ve skor)
CREATE POLICY "Anyone can read leaderboard" ON profiles FOR SELECT USING (true);

-- Index'ler
CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX idx_profiles_best_words ON profiles(best_words DESC);

*/
