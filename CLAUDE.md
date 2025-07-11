# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Starting fresh - building the app from scratch.

## Requirements

### Core Functionality
- **ONE SCREEN** - Single page app with no navigation
- **REAL-TIME TRANSLATION** - Hold button to speak, automatic translation and playback
- **SIMPLE UI** - Ultra simple interface for family traveling in Europe
- **LANGUAGES** - Polish, English, French (switchable by clicking flags)

### Technical Requirements
- Use latest OpenAI APIs:
  - Whisper API for speech-to-text
  - GPT-4 Turbo for translation
  - OpenAI TTS API for text-to-speech
- Next.js 14 with App Router
- Deploy to Railway
- Works as PWA on mobile phones
- NO TypeScript - use plain JavaScript
- Minimal dependencies

### User Flow
1. User selects their language (click flag to cycle: PL → EN → FR → PL)
2. Hold the big button to record
3. Release to stop recording
4. App automatically:
   - Transcribes speech (Whisper)
   - Translates to target languages (GPT-4)
   - Plays translation audio (TTS)
5. Other person responds using the same button

### Design
- Modern gradient background
- Large, touch-friendly button (hold to record)
- Flag selection at top
- Show transcription and translation results
- Minimal text, maximum clarity

### Environment Variables
```
OPENAI_API_KEY=your_key_here
```

### Deployment Notes
- Railway automatically deploys from GitHub
- In Railway environment variables, DO NOT use quotes around values
- Use port from environment: `process.env.PORT || 3000`

## Success Metrics
- Grandma can order coffee in Paris without help
- Kids can ask for directions in London
- Real conversations happen naturally
- No manual or instructions needed