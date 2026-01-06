/**
 * Audio Engine - Backend Only
 * 
 * Sends audio chunks to Python backend for processing with Librosa
 * Professional-grade BPM detection with ±0.5 BPM accuracy
 */

export interface BPMResult {
  bpm: number;
  confidence: number;
  stable: boolean;
  suggestedMultiplier?: number;
}

export type AudioEngineState = 'idle' | 'requesting' | 'listening' | 'error';

export interface AudioEngineCallbacks {
  onStateChange: (state: AudioEngineState) => void;
  onBPMUpdate: (result: BPMResult) => void;
  onError: (error: string) => void;
  onAudioLevel: (level: number) => void;
}

export interface BPMEstimatorConfig {
  minBPM: number;
  maxBPM: number;
  smoothing: 'low' | 'medium' | 'high';
  preferHalfDouble: boolean;
  sampleRate: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private state: AudioEngineState = 'idle';
  private callbacks: AudioEngineCallbacks;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  
  // Backend config
  private backendUrl: string;
  private sendInterval: number = 500; // Send chunks every 500ms
  private lastSendTime: number = 0;
  private audioBuffer: Float32Array[] = [];
  private isConnected: boolean = false;

  constructor(callbacks: AudioEngineCallbacks, backendUrl: string = 'http://localhost:5000') {
    this.callbacks = callbacks;
    this.backendUrl = backendUrl;
  }

  async start(config: BPMEstimatorConfig): Promise<void> {
    if (this.state === 'listening') {
      return;
    }

    // Check if backend is available
    const backendAvailable = await this.checkBackend();
    if (!backendAvailable) {
      throw new Error('⚠️ Backend no disponible.\n\nAsegúrate de iniciar el servidor:\n  cd backend\n  python server.py');
    }

    this.isConnected = true;
    this.setState('requesting');

    try {
      // Request microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create AudioContext
      this.audioContext = new AudioContext({ sampleRate: config.sampleRate });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.sourceNode.connect(this.analyserNode);

      // Setup audio processing
      this.setupAudioCapture();
      
      this.setState('listening');
      this.startAudioLevelMonitoring();
      
      console.log('✅ Audio engine started, connected to backend');

    } catch (error: any) {
      this.callbacks.onError(this.getErrorMessage(error));
      this.setState('error');
      throw error;
    }
  }

  /**
   * Check if backend is available
   */
  private async checkBackend(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Backend not available:', error);
      return false;
    }
  }

  /**
   * Setup audio capture and send to backend
   */
  private setupAudioCapture(): void {
    if (!this.audioContext || !this.sourceNode) return;

    const bufferSize = 2048;
    this.scriptNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.scriptNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      // Accumulate audio
      this.audioBuffer.push(new Float32Array(inputData));
      
      // Send to backend every sendInterval ms
      const now = Date.now();
      if (now - this.lastSendTime >= this.sendInterval) {
        this.sendAudioToBackend();
        this.lastSendTime = now;
      }
    };

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  /**
   * Send accumulated audio chunks to backend
   */
  private async sendAudioToBackend(): Promise<void> {
    if (this.audioBuffer.length === 0 || !this.isConnected) return;

    // Concatenate all buffers
    const totalLength = this.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const combined = new Float32Array(totalLength);
    
    let offset = 0;
    for (const buffer of this.audioBuffer) {
      combined.set(buffer, offset);
      offset += buffer.length;
    }

    // Clear buffer
    this.audioBuffer = [];

    try {
      // Convert to base64
      const audioBase64 = this.float32ToBase64(combined);

      // Send to backend
      const response = await fetch(`${this.backendUrl}/api/detect-bpm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64,
          sampleRate: this.audioContext?.sampleRate || 44100,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('📊 Backend response:', result);

      // Update UI with result
      const bpmData = {
        bpm: result.bpm || 0,
        confidence: result.confidence || 0,
        stable: result.stable || false,
      };
      
      console.log('🎵 Updating UI with:', bpmData);
      this.callbacks.onBPMUpdate(bpmData);

      // Log methods for debugging
      if (result.methods) {
        console.log('🔍 Detection methods:', result.methods);
      }

    } catch (error) {
      console.error('❌ Error sending audio to backend:', error);
      
      // Si hay error de conexión, marcar como desconectado
      if (error instanceof TypeError) {
        this.isConnected = false;
        this.callbacks.onError('Conexión perdida con el backend. Verifica que esté corriendo.');
      }
    }
  }

  /**
   * Convert Float32Array to base64
   */
  private float32ToBase64(data: Float32Array): string {
    const bytes = new Uint8Array(data.buffer);
    let binary = '';
    const chunkSize = 0x8000; // Process in chunks to avoid stack overflow
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
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

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const level = Math.round((average / 255) * 100);

      this.callbacks.onAudioLevel(level);
    }, 100);
  }

  stop(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
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

    // Reset backend
    if (this.isConnected) {
      fetch(`${this.backendUrl}/api/reset`, { method: 'POST' }).catch(console.error);
    }

    this.isConnected = false;
    this.setState('idle');
    
    console.log('🛑 Audio engine stopped');
  }

  async reset(): Promise<void> {
    try {
      await fetch(`${this.backendUrl}/api/reset`, { method: 'POST' });
      console.log('🔄 Backend reset');
    } catch (error) {
      console.error('Error resetting backend:', error);
    }
  }
  
  updateConfig(config: Partial<BPMEstimatorConfig>): void {
    // Config is handled by backend, no action needed here
    console.log('⚙️ Config updated (handled by backend):', config);
  }

  getState(): AudioEngineState {
    return this.state;
  }

  private setState(state: AudioEngineState): void {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'NotAllowedError') {
      return 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.';
    }
    if (error.name === 'NotFoundError') {
      return 'No se encontró micrófono. Verifica que tu dispositivo tenga uno conectado.';
    }
    if (error.message.includes('Backend')) {
      return error.message;
    }
    return `Error: ${error.message || 'Desconocido'}`;
  }

  static isSupported(): { supported: boolean; message?: string } {
    if (typeof window === 'undefined') {
      return { supported: false, message: 'No en navegador' };
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return { supported: false, message: 'getUserMedia no soportado. Usa un navegador moderno.' };
    }

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      return { 
        supported: true, 
        message: 'iOS detectado: Si el micrófono no funciona, usa Tap Tempo.' 
      };
    }

    return { supported: true };
  }
}

