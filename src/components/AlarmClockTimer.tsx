interface AlarmClockTimerProps {
  seconds: number;
  totalSeconds: number;
  unlimited?: boolean;
  darkMode?: boolean;
}

export function AlarmClockTimer({
  seconds,
  totalSeconds,
  unlimited = false,
  darkMode = true,
}: AlarmClockTimerProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const progress = unlimited ? 1 : totalSeconds > 0 ? Math.max(0, Math.min(1, seconds / totalSeconds)) : 0;
  const isUrgent = !unlimited && seconds > 0 && seconds <= 30;
  const isCritical = !unlimited && seconds > 0 && seconds <= 10;

  const size = 120;
  const stroke = 3.5;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  const ringColor = isCritical
    ? '#f87171'
    : isUrgent
    ? '#fb923c'
    : darkMode
    ? '#fbbf24'
    : '#d97706';

  const glowClass = isCritical
    ? 'clock-urgent-critical'
    : isUrgent
    ? 'clock-urgent-pulse'
    : 'clock-glow-idle';

  return (
    <div
      className={`relative select-none ${glowClass}`}
      aria-live="polite"
      aria-label={unlimited ? 'Sınırsız süre' : `Kalan süre ${pad(mins)} dakika ${pad(secs)} saniye`}
    >
      {/* Alarm clock bells */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex gap-3 z-10 pointer-events-none">
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            darkMode ? 'bg-slate-800 border-amber-500/60' : 'bg-gray-100 border-amber-500/70'
          } shadow-sm`}
        />
        <div
          className={`w-3 h-3 rounded-full border-2 ${
            darkMode ? 'bg-slate-800 border-amber-500/60' : 'bg-gray-100 border-amber-500/70'
          } shadow-sm`}
        />
      </div>
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 ${
          darkMode ? 'bg-amber-500/40' : 'bg-amber-600/50'
        }`}
      />

      {/* Body */}
      <div
        className={`relative rounded-full p-1 ${
          darkMode
            ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.45),0_0_0_1px_rgba(251,191,36,0.12)]'
            : 'bg-gradient-to-br from-white via-amber-50/80 to-amber-100/60 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_8px_28px_rgba(245,158,11,0.18),0_0_0_1px_rgba(245,158,11,0.2)]'
        }`}
      >
        <div
          className={`relative rounded-full overflow-hidden ${
            darkMode
              ? 'bg-gradient-to-b from-slate-950 to-slate-900 ring-1 ring-amber-500/20'
              : 'bg-gradient-to-b from-gray-50 to-white ring-1 ring-amber-400/30'
          }`}
          style={{ width: size, height: size }}
        >
          {/* Tick marks */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const inner = r + 2;
              const outer = r + 8;
              const x1 = cx + inner * Math.cos(angle);
              const y1 = cy + inner * Math.sin(angle);
              const x2 = cx + outer * Math.cos(angle);
              const y2 = cy + outer * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={darkMode ? 'rgba(148,163,184,0.35)' : 'rgba(120,113,108,0.35)'}
                  strokeWidth={i % 3 === 0 ? 1.5 : 0.75}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Progress ring */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={darkMode ? 'rgba(51,65,85,0.8)' : 'rgba(229,231,235,0.9)'}
              strokeWidth={stroke}
            />
            {!unlimited && (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset,stroke] duration-1000 ease-linear"
                style={{
                  filter: isUrgent ? `drop-shadow(0 0 6px ${ringColor}88)` : undefined,
                }}
              />
            )}
            {unlimited && (
              <g className="clock-infinite-spin" style={{ transformOrigin: `${cx}px ${cy}px` }}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={darkMode ? '#34d399' : '#059669'}
                  strokeWidth={stroke}
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>

          {/* Digital display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
            {unlimited ? (
              <>
                <span
                  className={`text-3xl font-light leading-none ${
                    darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                >
                  ∞
                </span>
                <span
                  className={`text-[8px] uppercase tracking-[0.2em] mt-1 font-semibold ${
                    darkMode ? 'text-emerald-500/70' : 'text-emerald-600/80'
                  }`}
                >
                  sınırsız
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-px leading-none">
                  <span
                    className={`text-[1.65rem] sm:text-[1.75rem] font-mono font-bold tabular-nums tracking-tight ${
                      isCritical
                        ? 'text-red-400'
                        : isUrgent
                        ? 'text-orange-400'
                        : darkMode
                        ? 'text-amber-300'
                        : 'text-amber-700'
                    }`}
                  >
                    {pad(mins)}
                  </span>
                  <span
                    className={`text-xl font-bold pb-0.5 clock-colon-blink ${
                      isCritical
                        ? 'text-red-400/90'
                        : isUrgent
                        ? 'text-orange-400/90'
                        : darkMode
                        ? 'text-amber-500/80'
                        : 'text-amber-600/80'
                    }`}
                  >
                    :
                  </span>
                  <span
                    className={`text-[1.65rem] sm:text-[1.75rem] font-mono font-bold tabular-nums tracking-tight ${
                      isCritical
                        ? 'text-red-400'
                        : isUrgent
                        ? 'text-orange-400'
                        : darkMode
                        ? 'text-amber-300'
                        : 'text-amber-700'
                    }`}
                  >
                    {pad(secs)}
                  </span>
                </div>
                <span
                  className={`text-[7px] uppercase tracking-[0.22em] mt-1.5 font-semibold ${
                    darkMode ? 'text-slate-500' : 'text-gray-400'
                  }`}
                >
                  kalan
                </span>
              </>
            )}
          </div>

          {/* Glass highlight */}
          <div
            className={`absolute inset-x-3 top-2 h-8 rounded-full pointer-events-none ${
              darkMode
                ? 'bg-gradient-to-b from-white/[0.07] to-transparent'
                : 'bg-gradient-to-b from-white/60 to-transparent'
            }`}
          />
        </div>
      </div>

      {/* Feet */}
      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-8 pointer-events-none">
        <div
          className={`w-2 h-1.5 rounded-b-full ${
            darkMode ? 'bg-slate-700' : 'bg-amber-200/80'
          }`}
        />
        <div
          className={`w-2 h-1.5 rounded-b-full ${
            darkMode ? 'bg-slate-700' : 'bg-amber-200/80'
          }`}
        />
      </div>
    </div>
  );
}
