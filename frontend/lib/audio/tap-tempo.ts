/**
 * Tap Tempo - Manual BPM calculation from user taps
 * 
 * User taps 4-16 times, we calculate intervals and compute average BPM.
 * Applies outlier rejection and smoothing for better accuracy.
 */

export interface TapTempoResult {
  bpm: number;
  taps: number;
  confidence: number; // 0-100, based on interval consistency
}

export class TapTempo {
  private tapTimes: number[] = [];
  private readonly minTaps = 4;
  private readonly maxTaps = 16;
  private readonly timeoutMs = 3000; // Reset after 3s of no taps
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * Register a tap
   */
  tap(): TapTempoResult | null {
    const now = Date.now();

    // Clear old timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Reset if last tap was too long ago
    if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > this.timeoutMs) {
      this.reset();
    }

    // Add tap
    this.tapTimes.push(now);

    // Keep only last maxTaps
    if (this.tapTimes.length > this.maxTaps) {
      this.tapTimes.shift();
    }

    // Set timeout to auto-reset
    this.timeoutId = setTimeout(() => {
      this.reset();
    }, this.timeoutMs);

    // Calculate BPM if we have enough taps
    if (this.tapTimes.length >= this.minTaps) {
      return this.calculateBPM();
    }

    return null;
  }

  /**
   * Calculate BPM from tap intervals
   */
  private calculateBPM(): TapTempoResult {
    if (this.tapTimes.length < this.minTaps) {
      return { bpm: 0, taps: this.tapTimes.length, confidence: 0 };
    }

    // Calculate intervals between taps (in ms)
    const intervals: number[] = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }

    // Remove outliers (taps that are too fast or too slow)
    const filteredIntervals = this.removeOutliers(intervals);

    if (filteredIntervals.length === 0) {
      return { bpm: 0, taps: this.tapTimes.length, confidence: 0 };
    }

    // Calculate average interval
    const avgInterval = filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;

    // Convert to BPM (60000 ms per minute)
    const bpm = 60000 / avgInterval;

    // Calculate confidence based on interval consistency
    const confidence = this.calculateConfidence(filteredIntervals, avgInterval);

    return {
      bpm: Math.round(bpm * 10) / 10, // 1 decimal
      taps: this.tapTimes.length,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Remove outliers using IQR method
   */
  private removeOutliers(intervals: number[]): number[] {
    if (intervals.length < 3) return intervals;

    const sorted = [...intervals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return intervals.filter(val => val >= lowerBound && val <= upperBound);
  }

  /**
   * Calculate confidence from interval consistency
   */
  private calculateConfidence(intervals: number[], avgInterval: number): number {
    if (intervals.length < 2) return 50;

    // Calculate coefficient of variation (stddev / mean)
    const variance = intervals.reduce((sum, val) => {
      return sum + Math.pow(val - avgInterval, 2);
    }, 0) / intervals.length;

    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgInterval;

    // Convert to confidence (lower CV = higher confidence)
    // CV < 0.05 = very consistent = 100% confidence
    // CV > 0.2 = inconsistent = 0% confidence
    const confidence = Math.max(0, Math.min(100, (1 - cv * 5) * 100));

    return confidence;
  }

  /**
   * Get number of taps recorded
   */
  getTapCount(): number {
    return this.tapTimes.length;
  }

  /**
   * Reset tap history
   */
  reset(): void {
    this.tapTimes = [];
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

