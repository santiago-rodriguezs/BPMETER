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
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in" 
      onClick={onClose}
    >
      <div
        className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* BPM Range */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                BPM Range
              </label>
              <span className="text-lg font-bold text-purple-400">
                {minBPM} - {maxBPM}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Minimum</label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={minBPM}
                  onChange={(e) => setMinBPM(Math.min(Number(e.target.value), maxBPM - 10))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Maximum</label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={maxBPM}
                  onChange={(e) => setMaxBPM(Math.max(Number(e.target.value), minBPM + 10))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
            
            {/* Presets */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setMinBPM(60); setMaxBPM(100); }}
                className="flex-1 text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                Hip-Hop
              </button>
              <button
                onClick={() => { setMinBPM(80); setMaxBPM(160); }}
                className="flex-1 text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                House
              </button>
              <button
                onClick={() => { setMinBPM(140); setMaxBPM(180); }}
                className="flex-1 text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                D&B
              </button>
            </div>
          </div>

          {/* Smoothing */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Smoothing
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSmoothing(level)}
                  className={`flex-1 py-3 rounded-xl transition-all font-medium ${
                    smoothing === level
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Higher = more stable, slower to adapt
            </p>
          </div>

          {/* Half/Double Tempo */}
          <div>
            <label className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div>
                <div className="text-sm font-semibold text-gray-300">Half/Double Detection</div>
                <div className="text-xs text-gray-500 mt-1">
                  Suggest tempo corrections
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={preferHalfDouble}
                  onChange={(e) => setPreferHalfDouble(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-bold text-white transition-all shadow-lg shadow-purple-500/50 transform hover:scale-105"
        >
          Done
        </button>
      </div>
    </div>
  );
}
