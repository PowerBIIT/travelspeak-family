'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import TranslationDisplay from '@/components/TranslationDisplay';
import { useStore } from '@/lib/store';
import { API_LIMITS } from '@/lib/types';

export default function VoiceTranslatePage() {
  const router = useRouter();
  const { currentLanguagePair, addTranslation, incrementDailyCount, dailyTranslationCount, checkAndResetDailyCount } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setOriginalText('');
    setTranslatedText('');

    try {
      // Check daily limit
      checkAndResetDailyCount();
      if (dailyTranslationCount >= API_LIMITS.translationsPerDay) {
        throw new Error(`Dzienny limit ${API_LIMITS.translationsPerDay} tłumaczeń został wyczerpany. Spróbuj jutro.`);
      }

      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];

        try {
          // 1. Speech to text
          const speechResponse = await fetch('/api/speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Data,
              language: currentLanguagePair.from,
            }),
          });

          if (!speechResponse.ok) {
            throw new Error('Błąd podczas rozpoznawania mowy');
          }

          const speechData = await speechResponse.json();
          if (speechData.error) {
            setApiError(`AssemblyAI: ${speechData.error}`);
            return;
          }
          const text = speechData.text;
          setOriginalText(text);

          // 2. Translation
          const translateResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              from: currentLanguagePair.from,
              to: currentLanguagePair.to,
            }),
          });

          if (!translateResponse.ok) {
            throw new Error('Błąd podczas tłumaczenia');
          }

          const translateData = await translateResponse.json();
          if (translateData.error) {
            setApiError(`DeepSeek: ${translateData.error}`);
            return;
          }
          const translation = translateData.translation;
          setTranslatedText(translation);

          // Save to history
          addTranslation({
            originalText: text,
            translatedText: translation,
            from: currentLanguagePair.from,
            to: currentLanguagePair.to,
            type: 'voice',
          });

          // Increment daily count
          incrementDailyCount();

        } catch (err) {
          console.error('API error:', err);
          setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania');
        }
      };

      reader.onerror = () => {
        setError('Błąd podczas przetwarzania nagrania');
      };

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-red-50 to-white">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-700 hover:text-gray-900 mb-6 text-xl font-semibold"
        >
          <ArrowLeft className="mr-2" size={32} />
          Powrót
        </button>

        <h1 className="text-4xl font-bold mb-8 text-center text-red-700">🎤 Tłumaczenie głosowe</h1>

        <div className="flex justify-center mb-8">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-4 rounded-2xl mb-6 text-xl font-semibold">
            ⚠️ {error}
          </div>
        )}
        
        {apiError && (
          <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-4 rounded-2xl mb-6">
            <p className="text-xl font-semibold mb-2">🔧 Problem z API:</p>
            <p className="text-lg">{apiError}</p>
            <p className="text-sm mt-2">Spróbuj użyć gotowych zwrotów - działają bez internetu!</p>
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

        <div className="mt-8 bg-blue-50 p-4 rounded-2xl">
          <p className="text-center text-lg text-blue-800 font-semibold">
            Pozostało tłumaczeń dzisiaj: {API_LIMITS.translationsPerDay - dailyTranslationCount}
          </p>
          <p className="text-center text-sm text-blue-600 mt-2">
            💡 Wskazówka: Użyj gotowych zwrotów - działają bez limitu!
          </p>
        </div>
      </div>
    </main>
  );
}