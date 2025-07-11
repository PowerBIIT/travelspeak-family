import { NextResponse } from 'next/server';



const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Mapowanie języków na głosy OpenAI TTS
const voiceMap = {
  pl: 'nova',    // Przyjemny żeński głos
  en: 'alloy',   // Neutralny głos
  fr: 'shimmer', // Ciepły żeński głos
};

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Check rate limit first
    const ip = request.headers.get('x-forwarded-for') || 'global';
    const rateLimitResult = checkRateLimit('tts', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }
    
    const { text, language } = await request.json();

    if (!text || !language) {
      return NextResponse.json(
        { error: 'Brakuje wymaganych parametrów' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'Błąd konfiguracji serwera' },
        { status: 500 }
      );
    }

    const voice = voiceMap[language] || 'alloy';
    
    // Oblicz przybliżony koszt (TTS: $15 per 1M characters)
    const characterCount = text.length;
    const estimatedCost = (characterCount * 15) / 1000000;
    
    // Check cost limit
    const costCheck = checkCostLimit(estimatedCost, 'tts');
    
    if (!costCheck.allowed) {
      return NextResponse.json(
        { 
          error: costCheck.message,
          costInfo: {
            daily: costCheck.currentCost,
            limit: costCheck.limit,
            reason: costCheck.reason
          }
        },
        { 
          status: 429,
          headers: getCostHeaders()
        }
      );
    }

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
        speed: 0.9, // Trochę wolniej dla lepszego zrozumienia
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS error:', error);
      return NextResponse.json(
        { error: 'Błąd syntezy mowy' },
        { status: response.status }
      );
    }

    // Pobieramy audio jako buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Add actual cost to tracker
    addCost(estimatedCost, 'tts', {
      characterCount,
      language,
      voice,
      audioSize: audioBuffer.byteLength
    });
    
    const latency = Date.now() - startTime;
    
    console.log('TTS API - Performance:', {
      textLength: text.length,
      language: language,
      voice: voice,
      latency: latency + 'ms',
      cost: '$' + estimatedCost.toFixed(4),
      audioSize: audioBuffer.byteLength + ' bytes'
    });

    // Zwracamy audio z odpowiednimi nagłówkami
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'X-Performance-Latency': latency.toString(),
        'X-Estimated-Cost': estimatedCost.toFixed(4),
        ...getRateLimitHeaders(rateLimitResult),
        ...getCostHeaders()
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
