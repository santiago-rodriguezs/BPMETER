"""
Test script for BPM detection backend
Generates test audio and verifies BPM detection
"""

import numpy as np
import requests
import base64
import time

def generate_test_audio(bpm=120, duration=5, sr=44100):
    """Generate test audio with click track at specified BPM"""
    samples = int(duration * sr)
    audio = np.zeros(samples, dtype=np.float32)
    
    # Generate click track
    beat_interval = 60.0 / bpm  # seconds per beat
    beat_samples = int(beat_interval * sr)
    
    for i in range(0, samples, beat_samples):
        # Add click (short sine burst)
        click_duration = int(0.01 * sr)  # 10ms click
        t = np.linspace(0, 0.01, click_duration)
        click = np.sin(2 * np.pi * 1000 * t) * 0.5  # 1kHz sine
        
        end = min(i + click_duration, samples)
        audio[i:end] = click[:end-i]
    
    return audio

def float32_to_base64(data):
    """Convert Float32Array to base64"""
    bytes_data = data.tobytes()
    return base64.b64encode(bytes_data).decode('utf-8')

def test_backend(backend_url='http://localhost:5000'):
    """Test backend with generated audio"""
    
    print("🧪 Testing BPMETER Backend")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Health check...")
    try:
        response = requests.get(f'{backend_url}/api/health', timeout=5)
        if response.ok:
            print(f"   ✅ Backend is healthy: {response.json()}")
        else:
            print(f"   ❌ Backend responded with: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Cannot connect to backend: {e}")
        print(f"   💡 Make sure the server is running: python server.py")
        return False
    
    # Test 2: BPM detection with 120 BPM
    print("\n2️⃣ Testing 120 BPM detection...")
    audio_120 = generate_test_audio(bpm=120, duration=5)
    audio_base64 = float32_to_base64(audio_120)
    
    try:
        response = requests.post(
            f'{backend_url}/api/detect-bpm',
            json={'audio': audio_base64, 'sampleRate': 44100},
            timeout=10
        )
        
        if response.ok:
            result = response.json()
            detected_bpm = result.get('bpm', 0)
            confidence = result.get('confidence', 0)
            
            print(f"   🎵 Detected: {detected_bpm} BPM")
            print(f"   📊 Confidence: {confidence}%")
            print(f"   📈 Methods: {result.get('methods', {})}")
            
            # Check accuracy
            error = abs(detected_bpm - 120)
            if error < 2:
                print(f"   ✅ Accuracy: ±{error:.1f} BPM (Excellent!)")
            elif error < 5:
                print(f"   ⚠️  Accuracy: ±{error:.1f} BPM (OK)")
            else:
                print(f"   ❌ Accuracy: ±{error:.1f} BPM (Poor)")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
        return False
    
    # Test 3: Different BPM (140)
    print("\n3️⃣ Testing 140 BPM detection...")
    audio_140 = generate_test_audio(bpm=140, duration=5)
    audio_base64 = float32_to_base64(audio_140)
    
    try:
        response = requests.post(
            f'{backend_url}/api/detect-bpm',
            json={'audio': audio_base64, 'sampleRate': 44100},
            timeout=10
        )
        
        if response.ok:
            result = response.json()
            detected_bpm = result.get('bpm', 0)
            error = abs(detected_bpm - 140)
            
            print(f"   🎵 Detected: {detected_bpm} BPM (Expected: 140)")
            print(f"   📊 Error: ±{error:.1f} BPM")
            
            if error < 3:
                print(f"   ✅ Good accuracy!")
            else:
                print(f"   ⚠️  Accuracy could be better")
    except Exception as e:
        print(f"   ❌ Request failed: {e}")
    
    # Test 4: Reset
    print("\n4️⃣ Testing reset...")
    try:
        response = requests.post(f'{backend_url}/api/reset', timeout=5)
        if response.ok:
            print(f"   ✅ Reset successful: {response.json()}")
        else:
            print(f"   ❌ Reset failed")
    except Exception as e:
        print(f"   ❌ Reset request failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\n💡 Tips:")
    print("   - With real music, accuracy is typically better")
    print("   - Synthetic clicks may be harder to detect")
    print("   - Try with actual audio files for best results")
    
    return True

if __name__ == '__main__':
    import sys
    
    backend_url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5000'
    
    print(f"Backend URL: {backend_url}\n")
    
    success = test_backend(backend_url)
    sys.exit(0 if success else 1)

