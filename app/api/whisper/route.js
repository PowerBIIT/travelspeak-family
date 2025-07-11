import { NextResponse } from 'next/server';
import { checkCostLimit, addCost, getCostHeaders } from '../lib/costTracker.js';
import { checkRateLimit, getRateLimitHeaders } from '../lib/rateLimiter.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Check rate limit first
    const ip = request.headers.get('x-forwarded-for') || 'global';
    const rateLimitResult = checkRateLimit('whisper', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }
    
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = formData.get('language'); // Może być null dla auto-detekcji
    const autoDetect = formData.get('autoDetect') === 'true';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Brak pliku audio' },
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

    // Pobieramy zawartość pliku
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Określamy typ pliku na podstawie nagłówka mime
    const mimeType = audioFile.type || 'audio/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const audioDurationSeconds = audioBuffer.byteLength / (16000 * 2); // Przybliżone oszacowanie
    
    // Estimate cost and check limit
    const estimatedMinutes = Math.max(0.1, audioDurationSeconds / 60); // Minimum 0.1 minute
    const estimatedCost = estimatedMinutes * 0.006; // $0.006 per minute
    const costCheck = checkCostLimit(estimatedCost, 'whisper');
    
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
    
    console.log('Whisper API - Audio info:', {
      size: audioBuffer.byteLength,
      type: mimeType,
      extension: extension,
      language: autoDetect ? 'auto-detect' : language,
      estimatedDuration: audioDurationSeconds.toFixed(1) + 's'
    });
    
    // Konwertujemy blob na file dla OpenAI
    const file = new File([audioBuffer], `audio.${extension}`, { type: mimeType });
    
    // Funkcja do wywołania transkrypcji z określonym modelem
    const transcribeWithModel = async (modelName) => {
      const openAIFormData = new FormData();
      openAIFormData.append('file', file);
      openAIFormData.append('model', modelName);
      
      // Tylko dodaj język jeśli nie jest auto-detect
      if (!autoDetect && language) {
        openAIFormData.append('language', language);
      }
      
      // Użyj verbose_json dla auto-detekcji aby otrzymać wykryty język
      openAIFormData.append('response_format', autoDetect ? 'verbose_json' : 'json');
      openAIFormData.append('temperature', '0'); // Deterministyczne dla spójności
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: openAIFormData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Model ${modelName} failed: ${error}`);
      }
      
      return response.json();
    };
    
    let data;
    let modelUsed;
    
    try {
      // Próbuj użyć nowego, tańszego modelu
      data = await transcribeWithModel('gpt-4o-mini-transcribe');
      modelUsed = 'gpt-4o-mini-transcribe';
      estimatedCost = (audioDurationSeconds / 60) * 0.003; // $0.003 per minute
    } catch (primaryError) {
      console.warn('Primary model failed, falling back to whisper-1:', primaryError.message);
      
      // Fallback do sprawdzonego modelu
      try {
        data = await transcribeWithModel('whisper-1');
        modelUsed = 'whisper-1 (fallback)';
        estimatedCost = (audioDurationSeconds / 60) * 0.006; // $0.006 per minute
      } catch (fallbackError) {
        console.error('Both models failed:', fallbackError);
        return NextResponse.json(
          { error: 'Błąd rozpoznawania mowy' },
          { status: 500 }
        );
      }
    }
    
    const latency = Date.now() - startTime;
    
    // Wyciągnij wykryty język jeśli auto-detect
    const detectedLanguage = autoDetect && data.language ? data.language : language;
    
    // Add actual cost to tracker
    const actualMinutes = audioDurationSeconds / 60;
    const actualCost = modelUsed.includes('gpt-4o-mini') 
      ? actualMinutes * 0.003  // $0.003 per minute for gpt-4o-mini
      : actualMinutes * 0.006; // $0.006 per minute for whisper-1
    
    addCost(actualCost, 'whisper', {
      model: modelUsed,
      durationSeconds: audioDurationSeconds,
      language: detectedLanguage || language,
      autoDetect
    });
    
    console.log('Whisper API - Performance:', {
      model: modelUsed,
      latency: latency + 'ms',
      cost: '$' + actualCost.toFixed(4),
      textLength: data.text.length,
      detectedLanguage: autoDetect ? detectedLanguage : 'specified',
      autoDetect: autoDetect
    });
    
    const responseHeaders = {
      ...getRateLimitHeaders(rateLimitResult),
      ...getCostHeaders()
    };
    
    return NextResponse.json({
      text: data.text,
      language: detectedLanguage || language,
      detectedLanguage: autoDetect ? detectedLanguage : null,
      autoDetect: autoDetect,
      performance: {
        model: modelUsed,
        latencyMs: latency,
        estimatedCost: actualCost
      }
    }, { headers: responseHeaders });

  } catch (error) {
    console.error('Whisper API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}