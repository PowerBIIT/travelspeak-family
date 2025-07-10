import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    const language = formData.get('language') as string || 'pl';
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Convert blob to file for OpenAI API
    const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' });
    
    // Create FormData for OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append('file', file);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('language', language);
    openAIFormData.append('response_format', 'json');

    // Call OpenAI Whisper API
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
        { error: 'Failed to transcribe audio' },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}