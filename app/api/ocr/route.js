import { NextResponse } from 'next/server';



const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ENABLE_OCR_FEATURE = process.env.ENABLE_OCR_FEATURE === 'true';

// Maksymalny rozmiar pliku: 4MB po kompresji
const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Feature flag - możliwość wyłączenia funkcji
    if (!ENABLE_OCR_FEATURE) {
      return NextResponse.json(
        { error: 'Funkcja OCR jest tymczasowo wyłączona' },
        { status: 503 }
      );
    }
    
    // Check rate limit first
    const ip = request.headers.get('x-forwarded-for') || 'global';
    const rateLimitResult = checkRateLimit('ocr', ip);
    
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
    const imageFile = formData.get('image');
    const targetLang = formData.get('targetLang') || 'pl';
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'Brak obrazu' },
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
    
    // Check cost limit - OCR costs $0.01 per image
    const estimatedCost = 0.01;
    const costCheck = checkCostLimit(estimatedCost, 'ocr');
    
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

    // Sprawdzenie rozmiaru pliku
    const imageBuffer = await imageFile.arrayBuffer();
    if (imageBuffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Obraz jest za duży. Maksymalny rozmiar to 4MB' },
        { status: 400 }
      );
    }

    // Konwersja do base64
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('OCR API - Processing image:', {
      size: imageBuffer.byteLength,
      type: mimeType,
      targetLang: targetLang
    });

    // Określ język docelowy
    const targetLanguageName = {
      pl: 'Polish',
      en: 'English',
      fr: 'French'
    }[targetLang] || 'Polish';

    // Wywołanie OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful travel assistant that extracts text from images and translates it.
                     Extract ALL visible text from the image, then translate it to ${targetLanguageName}.
                     Format your response as JSON with this structure:
                     {
                       "original_text": "extracted text here",
                       "translated_text": "translation here",
                       "detected_language": "detected language code (pl/en/fr/etc)",
                       "confidence": "high/medium/low",
                       "context": "menu/sign/document/other"
                     }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all text from this image and translate it to ${targetLanguageName}. If it's a menu or list, preserve the structure.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high' // Wysoka jakość dla lepszego OCR
                }
              }
            ]
          }
        ],
        temperature: 0.1, // Niska temperatura dla dokładności
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Vision API error:', error);
      return NextResponse.json(
        { error: 'Błąd rozpoznawania tekstu' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Oblicz koszt (przybliżony)
    // GPT-4o-mini vision: ~$0.01 per image (high detail)
    const actualCost = 0.01;
    
    // Add cost to tracker
    addCost(actualCost, 'vision', {
      imageSize: imageBuffer.byteLength,
      targetLang,
      detectedLanguage: result.detected_language,
      textLength: result.original_text?.length || 0
    });
    
    const latency = Date.now() - startTime;
    
    console.log('OCR API - Performance:', {
      latency: latency + 'ms',
      cost: '$' + actualCost.toFixed(4),
      detectedLanguage: result.detected_language,
      confidence: result.confidence,
      textLength: result.original_text?.length || 0
    });
    
    const responseHeaders = {
      ...getRateLimitHeaders(rateLimitResult),
      ...getCostHeaders()
    };

    // Jeśli nie wykryto tekstu
    if (!result.original_text || result.original_text.trim() === '') {
      return NextResponse.json({
        error: 'Nie znaleziono tekstu na obrazie',
        performance: {
          latencyMs: latency,
          estimatedCost: actualCost
        }
      }, { headers: responseHeaders });
    }

    return NextResponse.json({
      ...result,
      targetLang: targetLang,
      performance: {
        latencyMs: latency,
        estimatedCost: actualCost
      }
    }, { headers: responseHeaders });

  } catch (error) {
    console.error('OCR API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera podczas przetwarzania obrazu' },
      { status: 500 }
    );
  }
}

// Opcjonalnie: endpoint do sprawdzenia czy OCR jest włączony
export async function GET() {
  return NextResponse.json({
    enabled: ENABLE_OCR_FEATURE,
    maxFileSize: MAX_FILE_SIZE,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
  });
}
