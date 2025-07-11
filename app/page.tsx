'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2 } from 'lucide-react';

type Language = 'pl' | 'en' | 'fr';

const languages: Record<Language, { name: string; flag: string }> = {
  pl: { name: 'Polski', flag: '🇵🇱' },
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        
        const targetLangs = getTargetLanguages(activeLang);
        await processRecording(audioBlob, activeLang, targetLangs);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(1);
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
    }
  };

  const processRecording = async (audioBlob: Blob, from: Language, targetLangs: Language[]) => {
    setIsTranslating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', from);
      
      const speechResponse = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      if (!speechResponse.ok) throw new Error('Błąd rozpoznawania mowy');
      
      const { text } = await speechResponse.json();
      
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

  const styles = {
    main: {
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(to bottom right, #4f46e5, #9333ea, #ec4899)',
      position: 'relative' as const,
    },
    overlay: {
      position: 'absolute' as const,
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    container: {
      position: 'relative' as const,
      zIndex: 10,
      width: '100%',
      maxWidth: '42rem',
      margin: '0 auto',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '3rem',
    },
    title: {
      fontSize: '4rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: 'white',
      textShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    },
    version: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '1.125rem',
    },
    languageButton: {
      margin: '0 auto 3rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(8px)',
      borderRadius: '9999px',
      padding: '1rem 2rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    recordButton: {
      margin: '0 auto',
      display: 'flex',
      position: 'relative' as const,
      width: '14rem',
      height: '14rem',
      borderRadius: '50%',
      transition: 'all 0.2s',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: isRecording ? '#ef4444' : 'white',
      transform: isRecording ? 'scale(1.1)' : 'scale(1)',
      opacity: isTranslating ? 0.5 : 1,
    },
    recordContent: {
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    targetLanguages: {
      textAlign: 'center' as const,
      margin: '3rem 0 2rem',
    },
    translation: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: '1.5rem',
      padding: '1.5rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      maxWidth: '42rem',
      margin: '0 auto',
    },
  };

  return (
    <main style={styles.main}>
      <div style={styles.overlay} />
      
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>TravelSpeak</h1>
          <p style={styles.version}>v3.0.1</p>
        </div>

        <button onClick={cycleLanguage} style={styles.languageButton}>
          <span style={{ fontSize: '3rem' }}>{languages[activeLang].flag}</span>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: 'white', fontSize: '0.875rem', opacity: 0.8 }}>Mówię po</p>
            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {languages[activeLang].name}
            </p>
          </div>
        </button>

        <div style={{ marginBottom: '3rem' }}>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isTranslating}
            style={styles.recordButton}
          >
            <div style={styles.recordContent}>
              {isRecording ? (
                <>
                  <div style={{
                    width: '4rem',
                    height: '4rem',
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                  }} />
                  <p style={{ color: 'white', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                    Nagrywam...
                  </p>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
                    {(recordingTime / 1000).toFixed(1)}s
                  </p>
                </>
              ) : isTranslating ? (
                <>
                  <Loader2 size={64} color="#9333ea" />
                  <p style={{ color: '#9333ea', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                    Tłumaczę...
                  </p>
                </>
              ) : (
                <>
                  <Mic size={64} color="#9333ea" />
                  <p style={{ color: '#9333ea', fontSize: '1.125rem', marginTop: '0.5rem' }}>
                    Przytrzymaj
                  </p>
                </>
              )}
            </div>
          </button>
        </div>

        <div style={styles.targetLanguages}>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Tłumaczę na:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {getTargetLanguages(activeLang).map((lang) => (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.875rem' }}>{languages[lang].flag}</span>
                <span style={{ color: 'white', fontSize: '1.125rem' }}>{languages[lang].name}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            marginBottom: '2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            maxWidth: '28rem',
            margin: '0 auto 2rem',
          }}>
            <p style={{ color: 'white', textAlign: 'center' }}>{error}</p>
          </div>
        )}

        {lastTranslation && !isTranslating && !error && (
          <div style={styles.translation}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.875rem' }}>{languages[lastTranslation.from].flag}</span>
                <p style={{ color: '#4b5563', fontWeight: 500 }}>Usłyszałem:</p>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
                {lastTranslation.original}
              </p>
            </div>
            
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.875rem' }}>{languages[lastTranslation.to].flag}</span>
                <p style={{ color: '#4b5563', fontWeight: 500 }}>Tłumaczenie:</p>
                <button
                  onClick={() => playTranslation(lastTranslation.translated, lastTranslation.to)}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.75rem',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={20} />
                </button>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
                {lastTranslation.translated}
              </p>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
            Wybierz język klikając flagę • Przytrzymaj przycisk i mów
          </p>
        </div>
      </div>
    </main>
  );
}