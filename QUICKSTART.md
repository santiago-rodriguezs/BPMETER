# Quick Start Guide - BPMETER

Get up and running in 2 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Run Development Server

```bash
npm run dev
```

## Step 3: Open in Browser

Navigate to: `http://localhost:3000`

## Step 4: Test the App

1. **Click "Start Listening"** button
2. **Allow microphone access** when prompted
3. **Play some music** near your device or tap on your desk
4. **Watch the BPM update** in real-time

## Alternative: Tap Tempo

If microphone doesn't work or you want to verify:

1. **Click "Tap Tempo"** button  
2. **Tap 4+ times** to the beat
3. **See calculated BPM**

## Common Issues

### "Microphone permission denied"
- Allow microphone in browser settings
- Reload the page

### "No signal detected"
- Check speaker volume
- Move device closer to sound source
- Try tapping loudly on desk near microphone

### Not working on iPhone
- iOS has getUserMedia limitations
- Use **Tap Tempo** instead

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ALGORITHM.md](./ALGORITHM.md) for technical details
- Adjust settings (⚙️ button) for your genre

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

That's it! Enjoy 🎵

