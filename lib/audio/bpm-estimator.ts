/**
 * BPM Estimation Algorithm
 * 
 * Uses onset detection + autocorrelation to estimate tempo from audio signal.
 * 
 * Key parameters:
 * - FRAME_SIZE: 2048 samples (analysis window)
 * - HOP_SIZE: 512 samples (75% overlap for better temporal resolution)
 * - HISTORY_SECONDS: 8 seconds (window for autocorrelation)
 * - HIGH_PASS_FREQ: 100 Hz (emphasize kick/bass)
 * 
 * Algorithm:
 * 1. High-pass filter audio to emphasize percussive content
 * 2. Compute spectral flux (energy change between frames)
 * 3. Build onset strength signal
 * 4. Apply autocorrelation on onset history
 * 5. Find peaks in autocorrelation -> BPM candidates
 * 6. Select best candidate with confidence scoring
 * 7. Apply temporal smoothing (EMA) for stability
 */

export interface BPMResult {
  bpm: number;
  confidence: number; // 0-100
  stable: boolean;
  suggestedMultiplier?: number; // 2 for double, 0.5 for half
}

export interface BPMEstimatorConfig {
  minBPM: number;
  maxBPM: number;
  smoothing: 'low' | 'medium' | 'high';
  preferHalfDouble: boolean;
  sampleRate: number;
}

const FRAME_SIZE = 2048;
const HOP_SIZE = 512;
const HISTORY_SECONDS = 8;
const MIN_CONFIDENCE = 30; // Minimum confidence to update BPM

export class BPMEstimator {
  private config: BPMEstimatorConfig;
  private onsetHistory: number[] = [];
  private previousSpectrum: Float32Array | null = null;
  private currentBPM: number = 120;
  private bpmHistory: number[] = [];
  private frameCount: number = 0;
  private smoothingAlpha: number;
  
  // High-pass filter state (simple first-order)
  private hpState: number = 0;
  private hpAlpha: number;

  constructor(config: BPMEstimatorConfig) {
    this.config = config;
    
    // Smoothing factors
    const smoothingMap = {
      low: 0.3,
      medium: 0.15,
      high: 0.05,
    };
    this.smoothingAlpha = smoothingMap[config.smoothing];
    
    // High-pass filter coefficient (100 Hz at sample rate)
    const highPassFreq = 100;
    const rc = 1.0 / (2 * Math.PI * highPassFreq);
    const dt = 1.0 / config.sampleRate;
    this.hpAlpha = rc / (rc + dt);
  }

  /**
   * Process new audio frame
   */
  processFrame(audioData: Float32Array): BPMResult {
    this.frameCount++;
    
    // 1. Apply high-pass filter
    const filtered = this.highPassFilter(audioData);
    
    // 2. Compute spectral flux (onset strength)
    const onsetStrength = this.computeSpectralFlux(filtered);
    
    // 3. Add to history
    this.onsetHistory.push(onsetStrength);
    
    // Keep history to HISTORY_SECONDS
    const maxHistory = Math.floor((HISTORY_SECONDS * this.config.sampleRate) / HOP_SIZE);
    if (this.onsetHistory.length > maxHistory) {
      this.onsetHistory.shift();
    }
    
    // 4. Estimate BPM (every 8 frames = ~0.1 seconds)
    if (this.frameCount % 8 === 0 && this.onsetHistory.length > 50) {
      return this.estimateBPM();
    }
    
    return {
      bpm: this.currentBPM,
      confidence: this.calculateStability(),
      stable: this.bpmHistory.length > 5 && this.calculateStability() > 60,
    };
  }

  /**
   * Simple first-order high-pass filter
   */
  private highPassFilter(data: Float32Array): Float32Array {
    const filtered = new Float32Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      filtered[i] = this.hpAlpha * (this.hpState + data[i] - (i > 0 ? data[i - 1] : 0));
      this.hpState = filtered[i];
    }
    
    return filtered;
  }

  /**
   * Compute spectral flux (energy change) as onset strength
   */
  private computeSpectralFlux(data: Float32Array): number {
    // Simple energy-based approach (faster than full FFT for onset detection)
    let energy = 0;
    for (let i = 0; i < data.length; i++) {
      energy += data[i] * data[i];
    }
    energy = Math.sqrt(energy / data.length);
    
    // Flux = positive change in energy
    let flux = 0;
    if (this.previousSpectrum) {
      const prevEnergy = this.previousSpectrum[0]; // We stored just energy
      flux = Math.max(0, energy - prevEnergy);
    }
    
    this.previousSpectrum = new Float32Array([energy]);
    return flux;
  }

  /**
   * Main BPM estimation using autocorrelation
   */
  private estimateBPM(): BPMResult {
    if (this.onsetHistory.length < 50) {
      return {
        bpm: this.currentBPM,
        confidence: 0,
        stable: false,
      };
    }
    
    // Normalize onset history
    const normalized = this.normalizeSignal(this.onsetHistory);
    
    // Compute autocorrelation
    const { bpm, confidence, secondBestBPM } = this.autocorrelation(normalized);
    
    if (confidence > MIN_CONFIDENCE) {
      // Check for half/double tempo
      let finalBPM = bpm;
      let suggestedMultiplier: number | undefined;
      
      if (this.config.preferHalfDouble) {
        const result = this.checkHalfDouble(bpm, secondBestBPM);
        finalBPM = result.bpm;
        suggestedMultiplier = result.multiplier;
      }
      
      // Apply temporal smoothing (EMA)
      if (this.bpmHistory.length > 0) {
        finalBPM = this.smoothingAlpha * finalBPM + (1 - this.smoothingAlpha) * this.currentBPM;
      }
      
      // Hysteresis: only update if significantly different or high confidence
      const bpmDiff = Math.abs(finalBPM - this.currentBPM);
      if (bpmDiff > 2 || confidence > 70) {
        this.currentBPM = finalBPM;
      }
      
      this.bpmHistory.push(finalBPM);
      if (this.bpmHistory.length > 20) {
        this.bpmHistory.shift();
      }
    }
    
    return {
      bpm: Math.round(this.currentBPM * 10) / 10, // 1 decimal
      confidence: Math.round(confidence),
      stable: this.calculateStability() > 60,
      suggestedMultiplier: this.config.preferHalfDouble ? this.getSuggestedMultiplier() : undefined,
    };
  }

  /**
   * Autocorrelation on onset signal to find tempo
   */
  private autocorrelation(signal: number[]): { bpm: number; confidence: number; secondBestBPM: number } {
    const minLag = Math.floor((60 * this.config.sampleRate) / (this.config.maxBPM * HOP_SIZE));
    const maxLag = Math.floor((60 * this.config.sampleRate) / (this.config.minBPM * HOP_SIZE));
    
    let bestLag = minLag;
    let bestScore = -Infinity;
    let secondBestScore = -Infinity;
    let secondBestLag = minLag;
    
    for (let lag = minLag; lag < Math.min(maxLag, signal.length / 2); lag++) {
      let sum = 0;
      let count = 0;
      
      for (let i = 0; i < signal.length - lag; i++) {
        sum += signal[i] * signal[i + lag];
        count++;
      }
      
      const score = count > 0 ? sum / count : 0;
      
      if (score > bestScore) {
        secondBestScore = bestScore;
        secondBestLag = bestLag;
        bestScore = score;
        bestLag = lag;
      } else if (score > secondBestScore) {
        secondBestScore = score;
        secondBestLag = lag;
      }
    }
    
    // Convert lag to BPM
    const bpm = (60 * this.config.sampleRate) / (bestLag * HOP_SIZE);
    const secondBestBPM = (60 * this.config.sampleRate) / (secondBestLag * HOP_SIZE);
    
    // Confidence from peak ratio
    const confidence = secondBestScore > 0 
      ? Math.min(100, ((bestScore - secondBestScore) / secondBestScore) * 100)
      : 50;
    
    return { bpm, confidence, secondBestBPM };
  }

  /**
   * Check if half/double tempo is more likely
   */
  private checkHalfDouble(bpm: number, secondBest: number): { bpm: number; multiplier?: number } {
    const half = bpm / 2;
    const double = bpm * 2;
    
    // Check if second best is close to half or double
    if (Math.abs(secondBest - half) < 3 && half >= this.config.minBPM) {
      return { bpm: half, multiplier: 0.5 };
    }
    if (Math.abs(secondBest - double) < 3 && double <= this.config.maxBPM) {
      return { bpm: double, multiplier: 2 };
    }
    
    return { bpm };
  }

  /**
   * Calculate stability from recent BPM history
   */
  private calculateStability(): number {
    if (this.bpmHistory.length < 5) return 0;
    
    const recent = this.bpmHistory.slice(-10);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / recent.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to confidence (lower stdDev = higher confidence)
    const stability = Math.max(0, 100 - stdDev * 10);
    return stability;
  }

  /**
   * Get suggested multiplier based on recent detections
   */
  private getSuggestedMultiplier(): number | undefined {
    if (this.bpmHistory.length < 5) return undefined;
    
    const recent = this.bpmHistory.slice(-5);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    // If consistently detecting high BPM, might be double
    if (avg > 150 && avg / 2 >= this.config.minBPM) {
      return 0.5; // Suggest half
    }
    
    // If consistently detecting low BPM, might be half
    if (avg < 90 && avg * 2 <= this.config.maxBPM) {
      return 2; // Suggest double
    }
    
    return undefined;
  }

  /**
   * Normalize signal (remove DC, unit variance)
   */
  private normalizeSignal(signal: number[]): number[] {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const centered = signal.map(v => v - mean);
    
    const variance = centered.reduce((sum, val) => sum + val * val, 0) / centered.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 1e-10) return centered;
    
    return centered.map(v => v / stdDev);
  }

  updateConfig(config: Partial<BPMEstimatorConfig>) {
    this.config = { ...this.config, ...config };
    
    // Update smoothing
    if (config.smoothing) {
      const smoothingMap = { low: 0.3, medium: 0.15, high: 0.05 };
      this.smoothingAlpha = smoothingMap[config.smoothing];
    }
  }

  reset() {
    this.onsetHistory = [];
    this.previousSpectrum = null;
    this.bpmHistory = [];
    this.frameCount = 0;
    this.currentBPM = 120;
  }
}

