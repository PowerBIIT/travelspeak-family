'use client';

import { useState } from 'react';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, OfflinePhrase } from '@/lib/types';
import { OFFLINE_PHRASES } from '@/lib/offline-data';

interface OfflinePhrasesProps {
  fromLang: Language;
  toLang: Language;
}

export default function OfflinePhrases({ fromLang, toLang }: OfflinePhrasesProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['sos']);
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  const categoryNames: Record<keyof typeof OFFLINE_PHRASES, string> = {
    sos: '🚨 SOS / Nagłe wypadki',
    transport: '✈️ Transport',
    hotel: '🏨 Hotel',
    restaurant: '🍽️ Restauracja',
    shopping: '🛍️ Zakupy',
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const playAudio = async (text: string, language: Language) => {
    if (playingPhrase) return;

    setPlayingPhrase(text);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error('Błąd podczas generowania audio');
      }

      const audioData = await response.arrayBuffer();
      const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingPhrase(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setPlayingPhrase(null);
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(OFFLINE_PHRASES).map(([categoryKey, phrases]) => {
        const isExpanded = expandedCategories.includes(categoryKey);
        
        return (
          <div key={categoryKey} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(categoryKey)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
            >
              <span className="font-semibold text-lg">
                {categoryNames[categoryKey as keyof typeof OFFLINE_PHRASES]}
              </span>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {isExpanded && (
              <div className="divide-y">
                {phrases.map((phrase: OfflinePhrase, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-700">{phrase[fromLang]}</p>
                      <button
                        onClick={() => playAudio(phrase[fromLang], fromLang)}
                        disabled={playingPhrase === phrase[fromLang]}
                        className={`ml-2 p-1.5 rounded-lg transition-colors ${
                          playingPhrase === phrase[fromLang]
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-200'
                        }`}
                        aria-label="Odtwórz po polsku"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-blue-600">{phrase[toLang]}</p>
                      <button
                        onClick={() => playAudio(phrase[toLang], toLang)}
                        disabled={playingPhrase === phrase[toLang]}
                        className={`ml-2 p-1.5 rounded-lg transition-colors ${
                          playingPhrase === phrase[toLang]
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-200'
                        }`}
                        aria-label={`Odtwórz w języku docelowym`}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}