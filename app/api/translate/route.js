import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const languageNames = {
  pl: 'Polish',
  en: 'English', 
  fr: 'French'
};

export async function POST(request) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
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

    const systemPrompt = `You are a professional translator for a family traveling in Europe. 
Translate the following text from ${languageNames[from]} to ${languageNames[to]}.
Keep the translation natural and conversational, suitable for travel contexts.
Only return the translation, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI GPT error:', error);
      return NextResponse.json(
        { error: 'Błąd tłumaczenia' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    return NextResponse.json({
      translation,
      from,
      to,
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}