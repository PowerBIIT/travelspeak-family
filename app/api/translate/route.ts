import { NextRequest, NextResponse } from 'next/server';
import { Language } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      console.warn('DeepSeek API key not configured');
      return NextResponse.json({ 
        translation: `[Brak klucza API] ${text}`,
        error: 'Brak konfiguracji DeepSeek API' 
      });
    }

    const languageNames: Record<Language, string> = {
      pl: 'Polish',
      en: 'English',
      fr: 'French',
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text from ${languageNames[from as Language]} to ${languageNames[to as Language]}. Return only the translation, no explanations.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error('DeepSeek API error');
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}