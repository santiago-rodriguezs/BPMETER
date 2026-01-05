/**
 * Audio Engine - Manages Web Audio API and microphone capture
 * 
 * Handles:
 * - Microphone permission and capture
 * - AudioContext lifecycle
 * - AudioWorklet setup (with ScriptProcessor fallback)
 * - Audio frame routing to BPM estimator
 */

import { BPMEstimator, BPMResult, BPMEstimatorConfig } from './bpm-estimator';

export type AudioEngineState = 'idle' | 'requesting' | 'listening' | 'error';

export interface AudioEngineCallbacks {
  onStateChange: (state: AudioEngineState) => void;
  onBPMUpdate: (result: BPMResult) => void;
  onError: (error: string) => void;
  onAudioLevel: (level: number) => void; // 0-100
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private bpmEstimator: BPMEstimator | null = null;
  private state: AudioEngineState = 'idle';
  private callbacks: AudioEngineCallbacks;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private useWorklet: boolean = true;

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start microphone capture and BPM detection
   */
  async start(config: BPMEstimatorConfig): Promise<void> {
    if (this.state === 'listening') {
      return;
    }

    this.setState('requesting');

    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create AudioContext
      this.audioContext = new AudioContext({ sampleRate: config.sampleRate });

      // Resume context (required for user gesture)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source node
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create analyser for audio level visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.sourceNode.connect(this.analyserNode);

      // Initialize BPM estimator
      this.bpmEstimator = new BPMEstimator(config);

      // Try AudioWorklet first, fall back to ScriptProcessor
      try {
        await this.setupAudioWorklet();
      } catch (error) {
        console.warn('AudioWorklet failed, falling back to ScriptProcessor:', error);
        this.useWorklet = false;
        this.setupScriptProcessor();
      }

      this.setState('listening');
      this.startAudioLevelMonitoring();

    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      this.callbacks.onError(errorMessage);
      this.setState('error');
      throw error;
    }
  }

  /**
   * Stop capture and cleanup
   */
  stop(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.bpmEstimator = null;
    this.setState('idle');
  }

  /**
   * Setup AudioWorklet (preferred, better performance)
   */
  private async setupAudioWorklet(): Promise<void> {
    if (!this.audioContext || !this.sourceNode) return;

    // Load worklet module
    await this.audioContext.audioWorklet.addModule('/audio-processor.js');

    // Create worklet node
    this.workletNode = new AudioWorkletNode(this.audioContext, 'bpm-processor');

    // Handle messages from worklet
    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'audioFrame' && this.bpmEstimator) {
        const frameData = new Float32Array(event.data.data);
        const result = this.bpmEstimator.processFrame(frameData);
        this.callbacks.onBPMUpdate(result);
      }
    };

    // Connect: source -> worklet
    this.sourceNode.connect(this.workletNode);
  }

  /**
   * Setup ScriptProcessor (fallback for older browsers)
   */
  private setupScriptProcessor(): void {
    if (!this.audioContext || !this.sourceNode) return;

    const bufferSize = 2048;
    this.scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.scriptNode.onaudioprocess = (event) => {
      if (!this.bpmEstimator) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const result = this.bpmEstimator.processFrame(inputData);
      this.callbacks.onBPMUpdate(result);
    };

    // Connect: source -> scriptProcessor -> destination (muted)
    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  /**
   * Monitor audio input level
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate average level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const level = Math.round((average / 255) * 100);

      this.callbacks.onAudioLevel(level);
    }, 100);
  }

  /**
   * Update BPM estimator configuration
   */
  updateConfig(config: Partial<BPMEstimatorConfig>): void {
    if (this.bpmEstimator) {
      this.bpmEstimator.updateConfig(config);
    }
  }

  /**
   * Reset BPM estimator state
   */
  reset(): void {
    if (this.bpmEstimator) {
      this.bpmEstimator.reset();
    }
  }

  getState(): AudioEngineState {
    return this.state;
  }

  private setState(state: AudioEngineState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Microphone permission denied. Please allow microphone access in your browser settings.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No microphone found. Please connect a microphone and try again.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Microphone is already in use by another application.';
    }
    if (error.name === 'OverconstrainedError') {
      return 'Could not start microphone with requested settings.';
    }
    return `Failed to start microphone: ${error.message || 'Unknown error'}`;
  }

  /**
   * Check if Web Audio API is supported
   */
  static isSupported(): { supported: boolean; message?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, message: 'Not in browser environment' };
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false, message: 'getUserMedia not supported. Please use a modern browser.' };
    }

    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      return { supported: false, message: 'Web Audio API not supported. Please use a modern browser.' };
    }

    // Check for iOS Safari limitations
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return { 
        supported: true, 
        message: 'iOS detected: Audio capture may have limitations. Tap Tempo is recommended as fallback.' 
      };
    }

    return { supported: true };
  }
}

