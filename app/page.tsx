'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, AudioEngineState } from '@/lib/audio/audio-engine';
import { BPMResult } from '@/lib/audio/bpm-estimator';
import { TapTempo, TapTempoResult } from '@/lib/audio/tap-tempo';
import SettingsPanel from '@/components/SettingsPanel';
import TapTempoButton from '@/components/TapTempoButton';
import BPMDisplay from '@/components/BPMDisplay';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import AudioLevelMeter from '@/components/AudioLevelMeter';

export default function Home() {
  const [engineState, setEngineState] = useState<AudioEngineState>('idle');
  const [bpmResult, setBpmResult] = useState<BPMResult>({ bpm: 0, confidence: 0, stable: false });
  const [tapResult, setTapResult] = useState<TapTempoResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);

  // Settings
  const [minBPM, setMinBPM] = useState(80);
  const [maxBPM, setMaxBPM] = useState(160);
  const [smoothing, setSmoothing] = useState<'low' | 'medium' | 'high'>('medium');
  const [preferHalfDouble, setPreferHalfDouble] = useState(true);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const tapTempoRef = useRef<TapTempo | null>(null);

  useEffect(() => {
    // Check browser support
    const support = AudioEngine.isSupported();
    if (!support.supported) {
      setError(support.message || 'Browser not supported');
    } else if (support.message) {
      setBrowserWarning(support.message);
    }

    // Initialize tap tempo
    tapTempoRef.current = new TapTempo();

    // Register service worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('SW registration failed:', error);
        });
      });
    }

    // Cleanup on unmount
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  const handleStart = async () => {
    if (engineState === 'listening') {
      // Stop
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
        audioEngineRef.current = null;
      }
      return;
    }

    setError(null);

    // Create audio engine
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine({
        onStateChange: setEngineState,
        onBPMUpdate: setBpmResult,
        onError: setError,
        onAudioLevel: setAudioLevel,
      });
    }

    try {
      await audioEngineRef.current.start({
        minBPM,
        maxBPM,
        smoothing,
        preferHalfDouble,
        sampleRate: 44100,
      });
    } catch (err) {
      console.error('Failed to start audio engine:', err);
    }
  };

  const handleSettingsChange = (settings: {
    minBPM: number;
    maxBPM: number;
    smoothing: 'low' | 'medium' | 'high';
    preferHalfDouble: boolean;
  }) => {
    setMinBPM(settings.minBPM);
    setMaxBPM(settings.maxBPM);
    setSmoothing(settings.smoothing);
    setPreferHalfDouble(settings.preferHalfDouble);

    // Update engine if running
    if (audioEngineRef.current) {
      audioEngineRef.current.updateConfig(settings);
    }
  };

  const handleTap = () => {
    if (tapTempoRef.current) {
      const result = tapTempoRef.current.tap();
      if (result) {
        setTapResult(result);
      }
    }
  };

  const handleReset = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.reset();
    }
    if (tapTempoRef.current) {
      tapTempoRef.current.reset();
    }
    setBpmResult({ bpm: 0, confidence: 0, stable: false });
    setTapResult(null);
  };

  const isListening = engineState === 'listening';
  const hasSignal = audioLevel > 5;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 flex flex-col">
      {/* Header */}
      <header className="text-center mb-8 mt-4">
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          BPMETER
        </h1>
        <p className="text-gray-400 text-sm">By Santo & Twilight</p>
      </header>

      {/* Browser Warning */}
      {browserWarning && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4 text-sm text-yellow-200">
          ⚠️ {browserWarning}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
          <p className="text-red-200 font-semibold">Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {/* BPM Display */}
        <BPMDisplay
          bpm={bpmResult.bpm}
          stable={bpmResult.stable}
          isListening={isListening}
          hasSignal={hasSignal}
          suggestedMultiplier={bpmResult.suggestedMultiplier}
        />

        {/* Confidence & Audio Level */}
        <div className="w-full max-w-md space-y-3 mb-8">
          <ConfidenceMeter confidence={bpmResult.confidence} stable={bpmResult.stable} />
          {isListening && <AudioLevelMeter level={audioLevel} />}
        </div>

        {/* Tap Tempo Result */}
        {tapResult && tapResult.bpm > 0 && (
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4 mb-4 text-center">
            <p className="text-sm text-purple-300 mb-1">Tap Tempo</p>
            <p className="text-3xl font-bold text-purple-200">
              {tapResult.bpm} <span className="text-xl">BPM</span>
            </p>
            <p className="text-xs text-purple-400 mt-1">
              {tapResult.taps} taps • {tapResult.confidence}% confidence
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleStart}
            disabled={engineState === 'requesting'}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {engineState === 'requesting' && '⏳ Requesting...'}
            {engineState === 'listening' && '⏹ Stop'}
            {engineState === 'idle' && '🎤 Start Listening'}
            {engineState === 'error' && '🔄 Retry'}
          </button>

          <TapTempoButton
            onTap={handleTap}
            tapCount={tapTempoRef.current?.getTapCount() || 0}
          />
        </div>

        {/* Secondary Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            🔄 Reset
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {engineState === 'idle' && 'Press Start to begin BPM detection'}
          {engineState === 'requesting' && 'Requesting microphone permission...'}
          {engineState === 'listening' && !hasSignal && '⚠️ No audio signal detected'}
          {engineState === 'listening' && hasSignal && bpmResult.confidence < 30 && '🎵 Analyzing...'}
          {engineState === 'listening' && hasSignal && bpmResult.confidence >= 30 && '✅ Detecting BPM'}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          minBPM={minBPM}
          maxBPM={maxBPM}
          smoothing={smoothing}
          preferHalfDouble={preferHalfDouble}
          onClose={() => setShowSettings(false)}
          onChange={handleSettingsChange}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-8">
        <p>For best results: place device near speaker, reduce background noise</p>
        <p className="mt-1">Works best with music that has a strong kick drum</p>
      </footer>
    </main>
  );
}

