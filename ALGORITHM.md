# BPM Detection Algorithm - Technical Deep Dive

## Overview

BPMETER implements a real-time tempo estimation algorithm based on onset detection and autocorrelation. This document provides a detailed explanation of the algorithm, its parameters, and how to tune it for different use cases.

## Pipeline Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐
│ Microphone  │───▶│ Preprocessing│───▶│    Onset     │───▶│Autocorr.   │
│   Input     │    │   (HPF)      │    │  Detection   │    │  Analysis  │
└─────────────┘    └──────────────┘    └──────────────┘    └────────────┘
                                                                   │
┌─────────────┐    ┌──────────────┐    ┌──────────────┐         │
│ BPM Output  │◀───│  Smoothing   │◀───│    Peak      │◀────────┘
│ (+ conf.)   │    │    (EMA)     │    │   Finding    │
└─────────────┘    └──────────────┘    └──────────────┘
```

## Stage 1: Audio Preprocessing

### Frame-based Processing

**Configuration:**
```typescript
const FRAME_SIZE = 2048;  // 46ms at 44.1kHz
const HOP_SIZE = 512;     // 12ms at 44.1kHz (75% overlap)
```

**Why these values?**
- **FRAME_SIZE (2048)**: Large enough to capture low-frequency content (kick drums ~50-100Hz) while small enough for real-time processing
- **HOP_SIZE (512)**: 75% overlap provides good temporal resolution for onset detection without excessive computation
- **Trade-offs**: Larger frames = better frequency resolution but higher latency

### Mono Conversion

Stereo signals are mixed to mono:
```typescript
monoSignal[i] = (leftChannel[i] + rightChannel[i]) / 2
```

**Rationale:** BPM is the same across channels; mono reduces computation by 50%

### High-Pass Filter

**Type:** First-order IIR high-pass filter  
**Cutoff:** 100 Hz  
**Purpose:** Emphasize percussive content (kick drums) and remove DC offset

**Implementation:**
```typescript
const rc = 1.0 / (2 * π * f_cutoff)
const dt = 1.0 / sampleRate
const α = rc / (rc + dt)

y[n] = α * (y[n-1] + x[n] - x[n-1])
```

**Why 100 Hz?**
- Kick drums typically peak at 60-80 Hz but have harmonics up to 150 Hz
- 100 Hz cutoff preserves kick energy while removing rumble
- Alternative: Use band-pass filter (80-200 Hz) for even better kick isolation

## Stage 2: Onset Detection

### Spectral Flux Method

**Concept:** Detect sudden increases in energy, which indicate note onsets (beats)

**Simplified Implementation:**
```typescript
energy[n] = sqrt(Σ(sample[i]²) / N)
flux[n] = max(0, energy[n] - energy[n-1])
```

**Why simplified?**
- Full spectral flux requires FFT, which is computationally expensive
- Energy-based method is 10x faster and sufficient for tempo detection
- Focus on percussive music where energy spikes correlate with beats

**Advanced Alternative:**
For better accuracy with complex music, implement full spectral flux:
```typescript
FFT(frame) → spectrum
flux = Σ max(0, |spectrum[n]| - |spectrum[n-1]|)
```

### Onset History

**Window:** 8 seconds  
**Why 8 seconds?**
- Autocorrelation needs multiple beat cycles to find periodicity
- At 120 BPM: 8 seconds = 16 beats (sufficient for strong correlation)
- At 80 BPM: 8 seconds = 10.6 beats (acceptable minimum)

**Memory requirement:**
```
history_length = (HISTORY_SECONDS × sampleRate) / HOP_SIZE
                = (8 × 44100) / 512
                ≈ 689 samples (~3 KB)
```

## Stage 3: Autocorrelation

### Concept

Autocorrelation measures how similar a signal is to a time-shifted version of itself:

```
R(lag) = Σ signal[i] × signal[i + lag]
```

For periodic signals (like beats), peaks in R(lag) occur at multiples of the period.

### Implementation

**Search Range:**
```typescript
min_lag = (60 × sampleRate) / (maxBPM × HOP_SIZE)
max_lag = (60 × sampleRate) / (minBPM × HOP_SIZE)
```

**Example (80-160 BPM at 44.1kHz, HOP=512):**
```
min_lag = (60 × 44100) / (160 × 512) ≈ 32 samples
max_lag = (60 × 44100) / (80 × 512) ≈ 64 samples
```

**Normalized Autocorrelation:**
```typescript
R(lag) = Σ(signal[i] × signal[i+lag]) / count
```

**Complexity:** O(n × lag_range)  
- n = history length (~689)
- lag_range = max_lag - min_lag (~32)
- Total: ~22K operations per estimation (every 8 frames)

### Peak Finding

**Goal:** Find the lag with highest correlation (= tempo period)

```typescript
for (lag = min_lag; lag < max_lag; lag++) {
  score = autocorrelation(lag)
  if (score > best_score) {
    second_best = best
    best = score
  }
}
```

**Confidence Metric:**
```typescript
confidence = ((best - second_best) / second_best) × 100
```

**Interpretation:**
- High confidence (>70%): Clear periodic pattern, one dominant tempo
- Medium confidence (30-70%): Multiple tempo candidates, ambiguous
- Low confidence (<30%): No clear periodicity, random signal

## Stage 4: BPM Calculation

### Lag to BPM Conversion

```typescript
BPM = (60 × sampleRate) / (lag × HOP_SIZE)
```

**Example:**
- lag = 48 samples
- sampleRate = 44100 Hz
- HOP_SIZE = 512
- BPM = (60 × 44100) / (48 × 512) = 108.0 BPM

**Precision:**
- Internal: Full floating-point (e.g., 108.0234375)
- Display: 1 decimal place (108.0)

### Half/Double Tempo Detection

**Problem:** Autocorrelation can lock onto half or double tempo (e.g., detecting 120 instead of 60, or 60 instead of 120)

**Solution:** Check if second-best peak is near half/double of best:

```typescript
half = best_bpm / 2
double = best_bpm × 2

if (|second_best_bpm - half| < 3 && half >= minBPM) {
  suggest half
}
if (|second_best_bpm - double| < 3 && double <= maxBPM) {
  suggest double
}
```

**Heuristics:**
- BPM > 150: Likely double (suggest ÷2)
- BPM < 90: Likely half (suggest ×2)
- Genre context helps (House is typically 120-130, not 240-260)

## Stage 5: Temporal Smoothing

### Exponential Moving Average (EMA)

**Purpose:** Reduce jitter in BPM output while maintaining responsiveness

**Formula:**
```typescript
BPM_smoothed = α × BPM_new + (1 - α) × BPM_old
```

**Alpha values:**
- Low smoothing: α = 0.3 (fast response, more jitter)
- Medium smoothing: α = 0.15 (balanced, **recommended**)
- High smoothing: α = 0.05 (very stable, slow to adapt)

**Trade-off:**
- Lower α: More stable but slower to track tempo changes
- Higher α: Faster adaptation but more fluctuation

### Hysteresis

**Problem:** Small confidence fluctuations cause BPM to jump back and forth

**Solution:** Only update BPM if:
```typescript
(|BPM_new - BPM_current| > threshold) OR (confidence > high_threshold)
```

**Values:**
- threshold = 2 BPM
- high_threshold = 70%

**Effect:** BPM won't change unless it's significantly different or we're very confident

## Stage 6: Stability Metrics

### Variance-based Stability

**Concept:** Track recent BPM history and measure consistency

```typescript
recent = last_10_BPM_values
mean = average(recent)
variance = Σ(BPM - mean)² / N
stdDev = sqrt(variance)
stability = max(0, 100 - stdDev × 10)
```

**Interpretation:**
- stdDev < 1: Very stable (stability ≈ 90-100%)
- stdDev = 5: Moderate (stability ≈ 50%)
- stdDev > 10: Unstable (stability ≈ 0%)

**Visual feedback:**
- Green indicator: Stable (>60%)
- Yellow indicator: Detecting (30-60%)
- No indicator: Uncertain (<30%)

## Parameter Tuning Guide

### For Different Musical Genres

**Hip-Hop (60-100 BPM):**
```typescript
minBPM: 60
maxBPM: 100
smoothing: 'high'  // Slower tempos need more stability
HISTORY_SECONDS: 10  // Longer beats need more history
```

**House/Techno (120-130 BPM):**
```typescript
minBPM: 80
maxBPM: 160
smoothing: 'medium'  // Default, works great
HISTORY_SECONDS: 8
```

**Drum & Bass (160-180 BPM):**
```typescript
minBPM: 140
maxBPM: 180
smoothing: 'low'  // Fast tempos benefit from quick response
HISTORY_SECONDS: 6  // Shorter window for fast beats
```

### For Different Audio Quality

**High-quality audio (studio, DJ mixer):**
```typescript
smoothing: 'low'
MIN_CONFIDENCE: 40  // Can trust lower confidence
```

**Poor audio (phone mic, noisy environment):**
```typescript
smoothing: 'high'
MIN_CONFIDENCE: 50  // Need higher confidence to update
HIGH_PASS_FREQ: 120  // More aggressive filtering
```

### For Different Use Cases

**DJ beatmatching (needs precision):**
```typescript
smoothing: 'low'
BPM_display_precision: 2  // Show 120.34 BPM
hysteresis_threshold: 0.5  // Update more frequently
```

**Fitness tracking (needs stability):**
```typescript
smoothing: 'high'
BPM_display_precision: 0  // Show 120 BPM
hysteresis_threshold: 5  // Only update on big changes
```

## Advanced Optimizations

### Potential Improvements

1. **Comb Filter Bank**: Instead of autocorrelation, use a bank of resonant filters tuned to specific BPMs. Faster and more accurate.

2. **Adaptive History Window**: Use shorter window for fast tempos, longer for slow tempos.

3. **Beat Phase Tracking**: Once BPM is stable, track the phase of individual beats for precise synchronization.

4. **Multi-resolution Analysis**: Run detection at multiple time scales and combine results.

5. **Machine Learning**: Train a neural network to classify onset patterns → BPM directly.

### Performance Optimization

**Current bottleneck:** Autocorrelation (O(n²))

**Optimization via FFT:**
```
Autocorrelation in frequency domain:
R(lag) = IFFT(FFT(signal) × conj(FFT(signal)))

Complexity: O(n log n) instead of O(n²)
```

**Trade-off:** FFT overhead is only worth it for very long history windows (>2000 samples)

## Algorithm Validation

### Test Cases

1. **Pure 120 BPM metronome**: Should detect 120.0 ± 0.1 BPM with >90% confidence
2. **Music with tempo change**: Should adapt within 3-5 seconds
3. **Complex polyrhythm**: May show lower confidence, but stable reading
4. **No audio / white noise**: Should show 0% confidence, maintain last reading

### Known Limitations

1. **Tempo changes**: 3-8 second lag to adapt (depends on smoothing)
2. **Rubato / free time**: Will show low confidence
3. **Triplets / swing**: May detect underlying straight beat, not swing feel
4. **Very fast tempos (>180)**: May detect half tempo
5. **Very slow tempos (<60)**: May detect double tempo

## References

- **Onset Detection**: "Evaluating the Online Capabilities of Onset Detection Methods" - Bello et al.
- **Tempo Estimation**: "Tempo and Beat Estimation of Musical Signals" - Scheirer (1998)
- **Autocorrelation**: "A Tutorial on Onset Detection in Music Signals" - Dixon (2006)

---

**For questions or contributions, see README.md**

