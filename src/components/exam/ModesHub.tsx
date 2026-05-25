import { memo } from 'react';

interface ThemeTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
}

interface ModesHubProps {
  theme: ThemeTokens;
  darkMode: boolean;
  completedExams: number;
  totalExams: number;
  onPractice: () => void;
  onTrainer: () => void;
  onExam: () => void;
}

export const ModesHub = memo(function ModesHub({
  theme,
  darkMode: _darkMode,
  completedExams,
  totalExams,
  onPractice,
  onTrainer,
  onExam,
}: ModesHubProps) {
  const modes = [
    {
      id: 'practice',
      icon: '⚡',
      title: 'Pratik Modu',
      desc: 'Serbest sınav simülasyonu, ısınma ve günlük antrenman',
      color: 'from-amber-500 to-orange-600',
      action: onPractice,
    },
    {
      id: 'trainer',
      icon: '🎯',
      title: 'Antrenör Modu',
      desc: 'Isı haritası, harf bazlı drill ve zayıf tuş antrenmanları',
      color: 'from-rose-500 to-pink-600',
      action: onTrainer,
    },
    {
      id: 'exam',
      icon: '📋',
      title: 'Sınav Modu',
      desc: `${totalExams} gerçek sınav metni · ${completedExams} tamamlandı`,
      color: 'from-indigo-500 to-violet-600',
      action: onExam,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-bold ${theme.text}`}>Modlar</h2>
        <p className={`text-sm ${theme.textMuted}`}>Pratik, antrenör veya sabit metinli sınav</p>
      </div>
      <div className="grid gap-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={m.action}
            className={`text-left p-5 rounded-2xl bg-gradient-to-r ${m.color} text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">{m.icon}</span>
              <div>
                <div className="text-lg font-bold">{m.title}</div>
                <div className="text-sm text-white/85 mt-1">{m.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className={`text-xs text-center ${theme.textMuted}`}>
        Sınav Tadında (rastgele metin) ana menüdeki yeşil butondan açılır — bu akışa dokunulmadı.
      </p>
    </div>
  );
});
