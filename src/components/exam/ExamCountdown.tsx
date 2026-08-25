import { memo, useEffect } from 'react';

interface ExamCountdownProps {
  value: number;
  examTitle: string;
  onComplete: () => void;
}

export const ExamCountdown = memo(function ExamCountdown({
  value,
  examTitle,
  onComplete,
}: ExamCountdownProps) {
  useEffect(() => {
    if (value > 0) return;
    const t = setTimeout(onComplete, 400);
    return () => clearTimeout(t);
  }, [value, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95">
      <div className="text-center space-y-4">
        <p className="text-slate-400 text-sm">{examTitle}</p>
        <div className="text-8xl font-black text-indigo-400 tabular-nums animate-pulse">
          {value > 0 ? value : 'Başla!'}
        </div>
        <p className="text-slate-500 text-xs">Hazır ol...</p>
      </div>
    </div>
  );
});
