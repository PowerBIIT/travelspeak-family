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
  const { currentLanguagePair, addTranslation, fontSize, incrementDailyCount, dailyTranslationCount, checkAndResetDailyCount } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const fontSizeClass = fontSize === 'elderly' ? 'text-elderly' : fontSize === 'large' ? 'text-xl' : 'text-base';

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

          const { text } = await speechResponse.json();
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

          const { translation } = await translateResponse.json();
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

  const handlePlayAudio = async () => {
    if (!translatedText || isPlayingAudio) return;

    setIsPlayingAudio(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatedText,
          language: currentLanguagePair.to,
        }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas generowania audio');
      }

      const audioData = await response.arrayBuffer();
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setIsPlayingAudio(false);
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

        <h1 className="text-2xl font-bold mb-8 text-center">Tłumaczenie głosowe</h1>

        <div className="flex justify-center mb-8">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />
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
            onPlayAudio={handlePlayAudio}
            isPlayingAudio={isPlayingAudio}
          />
        )}

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Pozostało tłumaczeń dzisiaj: {API_LIMITS.translationsPerDay - dailyTranslationCount}</p>
        </div>
      </div>
    </main>
  );
}