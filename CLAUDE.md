# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Implementation

The TravelSpeak Family application has been successfully implemented and deployed to Railway. The app is live and working at: https://travelspeak-family-production.up.railway.app

### What works:
- ✅ Voice translation (Polish ↔ English/French) using AssemblyAI + DeepSeek
- ✅ Text translation using DeepSeek API  
- ✅ TTS (Text-to-Speech) using browser's Speech Synthesis API - auto-plays translations
- ✅ Offline phrases (work without internet!)
- ✅ Large, elderly-friendly UI with high contrast
- ✅ PWA - installable on phones

### Recent changes:
- Added TTS that automatically plays translated text using Web Speech API
- Removed history feature - unnecessary complexity
- Removed translation counter - distracting
- Simplified UI to focus on core functionality

### Important notes:
- No AWS/Amazon Polly - using browser's built-in Speech API instead
- Railway environment variables should NOT have quotes around values
- The app is designed for a family trip to Europe (happening now!)
- Focus on simplicity - only essential features for real-time translation

## Project Overview

TravelSpeak Family is a simple translation app designed for families traveling to England and France. The app focuses on maximum simplicity and usability for all family members, from children to grandparents.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **APIs**:
  - DeepSeek (translations)
  - AssemblyAI (speech-to-text)
  - Amazon Polly (text-to-speech)

## Common Development Commands

```bash
# Initialize project
npx create-next-app@latest travelspeak-family --typescript --tailwind --app --no-src
cd travelspeak-family
npm install axios react-hook-form zustand lucide-react

# Development
npm run dev

# Build
npm run build

# Deploy to Vercel
vercel --prod

# Environment variables setup (use Vercel CLI)
vercel env add DEEPSEEK_API_KEY production
vercel env add ASSEMBLYAI_API_KEY production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add AWS_REGION production
```

## Project Structure

```
/app
  /page.tsx                 # Home page with language selection
  /translate
    /voice/page.tsx        # Voice translation
    /text/page.tsx         # Text translation
  /phrases/page.tsx        # Ready phrases (offline)
  /history/page.tsx        # Translation history
  /api
    /translate/route.ts    # DeepSeek endpoint
    /speech/route.ts       # AssemblyAI endpoint
    /tts/route.ts         # Amazon Polly endpoint
/components
  /VoiceRecorder.tsx      # Recording component
  /TranslationDisplay.tsx # Translation display
  /OfflinePhrases.tsx     # Offline phrases
/lib
  /api-clients.ts         # API clients
  /offline-data.ts        # Offline data
/public
  /service-worker.js      # PWA for offline
```

## Key Architecture Decisions

### API Integration
- All API keys stored as Vercel environment variables (NEVER in code)
- Rate limiting: 100 translations/day, max 500 characters per translation
- Speech recording limited to 30 seconds

### Offline Functionality
- Service Worker caches essential phrases for offline use
- Categories: SOS, Transport, Hotel, Restaurant, Shopping
- localStorage stores user preferences and translation history

### User Experience
- Large buttons (min-height: 80px) for elderly users
- Three user profiles: Grandparents (24px font), Parents (full interface), Children (colorful icons)
- Mobile-first responsive design
- Simple language pair selection: Polish ↔ English, Polish ↔ French, English ↔ French

## Critical Implementation Notes

### Security
- Never commit API keys - use Vercel environment variables exclusively
- All API calls must go through Next.js API routes (no direct client calls)

### Performance
- Implement proper loading states during translations
- Cache translations in localStorage (last 50)
- Use error boundaries with user-friendly Polish messages

### Accessibility
- Support font size adjustments in settings
- High contrast mode for better visibility
- Voice feedback for all actions

## Development Workflow

1. **Before implementing features**: Check PRD.md for detailed specifications
2. **API limits**: Respect the configured limits to stay within budget
3. **Testing**: Always test with different user profiles (elderly, children)
4. **Deployment**: Use Vercel CLI for deployments, never commit .env files

## Budget Constraints

```typescript
const API_LIMITS = {
  translationsPerDay: 100,
  maxTranslationLength: 500,
  speechRecordingMaxSeconds: 30,
}
```

Estimated monthly cost: ~5 PLN

## Important PRD Requirements

- The app must work on all family members' phones
- Offline phrases are critical for emergencies
- Interface must be extremely simple - better 5 working features than 50 unused ones
- Success metrics: Grandma orders coffee in Paris, kids ask for directions in London, no one gets lost at the airport