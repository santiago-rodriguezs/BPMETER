'use client';

interface TapTempoButtonProps {
  onTap: () => void;
  tapCount: number;
}

export default function TapTempoButton({ onTap, tapCount }: TapTempoButtonProps) {
  return (
    <button
      onClick={onTap}
      className="px-6 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-105 font-semibold relative"
    >
      <span className="text-lg">👆 Tap Tempo</span>
      {tapCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {tapCount}
        </span>
      )}
    </button>
  );
}

