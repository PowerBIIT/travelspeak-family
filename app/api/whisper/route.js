import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = formData.get('language') || 'pl';
    
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
    
    console.log('Whisper API - Audio info:', {
      size: audioBuffer.byteLength,
      type: mimeType,
      extension: extension,
      language: language
    });
    
    // Konwertujemy blob na file dla OpenAI
    const file = new File([audioBuffer], `audio.${extension}`, { type: mimeType });
    
    // Przygotowujemy dane dla OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append('file', file);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', language);
    openAIFormData.append('response_format', 'json');
    openAIFormData.append('temperature', '0.2');

    // Wywołujemy Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI Whisper error:', error);
      return NextResponse.json(
        { error: 'Błąd rozpoznawania mowy' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      text: data.text,
      language: language,
    });

  } catch (error) {
    console.error('Whisper API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}