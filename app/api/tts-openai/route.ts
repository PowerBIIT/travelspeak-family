import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Map language codes to OpenAI TTS voices
const voiceMap: Record<string, string> = {
  pl: 'nova', // Female voice good for Polish
  en: 'alloy', // Natural English voice
  fr: 'shimmer', // Good for French
};

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const voice = voiceMap[language] || 'alloy';

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS error:', error);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}