'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TranslatePage() {
  const [sourceLang, setSourceLang] = useState('pl');
  const [targetLang, setTargetLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranslation, setLastTranslation] = useState(null);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const [showPhrases, setShowPhrases] = useState(false);
  const [offlinePhrases, setOfflinePhrases] = useState(null);
  const [lastAudioUrl, setLastAudioUrl] = useState(null);
  
  // Nowe stany dla trybu konwersacji
  const [conversationMode, setConversationMode] = useState(false);
  const [conversationLangs, setConversationLangs] = useState(['pl', 'fr']);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  
  // Nowe stany dla OCR
  const [showOCR, setShowOCR] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const isRecordingRef = useRef(false);
  const router = useRouter();

  const languages = {
    pl: { name: 'Polski', flag: '🇵🇱' },
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
  };
  
  const getTargetLanguages = (sourceLang) => {
    return Object.keys(languages).filter(lang => lang !== sourceLang);
  };

  // Sprawdzanie uprawnień do mikrofonu przy starcie
  useEffect(() => {
    checkMicrophonePermission();
    loadOfflinePhrases();
    checkOCRFeature();
    
    return () => {
      // Cleanup przy odmontowywaniu
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      setHasPermission(result.state === 'granted');
      
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted');
      });
    } catch (error) {
      console.log('Permission API not supported, will check on first use');
      setHasPermission(true); // Assume true, will check on actual use
    }
  };

  const loadOfflinePhrases = async () => {
    try {
      const response = await fetch('/api/offline-phrases');
      const data = await response.json();
      setOfflinePhrases(data);
    } catch (error) {
      console.error('Failed to load offline phrases:', error);
    }
  };

  const checkOCRFeature = async () => {
    try {
      const response = await fetch('/api/ocr');
      const data = await response.json();
      setOcrEnabled(data.enabled);
    } catch (error) {
      console.error('Failed to check OCR feature:', error);
      setOcrEnabled(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Sprawdź rozmiar pliku (max 4MB)
      if (file.size > 4 * 1024 * 1024) {
        setError('Obraz jest za duży. Maksymalny rozmiar to 4MB');
        return;
      }
      
      // Sprawdź typ pliku
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Nieobsługiwany format. Użyj JPEG, PNG lub WebP');
        return;
      }
      
      setSelectedImage(file);
      setShowOCR(true);
      setError('');
      
      // Pokaż podgląd
      const reader = new FileReader();
      reader.onload = (e) => {
        // Możemy dodać podgląd obrazu później
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = async () => {
    if (!selectedImage) return;
    
    setOcrProcessing(true);
    setError('');
    setOcrResult(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('targetLang', conversationMode ? conversationLangs[0] : targetLang);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd przetwarzania obrazu');
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setOcrResult(data);
        
        // Ustaw tłumaczenie jak przy normalnym tłumaczeniu
        setLastTranslation({
          original: data.original_text,
          translated: data.translated_text,
          from: data.detected_language || 'unknown',
          to: data.targetLang,
          isFromOCR: true
        });
        
        // Odtwórz audio jeśli jest tłumaczenie
        if (data.translated_text) {
          await playTranslation(data.translated_text, data.targetLang);
        }
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      setError(error.message || 'Wystąpił błąd podczas przetwarzania obrazu');
    } finally {
      setOcrProcessing(false);
      setShowOCR(false);
      setSelectedImage(null);
    }
  };

  const startRecording = async () => {
    // Zabezpieczenie przed wielokrotnym startem
    if (isRecordingRef.current) return;
    
    try {
      setError('');
      setRecordingTime(0);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      setHasPermission(true);
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Czyszczenie strumienia
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Czyszczenie timerów
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        setRecordingTime(0);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          await processRecording(audioBlob);
        }
      };
      
      mediaRecorder.start(100); // Chunk co 100ms
      setIsRecording(true);
      isRecordingRef.current = true;
      
      // Timer 30 sekund
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
      
      // Licznik czasu
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      isRecordingRef.current = false;
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Brak dostępu do mikrofonu. Nadaj uprawnienia w ustawieniach przeglądarki.');
        setHasPermission(false);
      } else if (error.name === 'NotFoundError') {
        setError('Nie znaleziono mikrofonu. Sprawdź czy urządzenie jest podłączone.');
      } else {
        setError('Nie mogę uzyskać dostępu do mikrofonu. Spróbuj ponownie.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const processRecording = async (audioBlob) => {
    setIsProcessing(true);
    setError('');
    setDetectedLanguage(null);
    
    try {
      // 1. Speech to text
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      if (conversationMode) {
        // W trybie konwersacji - auto wykrywanie języka
        formData.append('autoDetect', 'true');
      } else {
        // W trybie standardowym - określony język
        formData.append('language', sourceLang);
      }
      
      console.log('Sending audio to Whisper:', {
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
        mode: conversationMode ? 'conversation' : 'standard',
        language: conversationMode ? 'auto-detect' : sourceLang
      });
      
      const whisperResponse = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });
      
      if (!whisperResponse.ok) {
        const errorData = await whisperResponse.json();
        console.error('Whisper API error:', errorData);
        throw new Error(errorData.error || 'Błąd rozpoznawania mowy');
      }
      
      const whisperData = await whisperResponse.json();
      const { text, detectedLanguage: detected } = whisperData;
      
      let actualSourceLang = sourceLang;
      let actualTargetLang = targetLang;
      
      if (conversationMode && detected) {
        // Ustaw wykryty język
        setDetectedLanguage(detected);
        
        // Automatycznie wybierz język docelowy
        if (conversationLangs.includes(detected)) {
          // Znajdź drugi język z pary
          actualSourceLang = detected;
          actualTargetLang = conversationLangs.find(lang => lang !== detected);
        } else {
          // Jeśli wykryto język spoza pary, załóż że to pierwszy język z pary (może być zniekształcony)
          console.warn(`Wykryto język ${detected} spoza wybranej pary [${conversationLangs.join(', ')}]`);
          // Używamy domyślnego języka źródłowego z pary
          actualSourceLang = conversationLangs[0];
          actualTargetLang = conversationLangs[1];
        }
      }
      
      // 2. Translation
      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          from: actualSourceLang, 
          to: actualTargetLang
        }),
      });
      
      if (!translateResponse.ok) {
        throw new Error('Błąd tłumaczenia');
      }
      
      const { translation } = await translateResponse.json();
      
      setLastTranslation({
        original: text,
        translated: translation,
        from: actualSourceLang || 'unknown',
        to: actualTargetLang || 'unknown',
        detectedLanguage: detected,
      });
      
      // 3. Text to speech
      await playTranslation(translation, actualTargetLang);
      
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'Wystąpił błąd. Sprawdź połączenie internetowe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playTranslation = async (text, language) => {
    // Jeśli istnieje poprzednie audio, usuń je
    if (lastAudioUrl) {
      URL.revokeObjectURL(lastAudioUrl);
    }
    
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
      
      // Zapisz URL do ponownego odtworzenia
      setLastAudioUrl(audioUrl);
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const replayAudio = () => {
    if (lastAudioUrl) {
      const audio = new Audio(lastAudioUrl);
      audio.play();
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
      padding: '0.75rem 1rem',
      background: 'rgba(0, 0, 0, 0.1)',
    },
    title: {
      color: 'white',
      fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
      fontWeight: 'bold',
    },
    logoutButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '0.5rem 0.75rem',
      borderRadius: '0.5rem',
      fontSize: '0.75rem',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowX: 'hidden',
    },
    languageSelector: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    modeSelector: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      justifyContent: 'center',
    },
    modeButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
      border: 'none',
      backdropFilter: 'blur(8px)',
    },
    modeButtonActive: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#1f2937',
      fontWeight: 'bold',
    },
    conversationSelector: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '2rem',
      gap: '0.5rem',
    },
    conversationInfo: {
      color: 'white',
      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
      marginBottom: '0.5rem',
    },
    languagePair: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    conversationArrow: {
      fontSize: '1.5rem',
      color: 'white',
    },
    detectedLanguage: {
      marginTop: '0.5rem',
      padding: '0.5rem 1rem',
      background: 'rgba(34, 197, 94, 0.2)',
      borderRadius: '0.5rem',
      color: 'white',
      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    },
    langButton: (isActive) => ({
      background: isActive ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(8px)',
      padding: '0.75rem 1.25rem',
      borderRadius: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      minHeight: '48px',
    }),
    flag: {
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    },
    langName: (isActive) => ({
      color: isActive ? '#1f2937' : 'white',
      fontWeight: isActive ? 'bold' : 'normal',
    }),
    recordButton: {
      width: 'min(50vw, 200px)',
      height: 'min(50vw, 200px)',
      borderRadius: '50%',
      background: 'white',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.2s',
      transform: 'scale(1)',
      border: 'none',
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
      userSelect: 'none',
    },
    recordButtonActive: {
      background: '#ef4444',
      transform: 'scale(1.1)',
      animation: 'pulse 1.5s infinite',
    },
    micIcon: {
      fontSize: 'clamp(3rem, 8vw, 4rem)',
      marginBottom: '0.5rem',
    },
    buttonText: (isRecording) => ({
      color: isRecording ? 'white' : '#4f46e5',
      fontWeight: 'bold',
      fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
    }),
    status: {
      marginTop: '1.5rem',
      color: 'white',
      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
      minHeight: '2rem',
    },
    translation: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      padding: 'clamp(1rem, 3vw, 2rem)',
      marginTop: '1.5rem',
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
      fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
      color: '#1f2937',
      lineHeight: 1.6,
      wordBreak: 'break-word',
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
    phrasesButton: {
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '0.75rem 1.25rem',
      borderRadius: '2rem',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
      cursor: 'pointer',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      fontWeight: 'bold',
      color: '#4f46e5',
      transition: 'all 0.2s',
      border: 'none',
      minHeight: '48px',
    },
    phrasesModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000,
    },
    phrasesContent: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      maxWidth: '600px',
      width: 'calc(100% - 2rem)',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    phrasesHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    phrasesTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    closeButton: {
      background: 'none',
      fontSize: '2rem',
      cursor: 'pointer',
      color: '#6b7280',
      border: 'none',
    },
    categoryTitle: {
      fontSize: 'clamp(1.1rem, 3vw, 1.25rem)',
      fontWeight: 'bold',
      color: '#4f46e5',
      marginTop: '1.5rem',
      marginBottom: '0.75rem',
      textTransform: 'capitalize',
    },
    phraseItem: {
      background: '#f3f4f6',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      minHeight: '48px',
    },
    phraseOriginal: {
      fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
      color: '#1f2937',
      marginBottom: '0.25rem',
    },
    phraseTranslation: {
      fontSize: '0.875rem',
      color: '#6b7280',
    },
    arrow: {
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      margin: '0 0.5rem',
      display: 'flex',
      alignItems: 'center',
    },
    swapButton: {
      background: 'rgba(255, 255, 255, 0.3)',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '0.5rem',
      marginLeft: '0.5rem',
      fontSize: '1.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '40px',
      minHeight: '40px',
    },
    replayButton: {
      background: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.25rem',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
    },
    resetButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.25rem',
      fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
    },
    translationButtons: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    actionButtons: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem',
      marginBottom: '1rem',
    },
    cameraButton: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '1rem',
      padding: '1rem 1.5rem',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s',
      border: 'none',
      minWidth: '100px',
    },
    cameraIcon: {
      fontSize: 'clamp(2rem, 5vw, 2.5rem)',
    },
    cameraText: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      color: '#4f46e5',
      fontWeight: 'bold',
    },
    ocrModal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 2000,
    },
    ocrContent: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    ocrHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    ocrTitle: {
      fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    imagePreview: {
      width: '100%',
      maxHeight: '300px',
      objectFit: 'contain',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
    },
    ocrButtons: {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'flex-end',
    },
    ocrButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: 'bold',
      transition: 'all 0.2s',
    },
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          70% {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 20px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
      <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>TravelSpeak Family <span style={{fontSize: '0.75rem', opacity: 0.7}}>v3.7.0</span></h1>
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
        {/* Przełącznik trybu */}
        <div style={styles.modeSelector}>
          <button
            onClick={() => setConversationMode(false)}
            style={{
              ...styles.modeButton,
              ...(conversationMode === false && styles.modeButtonActive)
            }}
          >
            🎯 Tryb standardowy
          </button>
          <button
            onClick={() => setConversationMode(true)}
            style={{
              ...styles.modeButton,
              ...(conversationMode === true && styles.modeButtonActive)
            }}
          >
            💬 Konwersacja
          </button>
        </div>

        {/* Wybór języków - różny dla każdego trybu */}
        {!conversationMode ? (
          // Tryb standardowy - obecny interfejs
          <div style={styles.languageSelector}>
            <button
              onClick={() => {
                const newSource = sourceLang === 'pl' ? 'en' : sourceLang === 'en' ? 'fr' : 'pl';
                if (newSource === targetLang) {
                  setTargetLang(sourceLang);
                }
                setSourceLang(newSource);
              }}
              style={styles.langButton(true)}
            >
              <span style={styles.flag}>{languages[sourceLang].flag}</span>
              <span style={styles.langName(true)}>{languages[sourceLang].name}</span>
            </button>
            
            <div style={styles.arrow}>→</div>
            
            <button
              onClick={() => {
                const newTarget = targetLang === 'en' ? 'fr' : targetLang === 'fr' ? 'pl' : 'en';
                if (newTarget === sourceLang) {
                  setSourceLang(targetLang);
                }
                setTargetLang(newTarget);
              }}
              style={styles.langButton(true)}
            >
              <span style={styles.flag}>{languages[targetLang].flag}</span>
              <span style={styles.langName(true)}>{languages[targetLang].name}</span>
            </button>
            
            <button
              onClick={() => {
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }}
              style={styles.swapButton}
              title="Zamień języki"
            >
              ⇄
            </button>
          </div>
        ) : (
          // Tryb konwersacji - wybór pary języków
          <div style={styles.conversationSelector}>
            <div style={styles.conversationInfo}>
              Rozmowa między:
            </div>
            <div style={styles.languagePair}>
              <button
                onClick={() => {
                  const lang1 = conversationLangs[0];
                  const nextLang = lang1 === 'pl' ? 'en' : lang1 === 'en' ? 'fr' : 'pl';
                  setConversationLangs([nextLang, conversationLangs[1] === nextLang ? (nextLang === 'pl' ? 'en' : 'pl') : conversationLangs[1]]);
                }}
                style={styles.langButton(true)}
              >
                <span style={styles.flag}>{languages[conversationLangs[0]]?.flag || '🌐'}</span>
                <span style={styles.langName(true)}>{languages[conversationLangs[0]]?.name || conversationLangs[0]}</span>
              </button>
              
              <div style={styles.conversationArrow}>↔️</div>
              
              <button
                onClick={() => {
                  const lang2 = conversationLangs[1];
                  const nextLang = lang2 === 'pl' ? 'en' : lang2 === 'en' ? 'fr' : 'pl';
                  setConversationLangs([conversationLangs[0] === nextLang ? (nextLang === 'pl' ? 'en' : 'pl') : conversationLangs[0], nextLang]);
                }}
                style={styles.langButton(true)}
              >
                <span style={styles.flag}>{languages[conversationLangs[1]]?.flag || '🌐'}</span>
                <span style={styles.langName(true)}>{languages[conversationLangs[1]]?.name || conversationLangs[1]}</span>
              </button>
            </div>
            {detectedLanguage && (
              <div style={styles.detectedLanguage}>
                Wykryto: {languages[detectedLanguage]?.flag || '🌐'} {languages[detectedLanguage]?.name || detectedLanguage}
              </div>
            )}
          </div>
        )}

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={(e) => {
            e.preventDefault(); // Zapobiega symulacji mouse events
            startRecording();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stopRecording();
          }}
          onTouchCancel={stopRecording}
          disabled={isProcessing || hasPermission === false}
          style={{
            ...styles.recordButton,
            ...(isRecording && styles.recordButtonActive),
            ...(hasPermission === false && { opacity: 0.3, cursor: 'not-allowed' })
          }}
        >
          <div style={styles.micIcon}>
            {isRecording ? '🔴' : '🎤'}
          </div>
          <div style={styles.buttonText(isRecording)}>
            {hasPermission === false ? 'Brak dostępu' : 
             isRecording ? `Nagrywam... ${recordingTime}s` : 
             isProcessing ? 'Przetwarzam...' : 
             'Nagrywaj'}
          </div>
        </button>

        {/* Przyciski akcji - mikrofon i aparat */}
        <div style={styles.actionButtons}>
          {ocrEnabled && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || ocrProcessing}
                style={{
                  ...styles.cameraButton,
                  ...(ocrProcessing && { opacity: 0.5, cursor: 'not-allowed' })
                }}
                title="Zrób zdjęcie lub wybierz z galerii"
              >
                <div style={styles.cameraIcon}>📷</div>
                <div style={styles.cameraText}>
                  {ocrProcessing ? 'Czytam...' : 'Zdjęcie'}
                </div>
              </button>
            </>
          )}
        </div>

        <div style={styles.status}>
          {isProcessing && 'Tłumaczę...'}
          {!isProcessing && !error && !lastTranslation && (
            <div>
              {conversationMode ? (
                <>Mów w jednym z języków: <strong>{languages[conversationLangs[0]]?.flag || '🌐'} lub {languages[conversationLangs[1]]?.flag || '🌐'}</strong></>
              ) : (
                <>Mów w języku: <strong>{languages[sourceLang].flag} {languages[sourceLang].name}</strong></>
              )}
            </div>
          )}
          {!isProcessing && !error && lastTranslation && 'Gotowe!'}
        </div>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {lastTranslation && !isProcessing && (
          <div style={styles.translation}>
            <div style={styles.translationSection}>
              <div style={styles.translationLabel}>
                <span>{languages[lastTranslation.from]?.flag || '🌐'}</span>
                <span>{lastTranslation.isFromOCR ? 'Rozpoznany tekst:' : 'Usłyszałem:'}</span>
              </div>
              <div style={styles.translationText}>
                {lastTranslation.original}
              </div>
            </div>
            
            <div style={styles.divider} />
            
            <div style={styles.translationSection}>
              <div style={styles.translationLabel}>
                <span>{languages[lastTranslation.to]?.flag || '🌐'}</span>
                <span>Tłumaczenie:</span>
              </div>
              <div style={styles.translationText}>
                {lastTranslation.translated}
              </div>
              <div style={styles.translationButtons}>
                {lastAudioUrl && (
                  <button
                    onClick={replayAudio}
                    style={styles.replayButton}
                    onMouseEnter={(e) => e.target.style.background = '#3730a3'}
                    onMouseLeave={(e) => e.target.style.background = '#4f46e5'}
                  >
                    🔊 Odtwórz ponownie
                  </button>
                )}
                <button
                  onClick={() => {
                    setLastTranslation(null);
                    setError('');
                    setDetectedLanguage(null);
                    if (lastAudioUrl) {
                      URL.revokeObjectURL(lastAudioUrl);
                      setLastAudioUrl(null);
                    }
                  }}
                  style={styles.resetButton}
                  onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                >
                  🔄 Wyczyść
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <button
        onClick={() => setShowPhrases(true)}
        style={styles.phrasesButton}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        📚 Frazy offline
      </button>

      {showPhrases && offlinePhrases && (
        <div style={styles.phrasesModal} onClick={() => setShowPhrases(false)}>
          <div style={styles.phrasesContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.phrasesHeader}>
              <h2 style={styles.phrasesTitle}>Frazy offline</h2>
              <button
                onClick={() => setShowPhrases(false)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            {Object.entries(offlinePhrases).map(([category, phrases]) => (
              <div key={category}>
                <h3 style={styles.categoryTitle}>
                  {category === 'child_safety' ? '👶 Bezpieczeństwo dzieci' :
                   category === 'emergency' ? '🚨 Awaryjne' : 
                   category === 'transport' ? '🚌 Transport' : 
                   '💬 Podstawowe'}
                </h3>
                {Object.entries(phrases[sourceLang] || {}).map(([phrase, translations]) => {
                  return (
                    <div
                      key={phrase}
                      style={styles.phraseItem}
                      onClick={async () => {
                        setLastTranslation({
                          original: phrase,
                          translated: translations[targetLang],
                          from: sourceLang,
                          to: targetLang,
                        });
                        setShowPhrases(false);
                        await playTranslation(translations[targetLang], targetLang);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    >
                      <div style={styles.phraseOriginal}>{phrase}</div>
                      <div style={styles.phraseTranslation}>
                        {languages[targetLang].flag} {translations[targetLang]}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal OCR */}
      {showOCR && selectedImage && (
        <div style={styles.ocrModal} onClick={() => setShowOCR(false)}>
          <div style={styles.ocrContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.ocrHeader}>
              <h2 style={styles.ocrTitle}>Rozpoznawanie tekstu</h2>
              <button
                onClick={() => {
                  setShowOCR(false);
                  setSelectedImage(null);
                }}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            
            {/* Podgląd obrazu */}
            {selectedImage && (
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Wybrany obraz"
                style={styles.imagePreview}
              />
            )}
            
            {/* Przyciski akcji */}
            <div style={styles.ocrButtons}>
              <button
                onClick={() => {
                  setShowOCR(false);
                  setSelectedImage(null);
                }}
                style={{
                  ...styles.ocrButton,
                  background: '#e5e7eb',
                  color: '#6b7280'
                }}
              >
                Anuluj
              </button>
              <button
                onClick={processOCR}
                disabled={ocrProcessing}
                style={{
                  ...styles.ocrButton,
                  background: ocrProcessing ? '#e5e7eb' : '#4f46e5',
                  color: 'white',
                  cursor: ocrProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                {ocrProcessing ? 'Przetwarzam...' : 'Czytaj i tłumacz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}