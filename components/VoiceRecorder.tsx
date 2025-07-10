'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { API_LIMITS } from '@/lib/types';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, isProcessing = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        
        // Auto-stop after max seconds
        if (seconds >= API_LIMITS.speechRecordingMaxSeconds) {
          stopRecording();
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Nie można uzyskać dostępu do mikrofonu. Sprawdź uprawnienia.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isProcessing) {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleButtonClick}
        disabled={isProcessing}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
          isRecording
            ? 'bg-red-600 hover:bg-red-700 animate-pulse scale-110'
            : isProcessing
            ? 'bg-gray-400'
            : 'bg-red-600 hover:bg-red-700 hover:scale-105'
        }`}
        aria-label={isRecording ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie'}
      >
        {isProcessing ? (
          <Loader2 className="w-24 h-24 text-white animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-24 h-24 text-white" />
        ) : (
          <Mic className="w-24 h-24 text-white" />
        )}
      </button>
      
      {isRecording && (
        <div className="mt-6 text-center bg-red-50 p-4 rounded-2xl">
          <p className="text-3xl font-bold text-red-700">{formatTime(recordingTime)}</p>
          <p className="text-lg text-red-600">
            Maksymalnie {API_LIMITS.speechRecordingMaxSeconds} sekund
          </p>
        </div>
      )}
      
      {!isRecording && !isProcessing && (
        <div className="mt-6 text-center">
          <p className="text-3xl font-bold text-gray-700">Naciśnij i mów</p>
          <p className="text-lg text-gray-500 mt-2">Mów wyraźnie do mikrofonu</p>
        </div>
      )}
      
      {isProcessing && (
        <p className="mt-6 text-2xl font-bold text-gray-600 animate-pulse">Przetwarzanie...</p>
      )}
      
      {error && (
        <div className="mt-6 bg-red-100 p-4 rounded-2xl">
          <p className="text-xl text-red-700 font-semibold text-center">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}