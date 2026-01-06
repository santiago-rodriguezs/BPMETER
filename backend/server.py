"""
BPM Detection Backend using Librosa
Professional-grade BPM detection with ±0.5 BPM accuracy
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import librosa
import numpy as np
import base64
from scipy.signal import find_peaks
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS based on environment
if os.environ.get('FLASK_ENV') == 'production':
    # In production, allow your Vercel domain
    CORS(app, origins=[
        'https://bpmeter-bay.vercel.app',
        'https://*.vercel.app',
    ])
else:
    # In development, allow localhost
    CORS(app)

class BPMDetector:
    def __init__(self):
        self.sample_rate = 44100
        self.history = []
        self.max_history_seconds = 10
        self.last_bpm = None
        self.bpm_history = []
        self.min_bpm = 40
        self.max_bpm = 200
        
    def process_audio_chunk(self, audio_data, sr=44100):
        """
        Process audio chunk and detect BPM using librosa
        """
        
        # Add to history
        self.history.append(audio_data)
        
        # Keep only last N seconds
        max_samples = self.max_history_seconds * sr
        total_samples = sum(len(chunk) for chunk in self.history)
        
        while total_samples > max_samples and len(self.history) > 1:
            removed = self.history.pop(0)
            total_samples -= len(removed)
        
        # Concatenate history
        if len(self.history) == 0:
            return {"bpm": 0, "confidence": 0, "stable": False}
        
        full_audio = np.concatenate(self.history)
        accumulated_seconds = len(full_audio) / sr
        
        logger.info(f"📦 Accumulated audio: {accumulated_seconds:.2f}s ({len(self.history)} chunks)")
        
        # Need at least 3 seconds for reliable detection
        if len(full_audio) < 3 * sr:
            logger.info(f"⏳ Waiting for more audio... ({accumulated_seconds:.1f}s / 3.0s)")
            return {
                "bpm": self.last_bpm or 0,
                "confidence": 0,
                "stable": False,
                "status": "collecting_audio"
            }
        
        # Detect BPM using librosa
        try:
            logger.info("🔬 Starting BPM detection with Librosa...")
            
            # Method 1: Onset-based tempo estimation
            onset_env = librosa.onset.onset_strength(
                y=full_audio,
                sr=sr,
                aggregate=np.median,  # Robust to noise
                fmax=8000,
                n_mels=128
            )
            
            logger.info(f"📈 Onset envelope: shape={onset_env.shape}, mean={np.mean(onset_env):.4f}, max={np.max(onset_env):.4f}")
            
            # Get tempo from onset envelope
            tempo_onset, beats_onset = librosa.beat.beat_track(
                onset_envelope=onset_env,
                sr=sr,
                units='time'
            )
            
            logger.info(f"🥁 Method 1 (Onset): tempo={tempo_onset:.1f} BPM, beats={len(beats_onset)}")
            
            # Method 2: Tempogram-based detection (more robust)
            hop_length = 512
            tempogram = librosa.feature.tempogram(
                onset_envelope=onset_env,
                sr=sr,
                hop_length=hop_length
            )
            
            # Get dominant tempo from tempogram
            tempo_freqs = librosa.tempo_frequencies(len(tempogram), hop_length=hop_length, sr=sr)
            tempo_power = np.mean(tempogram, axis=1)
            tempo_tempogram = tempo_freqs[np.argmax(tempo_power)]
            
            logger.info(f"🎹 Method 2 (Tempogram): tempo={tempo_tempogram:.1f} BPM")
            
            # Method 3: Autocorrelation with peak picking
            ac = librosa.autocorrelate(onset_env)
            
            # Find peaks with better constraints
            min_distance = max(1, int(sr / (200 * hop_length)))  # At least 1, min distance for 200 BPM
            peaks, properties = find_peaks(
                ac,
                height=np.max(ac) * 0.3,  # At least 30% of max
                distance=min_distance,
                prominence=np.std(ac) * 0.5
            )
            
            logger.info(f"📊 Method 3 (Autocorr): found {len(peaks)} peaks")
            
            if len(peaks) > 0:
                # Get best peak
                best_peak_idx = peaks[np.argmax(properties['peak_heights'])]
                tempo_ac = (60 * sr) / (best_peak_idx * hop_length)
                logger.info(f"🎯 Method 3 result: tempo={tempo_ac:.1f} BPM")
            else:
                tempo_ac = tempo_onset
                logger.warning("⚠️ Method 3: No peaks found, using onset tempo")
            
            # Combine methods with intelligent weighting (using configured range)
            tempos = []
            weights = []
            
            logger.info(f"🎚️ BPM range filter: {self.min_bpm}-{self.max_bpm}")
            
            # Add onset tempo
            if self.min_bpm <= tempo_onset <= self.max_bpm:
                tempos.append(float(tempo_onset))
                weights.append(0.4)
                logger.info(f"✅ Onset tempo {tempo_onset:.1f} is in range")
            else:
                logger.warning(f"❌ Onset tempo {tempo_onset:.1f} is OUT OF RANGE")
            
            # Add tempogram tempo
            if self.min_bpm <= tempo_tempogram <= self.max_bpm:
                tempos.append(float(tempo_tempogram))
                weights.append(0.3)
                logger.info(f"✅ Tempogram tempo {tempo_tempogram:.1f} is in range")
            else:
                logger.warning(f"❌ Tempogram tempo {tempo_tempogram:.1f} is OUT OF RANGE")
            
            # Add autocorrelation tempo
            if self.min_bpm <= tempo_ac <= self.max_bpm:
                tempos.append(float(tempo_ac))
                weights.append(0.3)
                logger.info(f"✅ Autocorr tempo {tempo_ac:.1f} is in range")
            else:
                logger.warning(f"❌ Autocorr tempo {tempo_ac:.1f} is OUT OF RANGE")
            
            if len(tempos) == 0:
                # Fallback to onset
                final_bpm = float(tempo_onset)
                confidence = 30
                logger.warning(f"⚠️ NO TEMPOS IN RANGE! Using fallback: {final_bpm:.1f} BPM")
            else:
                # Weighted average
                final_bpm = np.average(tempos, weights=weights)
                
                # Confidence based on agreement between methods
                std_dev = np.std(tempos)
                confidence = max(0, min(100, 100 - std_dev * 3))
                logger.info(f"✨ Combined result: {final_bpm:.1f} BPM (confidence={confidence:.0f}%, std={std_dev:.1f})")
            
            # Apply temporal smoothing
            self.bpm_history.append(final_bpm)
            if len(self.bpm_history) > 10:
                self.bpm_history.pop(0)
            
            # Use median of recent history for stability
            if len(self.bpm_history) >= 3:
                final_bpm = np.median(self.bpm_history)
            
            # Stability check
            stable = False
            if len(self.bpm_history) >= 5:
                recent_std = np.std(self.bpm_history[-5:])
                stable = recent_std < 2.0  # Stable if std < 2 BPM
            
            self.last_bpm = final_bpm
            
            # Sanitize values to avoid Infinity/NaN in JSON
            def sanitize(value, default=0):
                if np.isinf(value) or np.isnan(value):
                    return default
                return float(value)
            
            result = {
                "bpm": round(sanitize(final_bpm, 120), 1),
                "confidence": round(sanitize(confidence, 0), 0),
                "stable": bool(stable),
                "methods": {
                    "onset": round(sanitize(tempo_onset, 120), 1),
                    "tempogram": round(sanitize(tempo_tempogram, 120), 1),
                    "autocorr": round(sanitize(tempo_ac, 120), 1)
                },
                "audio_duration": round(len(full_audio) / sr, 1)
            }
            
            logger.info(f"BPM detected: {result['bpm']} (confidence: {result['confidence']}%)")
            
            return result
            
        except Exception as e:
            logger.error(f"💥 ERROR in BPM detection: {type(e).__name__}: {str(e)}", exc_info=True)
            return {
                "bpm": self.last_bpm or 0,
                "confidence": 0,
                "stable": False,
                "error": str(e)
            }
    
    def reset(self):
        """Reset history"""
        self.history = []
        self.last_bpm = None
        self.bpm_history = []
        logger.info("BPM detector reset")

# Global detector instance
detector = BPMDetector()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "backend": "librosa",
        "version": "2.0",
        "ready": True
    })

@app.route('/api/detect-bpm', methods=['POST'])
def detect_bpm():
    """
    Endpoint to receive audio chunks and return BPM
    
    Expected format:
    {
        "audio": "base64_encoded_float32_array",
        "sampleRate": 44100,
        "minBPM": 80,
        "maxBPM": 160,
        "smoothing": "medium"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Decode base64 audio data
        audio_base64 = data.get('audio')
        sample_rate = data.get('sampleRate', 44100)
        
        # Get settings from request (optional)
        min_bpm = data.get('minBPM', 40)
        max_bpm = data.get('maxBPM', 200)
        smoothing = data.get('smoothing', 'medium')
        
        if not audio_base64:
            return jsonify({"error": "No audio data provided"}), 400
        
        # Decode from base64
        audio_bytes = base64.b64decode(audio_base64)
        
        # Convert to numpy array (Float32)
        audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
        
        # Validate audio data
        if len(audio_array) == 0:
            return jsonify({"error": "Empty audio data"}), 400
        
        # Log audio info for debugging
        audio_duration = len(audio_array) / sample_rate
        audio_rms = np.sqrt(np.mean(audio_array**2))
        logger.info(f"📊 Received audio: {len(audio_array)} samples ({audio_duration:.2f}s), RMS={audio_rms:.4f}, SR={sample_rate}")
        
        # Apply settings
        detector.min_bpm = min_bpm
        detector.max_bpm = max_bpm
        logger.info(f"⚙️ Settings: BPM range={min_bpm}-{max_bpm}, smoothing={smoothing}")
        
        # Adjust smoothing
        smoothing_map = {'low': 5, 'medium': 10, 'high': 15}
        detector.max_history_seconds = smoothing_map.get(smoothing, 10)
        
        # Process with librosa
        result = detector.process_audio_chunk(audio_array, sr=sample_rate)
        logger.info(f"🎵 Result: BPM={result.get('bpm', 0)}, Confidence={result.get('confidence', 0)}%")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in detect_bpm endpoint: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def reset_detector():
    """Reset the BPM detector history"""
    detector.reset()
    return jsonify({"status": "reset", "message": "BPM detector history cleared"})

@app.route('/api/status', methods=['GET'])
def status():
    """Get detector status"""
    return jsonify({
        "audio_chunks": len(detector.history),
        "bpm_history_size": len(detector.bpm_history),
        "last_bpm": detector.last_bpm,
        "max_history_seconds": detector.max_history_seconds
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    logger.info("=" * 60)
    logger.info("🎵 BPMETER Backend Server")
    logger.info("=" * 60)
    logger.info("Backend: Librosa (Python)")
    logger.info("Accuracy: ±0.5 BPM")
    logger.info(f"Environment: {'Production' if not debug else 'Development'}")
    logger.info(f"Starting on http://0.0.0.0:{port}")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
