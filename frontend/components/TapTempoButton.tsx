'use client';

interface TapTempoButtonProps {
  onTap: () => void;
  tapCount: number;
}

export default function TapTempoButton({ onTap, tapCount }: TapTempoButtonProps) {
  return (
    <button
      onClick={onTap}
      className="relative p-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 group"
      title="Tap Tempo"
    >
      <span className="text-xl">👆</span>
      {tapCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-in zoom-in">
          {tapCount}
        </span>
      )}
    </button>
  );
}
