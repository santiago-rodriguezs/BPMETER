'use client';

interface BPMDisplayProps {
  bpm: number;
  stable: boolean;
  isListening: boolean;
  hasSignal: boolean;
  suggestedMultiplier?: number;
}

export default function BPMDisplay({ bpm, stable, isListening, hasSignal }: BPMDisplayProps) {
  const displayBPM = bpm > 0 ? bpm.toFixed(1) : '---';
  
  return (
    <div className="mb-8 text-center relative">
      {/* Glow effect when stable */}
      {stable && (
        <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-green-500/30 to-emerald-500/30 animate-pulse" />
      )}
      
      <div className="relative">
        {/* Main BPM Number */}
        <div className="mb-2">
          <div className={`text-[8rem] md:text-[12rem] font-black leading-none tracking-tighter transition-all duration-500 ${
            stable 
              ? 'text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-400' 
              : 'text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400'
          }`}>
            {displayBPM}
          </div>
          <div className="text-2xl text-gray-500 font-light tracking-widest -mt-4">BPM</div>
        </div>
        
        {/* Stability Indicator - Minimal dot */}
        {isListening && hasSignal && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-2 h-2 rounded-full ${
              stable ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-ping'
            }`} />
            <span className={`text-xs ${stable ? 'text-green-400' : 'text-yellow-400'}`}>
              {stable ? 'Stable' : 'Detecting'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
