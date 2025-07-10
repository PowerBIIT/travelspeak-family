'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Language } from '@/lib/types';
import { Mic, Type, MessageSquare } from 'lucide-react';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function Home() {
  const router = useRouter();
  const { currentLanguagePair, setLanguagePair } = useStore();

  const handleLanguageSwap = () => {
    setLanguagePair({
      from: currentLanguagePair.to,
      to: currentLanguagePair.from,
    });
  };

  const selectNextLanguage = (type: 'from' | 'to') => {
    const current = currentLanguagePair[type];
    const availableLangs = type === 'to' 
      ? languages.filter(l => l.code !== currentLanguagePair.from)
      : languages;
    const currentIndex = availableLangs.findIndex(l => l.code === current);
    const nextLang = availableLangs[(currentIndex + 1) % availableLangs.length];
    
    setLanguagePair({
      ...currentLanguagePair,
      [type]: nextLang.code,
    });
  };

  const fromLang = languages.find(l => l.code === currentLanguagePair.from)!;
  const toLang = languages.find(l => l.code === currentLanguagePair.to)!;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <h1 className="text-5xl font-bold mb-8 text-center text-blue-700">
        🌍 TravelSpeak
      </h1>
      
      {/* Language selector - SIMPLIFIED */}
      <div className="w-full max-w-2xl mb-8 bg-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-around">
          <button
            onClick={() => selectNextLanguage('from')}
            className="text-center p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all active:scale-95"
          >
            <p className="text-xl font-bold text-gray-700 mb-2">Z języka:</p>
            <span className="text-7xl block mb-2">{fromLang.flag}</span>
            <p className="text-2xl font-bold">{fromLang.name}</p>
          </button>
          
          <button
            onClick={handleLanguageSwap}
            className="p-6 text-5xl rounded-full bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
          >
            ↔️
          </button>
          
          <button
            onClick={() => selectNextLanguage('to')}
            className="text-center p-4 rounded-2xl bg-green-50 hover:bg-green-100 transition-all active:scale-95"
          >
            <p className="text-xl font-bold text-gray-700 mb-2">Na język:</p>
            <span className="text-7xl block mb-2">{toLang.flag}</span>
            <p className="text-2xl font-bold">{toLang.name}</p>
          </button>
        </div>
      </div>
      
      {/* Main action buttons - BIGGER AND CLEARER */}
      <div className="w-full max-w-2xl space-y-6">
        <button
          onClick={() => router.push('/translate/voice')}
          className="w-full bg-red-600 text-white rounded-3xl p-8 flex items-center justify-center shadow-2xl hover:bg-red-700 active:scale-95 transition-all"
        >
          <Mic size={48} className="mr-4" />
          <span className="text-4xl font-bold">🎤 MÓWIĘ</span>
        </button>
        
        <button
          onClick={() => router.push('/translate/text')}
          className="w-full bg-blue-600 text-white rounded-3xl p-6 flex items-center justify-center shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
        >
          <Type size={40} className="mr-4" />
          <span className="text-3xl font-bold">⌨️ PISZĘ</span>
        </button>
        
        <button
          onClick={() => router.push('/phrases')}
          className="w-full bg-green-600 text-white rounded-3xl p-6 flex items-center justify-center shadow-xl hover:bg-green-700 active:scale-95 transition-all"
        >
          <MessageSquare size={40} className="mr-4" />
          <span className="text-3xl font-bold">💬 ZWROTY (BEZ NETU!)</span>
        </button>
        
      </div>
    </main>
  );
}