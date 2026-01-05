/**
 * AudioWorklet Processor for BPM Detection
 * 
 * Runs in separate audio thread for real-time processing.
 * Captures audio frames and sends to main thread for analysis.
 */

class BPMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frameSize = 2048;
    this.hopSize = 512;
    this.buffer = new Float32Array(this.frameSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!input || !input[0]) {
      return true;
    }

    // Get mono signal (mix channels if stereo)
    const channel = input[0];
    const monoSignal = new Float32Array(channel.length);
    
    if (input.length > 1) {
      // Mix to mono
      for (let i = 0; i < channel.length; i++) {
        let sum = 0;
        for (let ch = 0; ch < input.length; ch++) {
          sum += input[ch][i] || 0;
        }
        monoSignal[i] = sum / input.length;
      }
    } else {
      monoSignal.set(channel);
    }

    // Accumulate into buffer
    for (let i = 0; i < monoSignal.length; i++) {
      this.buffer[this.bufferIndex] = monoSignal[i];
      this.bufferIndex++;

      // When buffer is full, send frame and hop forward
      if (this.bufferIndex >= this.frameSize) {
        // Send frame to main thread
        this.port.postMessage({
          type: 'audioFrame',
          data: Array.from(this.buffer), // Convert to regular array for transfer
        });

        // Hop forward (overlap)
        const hopData = this.buffer.slice(this.hopSize);
        this.buffer.set(hopData);
        this.bufferIndex = this.frameSize - this.hopSize;
      }
    }

    return true;
  }
}

registerProcessor('bpm-processor', BPMProcessor);

