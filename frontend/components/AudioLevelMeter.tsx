'use client';

interface AudioLevelMeterProps {
  level: number;
}

export default function AudioLevelMeter({ level }: AudioLevelMeterProps) {
  const hasSignal = level > 5;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Audio Input</span>
        <span className={`text-sm ${hasSignal ? 'text-green-400' : 'text-red-400'}`}>
          {hasSignal ? '🎵 Signal detected' : '⚠️ No signal'}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-100 bg-gradient-to-r from-green-500 to-green-400"
          style={{ width: `${Math.min(100, level)}%` }}
        />
      </div>
    </div>
  );
}

