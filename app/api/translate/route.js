import { NextResponse } from 'next/server';
import { checkCostLimit, addCost, getCostHeaders } from '../lib/costTracker.js';
import { checkRateLimit, getRateLimitHeaders } from '../lib/rateLimiter.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const languageNames = {
  pl: 'Polish',
  en: 'English', 
  fr: 'French'
};

// Cache najpopularniejszych fraz turystycznych
const COMMON_PHRASES_CACHE = {
  'pl': {
    // Podstawowe zwroty
    'dziękuję': { 'en': 'Thank you', 'fr': 'Merci' },
    'proszę': { 'en': 'Please', 'fr': "S'il vous plaît" },
    'przepraszam': { 'en': 'Excuse me', 'fr': 'Excusez-moi' },
    'nie rozumiem': { 'en': "I don't understand", 'fr': 'Je ne comprends pas' },
    'czy mówisz po angielsku': { 'en': 'Do you speak English', 'fr': 'Parlez-vous anglais' },
    'dzień dobry': { 'en': 'Good morning', 'fr': 'Bonjour' },
    'do widzenia': { 'en': 'Goodbye', 'fr': 'Au revoir' },
    
    // Restauracja
    'poproszę menu': { 'en': 'Menu please', 'fr': "Le menu, s'il vous plaît" },
    'poproszę rachunek': { 'en': 'The bill please', 'fr': "L'addition, s'il vous plaît" },
    'poproszę kawę': { 'en': 'Coffee please', 'fr': "Un café, s'il vous plaît" },
    'poproszę wodę': { 'en': 'Water please', 'fr': "De l'eau, s'il vous plaît" },
    
    // Kierunki i miejsca
    'gdzie jest toaleta': { 'en': 'Where is the bathroom', 'fr': 'Où sont les toilettes' },
    'gdzie jest': { 'en': 'Where is', 'fr': 'Où est' },
    'gdzie jest dworzec': { 'en': 'Where is the train station', 'fr': 'Où est la gare' },
    'gdzie jest lotnisko': { 'en': 'Where is the airport', 'fr': "Où est l'aéroport" },
    
    // Zakupy i płatności
    'ile to kosztuje': { 'en': 'How much does it cost', 'fr': 'Combien ça coûte' },
    'czy mogę zapłacić kartą': { 'en': 'Can I pay by card', 'fr': 'Puis-je payer par carte' },
    
    // Pomoc
    'potrzebuję pomocy': { 'en': 'I need help', 'fr': "J'ai besoin d'aide" },
    'czy możesz mi pomóc': { 'en': 'Can you help me', 'fr': 'Pouvez-vous m\'aider' },
    
    // Zdrowie
    'potrzebuję lekarza': { 'en': 'I need a doctor', 'fr': "J'ai besoin d'un médecin" }
  },
  'en': {
    // Podstawowe
    'thank you': { 'pl': 'Dziękuję', 'fr': 'Merci' },
    'please': { 'pl': 'Proszę', 'fr': "S'il vous plaît" },
    'excuse me': { 'pl': 'Przepraszam', 'fr': 'Excusez-moi' },
    "i don't understand": { 'pl': 'Nie rozumiem', 'fr': 'Je ne comprends pas' },
    'good morning': { 'pl': 'Dzień dobry', 'fr': 'Bonjour' },
    'goodbye': { 'pl': 'Do widzenia', 'fr': 'Au revoir' },
    
    // Miejsca
    'where is the bathroom': { 'pl': 'Gdzie jest toaleta', 'fr': 'Où sont les toilettes' },
    'where is': { 'pl': 'Gdzie jest', 'fr': 'Où est' },
    
    // Zakupy
    'how much': { 'pl': 'Ile to kosztuje', 'fr': 'Combien' },
    'how much does it cost': { 'pl': 'Ile to kosztuje', 'fr': 'Combien ça coûte' }
  },
  'fr': {
    // Podstawowe
    'merci': { 'pl': 'Dziękuję', 'en': 'Thank you' },
    's\'il vous plaît': { 'pl': 'Proszę', 'en': 'Please' },
    'excusez-moi': { 'pl': 'Przepraszam', 'en': 'Excuse me' },
    'bonjour': { 'pl': 'Dzień dobry', 'en': 'Good morning' },
    'au revoir': { 'pl': 'Do widzenia', 'en': 'Goodbye' },
    
    // Miejsca
    'où est': { 'pl': 'Gdzie jest', 'en': 'Where is' },
    'où sont les toilettes': { 'pl': 'Gdzie jest toaleta', 'en': 'Where is the bathroom' },
    
    // Zakupy
    'combien': { 'pl': 'Ile', 'en': 'How much' },
    'combien ça coûte': { 'pl': 'Ile to kosztuje', 'en': 'How much does it cost' }
  }
};

// Funkcja normalizacji tekstu dla lepszego dopasowania
const normalizeText = (text) => {
  return text.toLowerCase().trim()
    .replace(/[?!.,;:]/g, '') // Usuń interpunkcję
    .replace(/\s+/g, ' '); // Znormalizuj spacje
};

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    // Check rate limit first
    const ip = request.headers.get('x-forwarded-for') || 'global';
    const rateLimitResult = checkRateLimit('translate', ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }
    
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
    
    // Estimate cost and check limit (approx 500 tokens per request)
    const estimatedCost = 0.004; // Average cost per translation
    const costCheck = checkCostLimit(estimatedCost, 'translate');
    
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

    // Sprawdź cache najpierw
    const normalizedText = normalizeText(text);
    const cachedTranslation = COMMON_PHRASES_CACHE[from]?.[normalizedText]?.[to];
    
    if (cachedTranslation) {
      const latency = Date.now() - startTime;
      
      console.log('Translation API - Cache hit:', {
        text: text,
        from: from,
        to: to,
        latency: latency + 'ms',
        cost: '$0.0000',
        cached: true
      });
      
      const responseHeaders = {
        ...getRateLimitHeaders(rateLimitResult),
        ...getCostHeaders()
      };
      
      return NextResponse.json({
        translation: cachedTranslation,
        from,
        to,
        cached: true,
        performance: {
          latencyMs: latency,
          estimatedCost: 0
        }
      }, { headers: responseHeaders });
    }

    // Zoptymalizowany prompt dla naturalnych tłumaczeń
    const systemPrompt = `You're interpreting between tourists and locals. 
Make the translation sound like what a helpful local person would actually say in this situation.
Keep conversational tone and use everyday language.
Translate from ${languageNames[from]} to ${languageNames[to]}.
Output only the translation, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Szybszy i tańszy model dla tłumaczeń
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 100, // Zmniejszone dla krótkich fraz turystycznych
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
    
    // Oblicz koszt (przybliżony)
    const inputTokens = Math.ceil(text.length / 4); // Przybliżenie
    const outputTokens = Math.ceil(translation.length / 4);
    const actualCost = (inputTokens * 0.00015 + outputTokens * 0.0006) / 1000;
    
    // Add cost to tracker
    addCost(actualCost, 'translate', {
      inputTokens,
      outputTokens,
      from,
      to,
      textLength: text.length
    });
    
    const latency = Date.now() - startTime;
    
    console.log('Translation API - Performance:', {
      text: text.substring(0, 50) + '...',
      from: from,
      to: to,
      latency: latency + 'ms',
      cost: '$' + actualCost.toFixed(4),
      cached: false,
      inputTokens: inputTokens,
      outputTokens: outputTokens
    });

    const responseHeaders = {
      ...getRateLimitHeaders(rateLimitResult),
      ...getCostHeaders()
    };

    return NextResponse.json({
      translation,
      from,
      to,
      cached: false,
      performance: {
        latencyMs: latency,
        estimatedCost: actualCost
      }
    }, { headers: responseHeaders });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}