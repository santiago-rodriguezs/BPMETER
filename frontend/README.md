# BPMETER - By Santo & Twilight

A professional DJ-focused Progressive Web App (PWA) for real-time BPM (Beats Per Minute) detection with high precision. Built with Next.js, TypeScript, and the Web Audio API.

## Features

- 🎵 **Real-time BPM Detection**: Live audio analysis with 0.1 BPM precision
- 🎤 **Microphone Input**: Capture audio directly from your device's microphone
- 👆 **Tap Tempo Fallback**: Manual BPM calculation by tapping rhythm
- ⚙️ **Customizable Settings**: Adjust BPM range, smoothing, and detection preferences
- 📱 **PWA Support**: Install on desktop or mobile, works offline
- 🎚️ **Audio Level Monitoring**: Visual feedback of input signal strength
- 🎯 **High Accuracy**: Distinguishes between close tempos (e.g., 122 vs 124 BPM)
- 🔄 **Half/Double Detection**: Suggests when tempo might be half or double
- 🐍 **Python Backend Option**: Use Librosa for professional-grade accuracy (±0.5 BPM)

## Quick Start

### Prerequisites

- Node.js 18+ or newer
- npm, yarn, or pnpm
- A modern browser (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`

### Optional: Backend for Better Accuracy

For professional-grade BPM detection (±0.5 BPM accuracy), set up the Python backend:

```bash
# Quick setup (5 minutes)
cd backend
chmod +x setup.sh
./setup.sh
python server.py

# Then connect frontend - see QUICKSTART_BACKEND.md
```

**Why backend?** Librosa (Python) is much more accurate than JavaScript for BPM detection.  
**See:** `BACKEND_VS_FRONTEND.md` for detailed comparison.

## How to Use

### Basic Usage

1. **Click "Start Listening"**: Grant microphone permission when prompted
2. **Place device near audio source**: Position your phone/laptop near a speaker
3. **Watch the BPM display**: Large numbers show detected BPM with confidence meter
4. **Wait for stability**: Green indicator means BPM is stable and accurate

### Tap Tempo (Fallback Method)

1. **Click "Tap Tempo"** button
2. **Tap 4-16 times** to the beat of the music
3. **View calculated BPM** displayed with confidence percentage
4. **Reset** automatically after 3 seconds of no taps

### Settings

Access settings by clicking the **⚙️ Settings** button:

- **BPM Range**: Set minimum and maximum BPM (default: 80-160)
  - Presets: Hip-Hop (60-100), House (80-160), D&B (140-180)
- **Smoothing**: Control response time vs stability
  - Low: Fast response, may fluctuate
  - Medium: Balanced (recommended)
  - High: Very stable, slower to adapt
- **Half/Double Detection**: Enable suggestions for half/double tempo detection

## Algorithm Explanation

### Overview

BPMETER uses a sophisticated multi-stage algorithm for accurate tempo detection:

```
Audio Input → Preprocessing → Onset Detection → Autocorrelation → Smoothing → BPM Output
```

### 1. Preprocessing

- **Mono Conversion**: Mix stereo to mono for consistent analysis
- **High-Pass Filter**: ~100 Hz cutoff to emphasize percussive transients (kick drum)
- **Frame-based Processing**: 2048 samples with 75% overlap (512 hop size)

### 2. Onset Detection

- **Spectral Flux**: Measures energy changes between consecutive frames
- **Onset Strength Signal**: Time series of beat likelihood
- **History Window**: Maintains 8 seconds of onset data

### 3. Tempo Estimation

- **Autocorrelation**: Finds periodic patterns in onset signal
- **Lag-to-BPM Conversion**: Maps correlation peaks to tempo candidates
- **Confidence Scoring**: Compares best vs second-best peaks

### 4. Stabilization

- **Exponential Moving Average (EMA)**: Smooths BPM output over time
- **Hysteresis**: Prevents jumps unless confidence is high
- **Temporal Consistency**: Tracks BPM history for stability metrics

### Parameter Tuning

Edit these in `/lib/audio/bpm-estimator.ts`:

```typescript
const FRAME_SIZE = 2048;        // Analysis window
const HOP_SIZE = 512;           // Overlap amount
const HISTORY_SECONDS = 8;      // Autocorrelation window
const MIN_CONFIDENCE = 30;      // Threshold to update BPM
```

## Browser Support

### ✅ Fully Supported

- **Chrome/Edge** (Desktop & Android): Full functionality
- **Firefox** (Desktop & Android): Full functionality

### ⚠️ Limited Support

- **Safari** (iOS): Microphone API limitations
  - Use Tap Tempo as primary method
  - Some iOS versions may not support getUserMedia

### Requirements

- HTTPS or localhost (required for microphone access)
- Web Audio API support
- AudioWorklet or ScriptProcessor support

## Tips for Best Results

### Microphone Detection

1. **Placement**: Position device 1-2 feet from speaker
2. **Volume**: Moderate to loud (not distorting)
3. **Environment**: Minimize background noise
4. **Music Type**: Works best with music that has a strong, consistent kick drum
5. **Wait Time**: Allow 5-10 seconds for algorithm to stabilize

### Genre-Specific Tips

- **House/Techno**: Excellent results (strong 4/4 kick)
- **Hip-Hop**: Good results (may need slower smoothing)
- **Drum & Bass**: Very good (set range to 140-180 BPM)
- **Complex Rhythms**: Use Tap Tempo for verification

## PWA Installation

### Desktop (Chrome/Edge)

1. Visit the app in your browser
2. Look for install icon in address bar
3. Click "Install" to add to desktop

### Android

1. Visit the app in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Launch as standalone app

### iOS (Safari)

1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"

## Project Structure

```
BPMETER/
├── app/
│   ├── page.tsx              # Main UI component
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── BPMDisplay.tsx        # BPM readout
│   ├── ConfidenceMeter.tsx   # Confidence indicator
│   ├── AudioLevelMeter.tsx   # Input level visualization
│   ├── TapTempoButton.tsx    # Tap tempo UI
│   └── SettingsPanel.tsx     # Settings modal
├── lib/
│   ├── audio/
│   │   ├── bpm-estimator.ts  # Core BPM algorithm
│   │   ├── audio-engine.ts   # Web Audio API wrapper
│   │   └── tap-tempo.ts      # Tap tempo calculator
│   └── pwa/
│       └── register-sw.ts    # Service worker registration
├── public/
│   ├── manifest.webmanifest  # PWA manifest
│   ├── sw.js                 # Service worker
│   ├── audio-processor.js    # AudioWorklet processor
│   ├── icon.svg              # App icon (SVG)
│   ├── icon-192.png          # App icon (192x192)
│   └── icon-512.png          # App icon (512x512)
└── README.md
```

## Technical Details

### Web Audio API

- **AudioContext**: Sample rate 44.1 kHz
- **AudioWorklet**: Preferred for low-latency processing
- **ScriptProcessor**: Fallback for older browsers
- **AnalyserNode**: For audio level visualization

### BPM Detection Algorithm

- **Time Complexity**: O(n²) for autocorrelation (optimized with bounded search)
- **Latency**: ~100ms (8 frames × 12ms per frame)
- **Precision**: 0.1 BPM (internally computed as float)
- **Range**: Configurable 40-200 BPM

### Performance

- **CPU Usage**: ~5-10% on modern devices
- **Memory**: ~50MB typical
- **Battery**: Moderate impact when running

## Troubleshooting

### "Microphone permission denied"

- Grant microphone access in browser settings
- Reload the page after granting permission

### "No microphone found"

- Check if microphone is connected and working
- Try a different browser
- On mobile, check app permissions in system settings

### "No audio signal detected"

- Increase speaker volume
- Move device closer to audio source
- Check if correct input device is selected (browser handles this)

### Low confidence / Unstable readings

- Ensure music has a clear, steady beat
- Reduce background noise
- Try increasing smoothing in settings
- Use Tap Tempo to verify

### iOS Issues

- Use Safari (not Chrome) on iOS
- If microphone doesn't work, rely on Tap Tempo
- Some iOS versions have getUserMedia limitations

## Development

### Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Serve production build
npm run lint     # Run ESLint
```

### Environment

- No environment variables required
- No backend/API needed
- Fully client-side application

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

1. Build the app: `npm run build`
2. Upload the `.next` folder and `public` folder
3. Ensure HTTPS is enabled
4. Set Node.js version to 18+

## Credits

**Created by Santo & Twilight**

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio processing

## License

MIT License - Free to use, modify, and distribute.

## Future Enhancements

Potential features for future versions:

- [ ] BPM history graph
- [ ] Multiple simultaneous BPM detection (polyrhythms)
- [ ] Beat phase alignment indicator
- [ ] Export BPM data to file
- [ ] Spotify/Apple Music integration
- [ ] MIDI sync output
- [ ] Custom audio file upload & analysis

---

**Enjoy detecting those beats! 🎵🎧**

# BPMETER
