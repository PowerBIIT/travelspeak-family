'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Mic, Type } from 'lucide-react';
import { useStore } from '@/lib/store';
import TranslationDisplay from '@/components/TranslationDisplay';
import { useState } from 'react';

export default function HistoryPage() {
  const router = useRouter();
  const { translations, clearHistory, fontSize } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const fontSizeClass = fontSize === 'elderly' ? 'text-elderly' : fontSize === 'large' ? 'text-xl' : 'text-base';

  const handleClearHistory = () => {
    clearHistory();
    setShowClearConfirm(false);
  };


  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Dzisiaj, ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Wczoraj, ${d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <main className={`flex min-h-screen flex-col items-center p-4 ${fontSizeClass}`}>
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="mr-2" size={24} />
            Powrót
          </button>
          
          {translations.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center text-red-600 hover:text-red-800"
            >
              <Trash2 className="mr-2" size={20} />
              Wyczyść
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">Historia tłumaczeń</h1>

        {showClearConfirm && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700 mb-3">Czy na pewno chcesz usunąć całą historię?</p>
            <div className="flex gap-3">
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tak, usuń
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        {translations.length === 0 ? (
          <div className="text-center text-gray-500 mt-16">
            <p className="text-lg mb-2">Brak historii tłumaczeń</p>
            <p className="text-sm">Twoje tłumaczenia pojawią się tutaj</p>
          </div>
        ) : (
          <div className="space-y-6">
            {translations.map((translation) => (
              <div key={translation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {formatDate(translation.timestamp)}
                  </span>
                  <span className="flex items-center text-sm text-gray-500">
                    {translation.type === 'voice' ? <Mic size={16} className="mr-1" /> : <Type size={16} className="mr-1" />}
                    {translation.type === 'voice' ? 'Głosowe' : 'Tekstowe'}
                  </span>
                </div>
                <TranslationDisplay
                  originalText={translation.originalText}
                  translatedText={translation.translatedText}
                  fromLang={translation.from}
                  toLang={translation.to}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}