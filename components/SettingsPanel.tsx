'use client';

import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  minBPM: number;
  maxBPM: number;
  smoothing: 'low' | 'medium' | 'high';
  preferHalfDouble: boolean;
  onClose: () => void;
  onChange: (settings: {
    minBPM: number;
    maxBPM: number;
    smoothing: 'low' | 'medium' | 'high';
    preferHalfDouble: boolean;
  }) => void;
}

export default function SettingsPanel({
  minBPM: initialMin,
  maxBPM: initialMax,
  smoothing: initialSmoothing,
  preferHalfDouble: initialPreferHalfDouble,
  onClose,
  onChange,
}: SettingsPanelProps) {
  const [minBPM, setMinBPM] = useState(initialMin);
  const [maxBPM, setMaxBPM] = useState(initialMax);
  const [smoothing, setSmoothing] = useState(initialSmoothing);
  const [preferHalfDouble, setPreferHalfDouble] = useState(initialPreferHalfDouble);

  useEffect(() => {
    onChange({ minBPM, maxBPM, smoothing, preferHalfDouble });
  }, [minBPM, maxBPM, smoothing, preferHalfDouble]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* BPM Range */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              BPM Range: {minBPM} - {maxBPM}
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min BPM</label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={minBPM}
                  onChange={(e) => setMinBPM(Math.min(Number(e.target.value), maxBPM - 10))}
                  className="w-full accent-purple-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max BPM</label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={maxBPM}
                  onChange={(e) => setMaxBPM(Math.max(Number(e.target.value), minBPM + 10))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setMinBPM(60); setMaxBPM(100); }}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                Hip-Hop (60-100)
              </button>
              <button
                onClick={() => { setMinBPM(80); setMaxBPM(160); }}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                House (80-160)
              </button>
              <button
                onClick={() => { setMinBPM(140); setMaxBPM(180); }}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                D&B (140-180)
              </button>
            </div>
          </div>

          {/* Smoothing */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Smoothing
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSmoothing(level)}
                  className={`flex-1 py-2 rounded transition-colors ${
                    smoothing === level
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Higher smoothing = more stable but slower to adapt
            </p>
          </div>

          {/* Half/Double Tempo */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-gray-300">Half/Double Detection</div>
                <div className="text-xs text-gray-400 mt-1">
                  Suggest when tempo might be half or double
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferHalfDouble}
                  onChange={(e) => setPreferHalfDouble(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
            </label>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

