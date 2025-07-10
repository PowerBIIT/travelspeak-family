'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';

type Language = 'pl' | 'en' | 'fr';

const languages: Record<Language, { name: string; flag: string; hello: string }> = {
  pl: { name: 'Polski', flag: '🇵🇱', hello: 'Cześć!' },
  en: { name: 'English', flag: '🇬🇧', hello: 'Hello!' },
  fr: { name: 'Français', flag: '🇫🇷', hello: 'Bonjour!' },
};

export default function Home() {
  const [activeLang, setActiveLang] = useState<Language>('pl');
  const [isRecording, setIsRecording] = useState(false);
  const [lastTranslation, setLastTranslation] = useState<{
    original: string;
    translated: string;
    from: Language;
    to: Language;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Automatycznie wybierz języki docelowe na podstawie aktywnego języka
  const getTargetLanguages = (sourceLang: Language): Language[] => {
    const allLangs: Language[] = ['pl', 'en', 'fr'];
    return allLangs.filter(lang => lang !== sourceLang);
  };

  const cycleLanguage = () => {
    const langs: Language[] = ['pl', 'en', 'fr'];
    const currentIndex = langs.indexOf(activeLang);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    setActiveLang(nextLang);
    setError(null);
  };

  useEffect(() => {
    if (recordingTime > 0) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 100);
      }, 100);
    } else if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [recordingTime]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Sprawdź obsługiwane formaty
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        
        // Automatycznie tłumacz na wszystkie inne języki
        const targetLangs = getTargetLanguages(activeLang);
        await processRecording(audioBlob, activeLang, targetLangs);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(1);
      setPulseAnimation(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Nie mogę uzyskać dostępu do mikrofonu. Sprawdź uprawnienia w przeglądarce.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setPulseAnimation(false);
    }
  };

  const processRecording = async (audioBlob: Blob, from: Language, targetLangs: Language[]) => {
    setIsTranslating(true);
    setError(null);
    
    try {
      // 1. Convert speech to text using OpenAI Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', from);
      
      const speechResponse = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      if (!speechResponse.ok) throw new Error('Błąd rozpoznawania mowy');
      
      const { text } = await speechResponse.json();
      
      // 2. Translate to first target language (for display)
      const primaryTarget = targetLangs[0];
      const translateResponse = await fetch('/api/translate-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from, to: primaryTarget }),
      });
      
      if (!translateResponse.ok) throw new Error('Błąd tłumaczenia');
      
      const { translation } = await translateResponse.json();
      
      setLastTranslation({
        original: text,
        translated: translation,
        from,
        to: primaryTarget,
      });
      
      // 3. Play translation using OpenAI TTS
      await playTranslation(translation, primaryTarget);
      
    } catch (error) {
      console.error('Error processing:', error);
      setError('Wystąpił błąd. Sprawdź połączenie internetowe i spróbuj ponownie.');
    } finally {
      setIsTranslating(false);
    }
  };

  const playTranslation = async (text: string, language: Language) => {
    try {
      const response = await fetch('/api/tts-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      
      if (!response.ok) throw new Error('Błąd syntezy mowy');
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-2 text-white drop-shadow-2xl">
            TravelSpeak
          </h1>
          <p className="text-white/80 text-lg">v3.0</p>
        </div>

        {/* Language Selector */}
        <div className="mb-12">
          <button
            onClick={cycleLanguage}
            className="mx-auto flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-full px-8 py-4 hover:bg-white/30 transition-all"
          >
            <span className="text-5xl">{languages[activeLang].flag}</span>
            <div className="text-left">
              <p className="text-white text-sm opacity-80">Mówię po</p>
              <p className="text-white text-2xl font-bold">{languages[activeLang].name}</p>
            </div>
          </button>
        </div>

        {/* Main Record Button */}
        <div className="relative mb-12">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isTranslating}
            className={`mx-auto flex relative w-48 h-48 md:w-56 md:h-56 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 scale-110' 
                : 'bg-white hover:scale-105'
            } ${isTranslating ? 'opacity-50' : ''}`}
          >
            {/* Pulse animation */}
            {pulseAnimation && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping animation-delay-200 opacity-50"></span>
              </>
            )}
            
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {isRecording ? (
                <>
                  <div className="w-16 h-16 bg-white rounded-lg animate-pulse" />
                  <p className="text-white text-lg font-medium mt-2">Nagrywam...</p>
                  <p className="text-white/80 text-sm">{(recordingTime / 1000).toFixed(1)}s</p>
                </>
              ) : isTranslating ? (
                <>
                  <Loader2 size={64} className="text-purple-600 animate-spin" />
                  <p className="text-purple-600 text-lg font-medium mt-2">Tłumaczę...</p>
                </>
              ) : (
                <>
                  <Mic size={64} className="text-purple-600" />
                  <p className="text-purple-600 text-lg font-medium mt-2">Przytrzymaj</p>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Target Languages Display */}
        <div className="text-center mb-8">
          <p className="text-white/70 text-sm mb-2">Tłumaczę na:</p>
          <div className="flex justify-center gap-6">
            {getTargetLanguages(activeLang).map((lang) => (
              <div key={lang} className="flex items-center gap-2">
                <span className="text-3xl">{languages[lang].flag}</span>
                <span className="text-white text-lg">{languages[lang].name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-2xl p-4 max-w-md mx-auto">
            <p className="text-white text-center">{error}</p>
          </div>
        )}

        {/* Translation Result */}
        {lastTranslation && !isTranslating && !error && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{languages[lastTranslation.from].flag}</span>
                <p className="text-gray-600 font-medium">Usłyszałem:</p>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{lastTranslation.original}</p>
            </div>
            
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{languages[lastTranslation.to].flag}</span>
                <p className="text-gray-600 font-medium">Tłumaczenie:</p>
                <button
                  onClick={() => playTranslation(lastTranslation.translated, lastTranslation.to)}
                  className="ml-auto p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{lastTranslation.translated}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center mt-8">
          <p className="text-white/70 text-sm">
            Wybierz język klikając flagę • Przytrzymaj przycisk i mów
          </p>
        </div>
      </div>

    </main>
  );
}