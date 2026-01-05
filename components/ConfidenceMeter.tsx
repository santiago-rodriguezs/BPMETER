'use client';

interface ConfidenceMeterProps {
  confidence: number;
  stable: boolean;
}

export default function ConfidenceMeter({ confidence, stable }: ConfidenceMeterProps) {
  const getColor = () => {
    if (confidence < 30) return 'bg-red-500';
    if (confidence < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getLabel = () => {
    if (confidence < 30) return 'Uncertain';
    if (confidence < 60) return 'Detecting';
    return 'Confident';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Confidence</span>
        <span className={`text-sm font-semibold ${
          stable ? 'text-green-400' : 'text-gray-300'
        }`}>
          {confidence}% • {getLabel()}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

