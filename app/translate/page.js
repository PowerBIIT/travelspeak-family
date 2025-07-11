'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TranslatePage() {
  const [activeLang, setActiveLang] = useState('pl');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranslation, setLastTranslation] = useState(null);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const router = useRouter();

  const languages = {
    pl: { name: 'Polski', flag: '🇵🇱' },
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
  };

  const getTargetLanguages = (sourceLang) => {
    return Object.keys(languages).filter(lang => lang !== sourceLang);
  };

  const startRecording = async () => {
    try {
      setError('');
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
        await processRecording(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Nie mogę uzyskać dostępu do mikrofonu. Sprawdź uprawnienia.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async (audioBlob) => {
    setIsProcessing(true);
    setError('');
    
    try {
      // 1. Speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', activeLang);
      
      const whisperResponse = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      if (!whisperResponse.ok) {
        const errorData = await whisperResponse.json();
        throw new Error(errorData.error || 'Błąd rozpoznawania mowy');
      }
      
      const { text } = await whisperResponse.json();
      
      // 2. Translation
      const targetLangs = getTargetLanguages(activeLang);
      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          from: activeLang, 
          to: targetLangs[0] // Główny język docelowy
        }),
      });
      
      if (!translateResponse.ok) {
        throw new Error('Błąd tłumaczenia');
      }
      
      const { translation } = await translateResponse.json();
      
      setLastTranslation({
        original: text,
        translated: translation,
        from: activeLang,
        to: targetLangs[0],
      });
      
      // 3. Text to speech
      await playTranslation(translation, targetLangs[0]);
      
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'Wystąpił błąd. Sprawdź połączenie internetowe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playTranslation = async (text, language) => {
    try {
      const response = await fetch('/api/tts', {
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

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom right, #4f46e5, #9333ea, #ec4899)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'rgba(0, 0, 0, 0.1)',
    },
    title: {
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    logoutButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    languageSelector: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '3rem',
    },
    langButton: (isActive) => ({
      background: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(8px)',
      padding: '1rem 2rem',
      borderRadius: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }),
    flag: {
      fontSize: '2rem',
    },
    langName: (isActive) => ({
      color: isActive ? '#1f2937' : 'white',
      fontWeight: isActive ? 'bold' : 'normal',
    }),
    recordButton: {
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: isRecording ? '#ef4444' : 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.2s',
      transform: isRecording ? 'scale(1.1)' : 'scale(1)',
      opacity: isProcessing ? 0.5 : 1,
    },
    micIcon: {
      fontSize: '4rem',
      marginBottom: '0.5rem',
    },
    buttonText: {
      color: isRecording ? 'white' : '#4f46e5',
      fontWeight: 'bold',
      fontSize: '1.125rem',
    },
    status: {
      marginTop: '2rem',
      color: 'white',
      fontSize: '1.125rem',
      minHeight: '2rem',
    },
    translation: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      padding: '2rem',
      marginTop: '2rem',
      maxWidth: '600px',
      width: '100%',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    },
    translationSection: {
      marginBottom: '1.5rem',
    },
    translationLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      color: '#6b7280',
      fontSize: '0.875rem',
    },
    translationText: {
      fontSize: '1.25rem',
      color: '#1f2937',
      lineHeight: 1.6,
    },
    divider: {
      height: '1px',
      background: '#e5e7eb',
      margin: '1.5rem 0',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.9)',
      color: 'white',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginTop: '1rem',
      maxWidth: '400px',
    },
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>TravelSpeak Family</h1>
        <button 
          onClick={handleLogout}
          style={styles.logoutButton}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          Wyloguj się
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.languageSelector}>
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => setActiveLang(code)}
              style={styles.langButton(activeLang === code)}
            >
              <span style={styles.flag}>{lang.flag}</span>
              <span style={styles.langName(activeLang === code)}>{lang.name}</span>
            </button>
          ))}
        </div>

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isProcessing}
          style={styles.recordButton}
        >
          <div style={styles.micIcon}>
            {isRecording ? '🔴' : '🎤'}
          </div>
          <div style={styles.buttonText}>
            {isRecording ? 'Nagrywam...' : isProcessing ? 'Przetwarzam...' : 'Przytrzymaj'}
          </div>
        </button>

        <div style={styles.status}>
          {isProcessing && 'Tłumaczę...'}
          {!isProcessing && !error && lastTranslation && 'Gotowe!'}
        </div>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {lastTranslation && !isProcessing && (
          <div style={styles.translation}>
            <div style={styles.translationSection}>
              <div style={styles.translationLabel}>
                <span>{languages[lastTranslation.from].flag}</span>
                <span>Usłyszałem:</span>
              </div>
              <div style={styles.translationText}>
                {lastTranslation.original}
              </div>
            </div>
            
            <div style={styles.divider} />
            
            <div style={styles.translationSection}>
              <div style={styles.translationLabel}>
                <span>{languages[lastTranslation.to].flag}</span>
                <span>Tłumaczenie:</span>
              </div>
              <div style={styles.translationText}>
                {lastTranslation.translated}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}