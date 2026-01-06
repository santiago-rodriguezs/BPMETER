'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioEngine, AudioEngineState, BPMResult } from '@/lib/audio/audio-engine';
import { TapTempo, TapTempoResult } from '@/lib/audio/tap-tempo';
import SettingsPanel from '@/components/SettingsPanel';
import TapTempoButton from '@/components/TapTempoButton';
import BPMDisplay from '@/components/BPMDisplay';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import AudioLevelMeter from '@/components/AudioLevelMeter';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function Home() {
  const [engineState, setEngineState] = useState<AudioEngineState>('idle');
  const [bpmResult, setBpmResult] = useState<BPMResult>({ bpm: 0, confidence: 0, stable: false });
  const [tapResult, setTapResult] = useState<TapTempoResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Settings
  const [minBPM, setMinBPM] = useState(80);
  const [maxBPM, setMaxBPM] = useState(160);
  const [smoothing, setSmoothing] = useState<'low' | 'medium' | 'high'>('medium');
  const [preferHalfDouble, setPreferHalfDouble] = useState(true);

  const audioEngineRef = useRef<AudioEngine | null>(null);
  const tapTempoRef = useRef<TapTempo | null>(null);

  useEffect(() => {
    const support = AudioEngine.isSupported();
    if (!support.supported) {
      setError(support.message || 'Browser not supported');
    } else if (support.message) {
      setBrowserWarning(support.message);
    }

    tapTempoRef.current = new TapTempo();
    checkBackendConnection();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('SW registration failed:', error);
        });
      });
    }

    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const handleStart = async () => {
    if (engineState === 'listening') {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
        audioEngineRef.current = null;
      }
      return;
    }

    setError(null);

    if (backendStatus === 'disconnected') {
      setError('Backend no disponible. Inicia: python server.py');
      return;
    }

    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine(
        {
          onStateChange: (state) => setEngineState(state),
          onBPMUpdate: (result) => setBpmResult(result),
          onError: (err) => setError(err),
          onAudioLevel: (level) => setAudioLevel(level),
        },
        BACKEND_URL
      );
    }

    try {
      await audioEngineRef.current.start({
        minBPM,
        maxBPM,
        smoothing,
        preferHalfDouble,
        sampleRate: 44100,
      });
    } catch (err: any) {
      console.error('Failed to start audio engine:', err);
      setError(err.message);
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

    if (audioEngineRef.current) {
      audioEngineRef.current.updateConfig(settings);
    }
  };

  // Apply half/double tempo preference (client-side adjustment)
  const getAdjustedBPM = (rawBPM: number): number => {
    if (!preferHalfDouble || rawBPM === 0) return rawBPM;

    const targetMin = minBPM;
    const targetMax = maxBPM;

    // If BPM is out of configured range, try to adjust by doubling or halving
    if (rawBPM < targetMin && rawBPM * 2 >= targetMin && rawBPM * 2 <= targetMax) {
      return rawBPM * 2; // Double it
    }
    if (rawBPM > targetMax && rawBPM / 2 >= targetMin && rawBPM / 2 <= targetMax) {
      return rawBPM / 2; // Halve it
    }

    return rawBPM;
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
    <main className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="text-center pt-8 pb-4">
          <h1 className="text-6xl font-black mb-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            BPMETER
          </h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase">Professional BPM Detection</p>
        </header>

        {/* Backend Status - Minimal */}
        {backendStatus !== 'connected' && (
          <div className="mx-auto px-4 mb-4">
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-full px-4 py-2 text-xs text-red-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Backend offline
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-md mx-auto px-4 mb-4">
            <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <BPMDisplay
            bpm={getAdjustedBPM(bpmResult.bpm)}
            stable={bpmResult.stable}
            isListening={isListening}
            hasSignal={hasSignal}
            suggestedMultiplier={bpmResult.suggestedMultiplier}
          />

          {/* Meters - Compact */}
          <div className="w-full max-w-sm space-y-3 mb-8">
            <ConfidenceMeter confidence={bpmResult.confidence} stable={bpmResult.stable} />
            {isListening && <AudioLevelMeter level={audioLevel} />}
          </div>

          {/* Tap Tempo Result - Floating */}
          {tapResult && tapResult.bpm > 0 && (
            <div className="mb-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-xs text-gray-400 mb-1">Tap Tempo</p>
              <p className="text-2xl font-bold text-purple-300">
                {tapResult.bpm} <span className="text-sm font-normal text-gray-500">BPM</span>
              </p>
            </div>
          )}

          {/* Main Control Button */}
          <button
            onClick={handleStart}
            disabled={engineState === 'requesting' || backendStatus !== 'connected'}
            className={`group relative px-12 py-5 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
              isListening
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/50'
            }`}
          >
            <span className="relative z-10">
              {engineState === 'requesting' && '⏳ Requesting...'}
              {engineState === 'listening' && '⏹ Stop'}
              {engineState === 'idle' && backendStatus === 'connected' && '🎤 Start Detection'}
              {engineState === 'idle' && backendStatus !== 'connected' && 'Backend Offline'}
              {engineState === 'error' && '🔄 Retry'}
            </span>
            {!isListening && engineState === 'idle' && backendStatus === 'connected' && (
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
            )}
          </button>

          {/* Secondary Controls - Icon Row */}
          <div className="flex gap-3 mt-6">
            <TapTempoButton
              onTap={handleTap}
              tapCount={tapTempoRef.current?.getTapCount() || 0}
            />
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              title="Settings"
            >
              <span className="text-xl">⚙️</span>
            </button>
            
            <button
              onClick={handleReset}
              className="p-4 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
              title="Reset"
            >
              <span className="text-xl">🔄</span>
            </button>
          </div>

          {/* Status Text - Minimal */}
          <div className="mt-6 text-center text-xs text-gray-500">
            {engineState === 'idle' && backendStatus === 'connected' && 'Ready to detect'}
            {engineState === 'listening' && !hasSignal && '⚠️ No signal'}
            {engineState === 'listening' && hasSignal && bpmResult.confidence < 30 && '🎵 Analyzing...'}
            {engineState === 'listening' && hasSignal && bpmResult.confidence >= 30 && '✨ Detecting'}
          </div>
        </div>

        {/* Footer - Minimal */}
        <footer className="text-center pb-6 text-xs text-gray-600">
          <p>Powered by Librosa • Santo & Twilight</p>
        </footer>
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
    </main>
  );
}
