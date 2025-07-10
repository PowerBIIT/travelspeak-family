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

    // For now, return a mock translation
    // TODO: Integrate with DeepSeek API when API key is provided
    const mockTranslations: Record<string, Record<string, string>> = {
      'pl-en': {
        'Dzień dobry': 'Good morning',
        'Jak się masz?': 'How are you?',
        'Dziękuję': 'Thank you',
      },
      'en-pl': {
        'Good morning': 'Dzień dobry',
        'How are you?': 'Jak się masz?',
        'Thank you': 'Dziękuję',
      },
      'pl-fr': {
        'Dzień dobry': 'Bonjour',
        'Jak się masz?': 'Comment allez-vous?',
        'Dziękuję': 'Merci',
      },
      'fr-pl': {
        'Bonjour': 'Dzień dobry',
        'Comment allez-vous?': 'Jak się masz?',
        'Merci': 'Dziękuję',
      },
      'en-fr': {
        'Good morning': 'Bonjour',
        'How are you?': 'Comment allez-vous?',
        'Thank you': 'Merci',
      },
      'fr-en': {
        'Bonjour': 'Good morning',
        'Comment allez-vous?': 'How are you?',
        'Merci': 'Thank you',
      },
    };

    const translationKey = `${from}-${to}`;
    const translations = mockTranslations[translationKey] || {};
    
    // Simple mock translation - in production, use DeepSeek API
    let translation = translations[text] || `[${to.toUpperCase()}] ${text}`;

    // When DeepSeek API key is available, use this:
    /*
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
      console.warn('DeepSeek API key not configured, using mock translation');
      return NextResponse.json({ translation });
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
      throw new Error('DeepSeek API error');
    }

    const data = await response.json();
    translation = data.choices[0].message.content.trim();
    */

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}