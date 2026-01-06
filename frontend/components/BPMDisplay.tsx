'use client';

interface BPMDisplayProps {
  bpm: number;
  stable: boolean;
  isListening: boolean;
  hasSignal: boolean;
  suggestedMultiplier?: number;
}

export default function BPMDisplay({ bpm, stable, isListening, hasSignal, suggestedMultiplier }: BPMDisplayProps) {
  const displayBPM = bpm > 0 ? bpm.toFixed(1) : '---';
  
  return (
    <div className="mb-6 text-center">
      <div className="relative">
        <div className={`text-9xl font-bold transition-all ${
          stable ? 'text-green-400' : 'text-purple-300'
        }`}>
          {displayBPM}
        </div>
        <div className="text-3xl text-gray-400 mt-2">BPM</div>
        
        {/* Stability Indicator */}
        {isListening && hasSignal && (
          <div className="absolute -right-4 top-1/2 -translate-y-1/2">
            {stable ? (
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" title="Stable" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse" title="Detecting..." />
            )}
          </div>
        )}
        
        {/* Multiplier Suggestion */}
        {suggestedMultiplier && (
          <div className="mt-3 text-sm text-orange-400 bg-orange-900/30 border border-orange-600 rounded px-3 py-1 inline-block">
            {suggestedMultiplier === 2 ? '×2 suggested (double tempo?)' : '÷2 suggested (half tempo?)'}
          </div>
        )}
      </div>
    </div>
  );
}

