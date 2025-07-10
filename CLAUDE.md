# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Update - SUPER SIMPLE VERSION

The app has been completely simplified to ONE core feature: real-time conversation translation.

### What's new:
- ✅ ONE SCREEN - no navigation, no menus
- ✅ TWO BIG BUTTONS - one for each speaker (hold to record)
- ✅ Automatic flow: Record → Transcribe → Translate → Play audio
- ✅ Uses latest OpenAI APIs:
  - Whisper for speech-to-text
  - GPT-4 for contextual translation
  - TTS API for natural voice synthesis
- ✅ Click flags to change languages (PL/EN/FR)
- ✅ Still works as PWA on phones

### Removed features:
- ❌ Text translation page
- ❌ Offline phrases
- ❌ History
- ❌ User profiles
- ❌ All complexity!

## Project Overview

TravelSpeak Family is now an ultra-simple translation app for families traveling in Europe. Just hold a button, speak, and hear the translation!

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Railway
- **APIs**: OpenAI (Whisper, GPT-4, TTS)

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

IMPORTANT: In Railway, DO NOT add quotes around the API key value!

## Project Structure (Simplified)

```
/app
  /page.tsx               # The ONLY page - conversation translator
  /api
    /whisper/route.ts     # OpenAI Whisper (speech-to-text)
    /translate-gpt/route.ts # OpenAI GPT-4 (translation)
    /tts-openai/route.ts  # OpenAI TTS (text-to-speech)
```

## How it works

1. User holds their language button and speaks
2. Whisper API converts speech to text
3. GPT-4 translates the text contextually
4. TTS API generates natural speech
5. Translation plays automatically
6. Other person responds using their button

## Deployment

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Deploy to Railway
# (Railway automatically deploys from GitHub)
```

## Success Metrics

- Grandma successfully orders coffee in Paris
- Kids can ask for directions without parents
- Real conversations happen, not just phrase repetition