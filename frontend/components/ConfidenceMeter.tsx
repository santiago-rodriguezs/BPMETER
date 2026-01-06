'use client';

interface ConfidenceMeterProps {
  confidence: number;
  stable: boolean;
}

export default function ConfidenceMeter({ confidence, stable }: ConfidenceMeterProps) {
  const getColor = () => {
    if (confidence < 30) return 'from-red-500 to-red-600';
    if (confidence < 60) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Confidence</span>
        <span className={`text-sm font-bold ${
          stable ? 'text-green-400' : 'text-gray-300'
        }`}>
          {confidence}%
        </span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 bg-gradient-to-r ${getColor()}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}
