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
    // Check browser support
    const support = AudioEngine.isSupported();
    if (!support.supported) {
      setError(support.message || 'Browser not supported');
    } else if (support.message) {
      setBrowserWarning(support.message);
    }

    // Initialize tap tempo
    tapTempoRef.current = new TapTempo();

    // Check backend status
    checkBackendConnection();

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

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, { method: 'GET' });
      if (response.ok) {
        setBackendStatus('connected');
        console.log('✅ Backend connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
      console.error('❌ Backend not available:', error);
    }
  };

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

    // Verify backend is available
    if (backendStatus === 'disconnected') {
      setError('⚠️ Backend no está disponible.\n\nInicia el servidor:\n  cd backend\n  python server.py');
      return;
    }

    // Create audio engine
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine(
        {
          onStateChange: (state) => {
            console.log('🔄 State changed:', state);
            setEngineState(state);
          },
          onBPMUpdate: (result) => {
            console.log('🎵 BPM UPDATE CALLBACK CALLED:', result);
            setBpmResult(result);
          },
          onError: (err) => {
            console.log('❌ Error:', err);
            setError(err);
          },
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
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
        <p className="text-xs text-purple-300 mt-1">Powered by Librosa (Python Backend)</p>
      </header>

      {/* Backend Status Indicator */}
      <div className="max-w-2xl mx-auto w-full mb-4">
        <div className={`text-xs text-center py-2 rounded-lg ${
          backendStatus === 'connected' 
            ? 'bg-green-900/30 text-green-300' 
            : backendStatus === 'disconnected'
            ? 'bg-red-900/30 text-red-300'
            : 'bg-yellow-900/30 text-yellow-300'
        }`}>
          {backendStatus === 'connected' && '✅ Backend conectado - Listo para detección'}
          {backendStatus === 'disconnected' && '❌ Backend desconectado - Inicia el servidor Python'}
          {backendStatus === 'checking' && '⏳ Verificando backend...'}
          {backendStatus === 'disconnected' && (
            <button 
              onClick={checkBackendConnection}
              className="ml-2 underline hover:text-red-100"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>

      {/* Browser Warning */}
      {browserWarning && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4 text-sm text-yellow-200 max-w-2xl mx-auto w-full">
          ⚠️ {browserWarning}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4 max-w-2xl mx-auto w-full">
          <p className="text-red-200 font-semibold">Error</p>
          <p className="text-red-300 text-sm mt-1 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        {/* Debug Info */}
        <div className="text-xs text-yellow-300 mb-2">
          DEBUG: BPM={bpmResult.bpm} | Conf={bpmResult.confidence}% | Stable={bpmResult.stable ? 'YES' : 'NO'}
        </div>

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
              {tapResult.taps} taps • {tapResult.confidence}% confianza
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleStart}
            disabled={engineState === 'requesting' || backendStatus !== 'connected'}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {engineState === 'requesting' && '⏳ Solicitando...'}
            {engineState === 'listening' && '⏹ Detener'}
            {engineState === 'idle' && backendStatus === 'connected' && '🎤 Iniciar Detección'}
            {engineState === 'idle' && backendStatus !== 'connected' && '⚠️ Backend Offline'}
            {engineState === 'error' && '🔄 Reintentar'}
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
            ⚙️ Configuración
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
          >
            🔄 Resetear
          </button>
        </div>

        {/* Status Text */}
        <div className="mt-6 text-center text-sm text-gray-400">
          {engineState === 'idle' && backendStatus === 'connected' && 'Presiona Iniciar para comenzar'}
          {engineState === 'idle' && backendStatus !== 'connected' && 'Esperando backend...'}
          {engineState === 'requesting' && 'Solicitando permiso de micrófono...'}
          {engineState === 'listening' && !hasSignal && '⚠️ No se detecta señal de audio'}
          {engineState === 'listening' && hasSignal && bpmResult.confidence < 30 && '🎵 Analizando...'}
          {engineState === 'listening' && hasSignal && bpmResult.confidence >= 30 && '✅ Detectando BPM'}
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
        <p>🐍 Detección profesional con Librosa (Python) - Precisión ±0.5 BPM</p>
        <p className="mt-1">Coloca el dispositivo cerca del altavoz para mejores resultados</p>
      </footer>
    </main>
  );
}
