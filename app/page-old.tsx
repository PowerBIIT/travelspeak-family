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
      
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <h1 className="text-7xl font-bold mb-2 text-white drop-shadow-2xl">
          TravelSpeak
        </h1>
        <p className="text-white/80 text-lg mb-12">v3.0</p>
      
      {/* Language swap button */}
      <button
        onClick={swapLanguages}
        className="mb-8 p-4 bg-white/20 backdrop-blur rounded-full text-5xl hover:bg-white/30 transition-all active:scale-95"
      >
        ↔️
      </button>
      
      {/* Two speaker buttons */}
      <div className="flex gap-8 w-full max-w-4xl">
        {/* Source language button */}
        <button
          onMouseDown={() => startRecording('source')}
          onMouseUp={stopRecording}
          onTouchStart={() => startRecording('source')}
          onTouchEnd={stopRecording}
          disabled={isTranslating || isRecording === 'target'}
          className={`flex-1 aspect-square rounded-3xl flex flex-col items-center justify-center transition-all transform ${
            isRecording === 'source' 
              ? 'bg-red-600 scale-95 shadow-inner' 
              : 'bg-white shadow-2xl hover:scale-105 active:scale-95'
          } ${isTranslating ? 'opacity-50' : ''}`}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              cycleLanguage(sourceLang, true);
            }}
            className="cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="text-8xl mb-4 block">{languages[sourceLang].flag}</span>
            <p className="text-3xl font-bold mb-2">{languages[sourceLang].name}</p>
          </div>
          {isRecording === 'source' ? (
            <>
              <Square size={64} className="text-white animate-pulse" />
              <p className="text-xl text-white mt-2">Nagrywam...</p>
            </>
          ) : (
            <>
              <Mic size={64} className="text-gray-700" />
              <p className="text-xl text-gray-600 mt-2">Przytrzymaj i mów</p>
            </>
          )}
        </button>
        
        {/* Target language button */}
        <button
          onMouseDown={() => startRecording('target')}
          onMouseUp={stopRecording}
          onTouchStart={() => startRecording('target')}
          onTouchEnd={stopRecording}
          disabled={isTranslating || isRecording === 'source'}
          className={`flex-1 aspect-square rounded-3xl flex flex-col items-center justify-center transition-all transform ${
            isRecording === 'target' 
              ? 'bg-red-600 scale-95 shadow-inner' 
              : 'bg-white shadow-2xl hover:scale-105 active:scale-95'
          } ${isTranslating ? 'opacity-50' : ''}`}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              cycleLanguage(targetLang, false);
            }}
            className="cursor-pointer hover:scale-110 transition-transform"
          >
            <span className="text-8xl mb-4 block">{languages[targetLang].flag}</span>
            <p className="text-3xl font-bold mb-2">{languages[targetLang].name}</p>
          </div>
          {isRecording === 'target' ? (
            <>
              <Square size={64} className="text-white animate-pulse" />
              <p className="text-xl text-white mt-2">Nagrywam...</p>
            </>
          ) : (
            <>
              <Mic size={64} className="text-gray-700" />
              <p className="text-xl text-gray-600 mt-2">Przytrzymaj i mów</p>
            </>
          )}
        </button>
      </div>
      
      {/* Translation display */}
      {isTranslating && (
        <div className="mt-8 text-white text-2xl animate-pulse">
          Tłumaczę...
        </div>
      )}
      
      {error && (
        <div className="mt-8 bg-red-500/20 backdrop-blur border border-red-500 rounded-xl p-4 max-w-md">
          <p className="text-white text-center">{error}</p>
        </div>
      )}
      
      {lastTranslation && !isTranslating && !error && (
        <div className="mt-8 w-full max-w-4xl bg-white/90 backdrop-blur rounded-3xl p-6 shadow-2xl">
          <div className="mb-4">
            <p className="text-lg text-gray-600 mb-1">
              {languages[lastTranslation.from].flag} Usłyszałem:
            </p>
            <p className="text-2xl font-semibold">{lastTranslation.original}</p>
          </div>
          <div className="border-t pt-4">
            <p className="text-lg text-gray-600 mb-1 flex items-center gap-2">
              {languages[lastTranslation.to].flag} Tłumaczenie:
              <button
                onClick={() => playTranslation(lastTranslation.translated, lastTranslation.to)}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                <Volume2 size={20} />
              </button>
            </p>
            <p className="text-2xl font-semibold">{lastTranslation.translated}</p>
          </div>
        </div>
      )}
    </main>
  );
}