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

    // Use LibreTranslate - free and better quality
    const languageCodes: Record<Language, string> = {
      pl: 'pl',
      en: 'en',
      fr: 'fr',
    };

    // Try multiple LibreTranslate instances for reliability
    const libreTranslateInstances = [
      'https://libretranslate.de',
      'https://translate.argosopentech.com',
      'https://libretranslate.com',
    ];

    let translation = '';
    let lastError = null;

    for (const instance of libreTranslateInstances) {
      try {
        const response = await fetch(`${instance}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: languageCodes[from as Language],
            target: languageCodes[to as Language],
            format: 'text',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          translation = data.translatedText;
          break;
        }
      } catch (error) {
        lastError = error;
        console.log(`Failed with ${instance}, trying next...`);
      }
    }

    if (!translation) {
      // Fallback to a simple API that doesn't require keys
      try {
        const fallbackResponse = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${languageCodes[from as Language]}|${languageCodes[to as Language]}`
        );
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          translation = data.responseData.translatedText;
        }
      } catch (error) {
        console.error('All translation services failed:', error);
        throw new Error('Translation services unavailable');
      }
    }

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}