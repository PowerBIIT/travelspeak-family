import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const languageNames: Record<string, string> = {
  pl: 'Polish',
  en: 'English', 
  fr: 'French'
};

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
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

    const fromLang = languageNames[from] || from;
    const toLang = languageNames[to] || to;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in conversational translation. Translate the following text from ${fromLang} to ${toLang}. 
            Keep the translation natural, conversational, and appropriate for spoken dialogue. 
            Preserve the tone and intent of the original message.
            Only return the translated text, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI GPT error:', error);
      return NextResponse.json(
        { error: 'Failed to translate text' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    return NextResponse.json({
      translation,
      original: text,
      from,
      to,
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}