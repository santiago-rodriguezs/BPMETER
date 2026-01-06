'use client';

interface AudioLevelMeterProps {
  level: number;
}

export default function AudioLevelMeter({ level }: AudioLevelMeterProps) {
  const hasSignal = level > 5;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Audio Input</span>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasSignal ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-xs ${hasSignal ? 'text-green-400' : 'text-red-400'}`}>
            {hasSignal ? 'Signal' : 'No signal'}
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-100 bg-gradient-to-r from-green-500 to-emerald-400"
          style={{ width: `${Math.min(100, level)}%` }}
        />
      </div>
    </div>
  );
}
