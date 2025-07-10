'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';

type Language = 'pl' | 'en' | 'fr';

const languages: Record<Language, { name: string; flag: string }> = {
  pl: { name: 'Polski', flag: '🇵🇱' },
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
};

export default function Home() {
  const [sourceLang, setSourceLang] = useState<Language>('pl');
  const [targetLang, setTargetLang] = useState<Language>('en');
  const [isRecording, setIsRecording] = useState<'source' | 'target' | null>(null);
  const [lastTranslation, setLastTranslation] = useState<{
    original: string;
    translated: string;
    from: Language;
    to: Language;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const cycleLanguage = (current: Language, isSource: boolean) => {
    const langs: Language[] = ['pl', 'en', 'fr'];
    const currentIndex = langs.indexOf(current);
    let nextLang: Language;
    
    do {
      nextLang = langs[(currentIndex + 1) % langs.length];
    } while (nextLang === (isSource ? targetLang : sourceLang));
    
    if (isSource) {
      setSourceLang(nextLang);
    } else {
      setTargetLang(nextLang);
    }
  };

  const startRecording = async (side: 'source' | 'target') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        const fromLang = side === 'source' ? sourceLang : targetLang;
        const toLang = side === 'source' ? targetLang : sourceLang;
        
        await processRecording(audioBlob, fromLang, toLang);
      };
      
      mediaRecorder.start();
      setIsRecording(side);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Nie mogę uzyskać dostępu do mikrofonu!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(null);
    }
  };

  const processRecording = async (audioBlob: Blob, from: Language, to: Language) => {
    setIsTranslating(true);
    
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
      
      // 2. Translate text using OpenAI GPT-4
      const translateResponse = await fetch('/api/translate-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from, to }),
      });
      
      if (!translateResponse.ok) throw new Error('Błąd tłumaczenia');
      
      const { translation } = await translateResponse.json();
      
      setLastTranslation({
        original: text,
        translated: translation,
        from,
        to,
      });
      
      // 3. Play translation using OpenAI TTS
      await playTranslation(translation, to);
      
    } catch (error) {
      console.error('Error processing:', error);
      alert('Wystąpił błąd podczas przetwarzania');
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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-purple-600">
      <h1 className="text-6xl font-bold mb-12 text-white text-center drop-shadow-lg">
        🌍 TravelSpeak
      </h1>
      
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
      
      {lastTranslation && !isTranslating && (
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