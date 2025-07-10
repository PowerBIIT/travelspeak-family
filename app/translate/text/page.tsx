'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import TranslationDisplay from '@/components/TranslationDisplay';
import { useStore } from '@/lib/store';
import { API_LIMITS } from '@/lib/types';

export default function TextTranslatePage() {
  const router = useRouter();
  const { currentLanguagePair, addTranslation, fontSize, incrementDailyCount, dailyTranslationCount, checkAndResetDailyCount } = useStore();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fontSizeClass = fontSize === 'elderly' ? 'text-elderly' : fontSize === 'large' ? 'text-xl' : 'text-base';

  const handleTranslate = async () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setTranslatedText('');
    setOriginalText('');

    try {
      // Check daily limit
      checkAndResetDailyCount();
      if (dailyTranslationCount >= API_LIMITS.translationsPerDay) {
        throw new Error(`Dzienny limit ${API_LIMITS.translationsPerDay} tłumaczeń został wyczerpany. Spróbuj jutro.`);
      }

      // Check text length
      if (inputText.length > API_LIMITS.maxTranslationLength) {
        throw new Error(`Tekst jest za długi. Maksymalna długość to ${API_LIMITS.maxTranslationLength} znaków.`);
      }

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          from: currentLanguagePair.from,
          to: currentLanguagePair.to,
        }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas tłumaczenia');
      }

      const { translation } = await response.json();
      setOriginalText(inputText);
      setTranslatedText(translation);

      // Save to history
      addTranslation({
        originalText: inputText,
        translatedText: translation,
        from: currentLanguagePair.from,
        to: currentLanguagePair.to,
        type: 'text',
      });

      // Increment daily count
      incrementDailyCount();

      // Clear input
      setInputText('');

    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas tłumaczenia');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <main className={`flex min-h-screen flex-col items-center p-4 ${fontSizeClass}`}>
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="mr-2" size={24} />
          Powrót
        </button>

        <h1 className="text-2xl font-bold mb-8 text-center">Tłumaczenie tekstowe</h1>

        {/* Input area */}
        <div className="mb-6">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Wpisz tekst do przetłumaczenia..."
              className="w-full min-h-[120px] p-4 pr-12 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none resize-y"
              maxLength={API_LIMITS.maxTranslationLength}
              disabled={isProcessing}
            />
            <div className="absolute bottom-2 right-2">
              <span className="text-sm text-gray-500 mr-2">
                {inputText.length}/{API_LIMITS.maxTranslationLength}
              </span>
            </div>
          </div>
          <button
            onClick={handleTranslate}
            disabled={!inputText.trim() || isProcessing}
            className="mt-4 btn-primary w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={24} />
                Tłumaczenie...
              </>
            ) : (
              <>
                <Send className="mr-2" size={24} />
                Przetłumacz
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {(originalText || translatedText) && (
          <TranslationDisplay
            originalText={originalText}
            translatedText={translatedText}
            fromLang={currentLanguagePair.from}
            toLang={currentLanguagePair.to}
          />
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Pozostało tłumaczeń dzisiaj: {API_LIMITS.translationsPerDay - dailyTranslationCount}</p>
        </div>
      </div>
    </main>
  );
}