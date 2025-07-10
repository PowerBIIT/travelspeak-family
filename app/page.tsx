'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Language, LanguagePair } from '@/lib/types';
import { Mic, Type, MessageSquare, History } from 'lucide-react';

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function Home() {
  const router = useRouter();
  const { currentLanguagePair, setLanguagePair, fontSize } = useStore();

  const handleLanguageSwap = () => {
    setLanguagePair({
      from: currentLanguagePair.to,
      to: currentLanguagePair.from,
    });
  };

  const selectLanguage = (type: 'from' | 'to', lang: Language) => {
    const newPair: LanguagePair = {
      ...currentLanguagePair,
      [type]: lang,
    };
    
    // Ensure from and to are different
    if (newPair.from === newPair.to) {
      const otherLangs = languages.filter(l => l.code !== lang);
      newPair[type === 'from' ? 'to' : 'from'] = otherLangs[0].code;
    }
    
    setLanguagePair(newPair);
  };

  const fontSizeClass = fontSize === 'elderly' ? 'text-elderly' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <main className={`flex min-h-screen flex-col items-center p-4 ${fontSizeClass}`}>
      <h1 className="text-3xl font-bold mb-8 text-center">TravelSpeak Family</h1>
      
      {/* Language selector */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* From language */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2 text-center">Z języka:</p>
            <div className="flex justify-center gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => selectLanguage('from', lang.code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentLanguagePair.from === lang.code
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                >
                  <span className="flag-emoji">{lang.flag}</span>
                  <p className="text-sm mt-1">{lang.name}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Swap button */}
          <button
            onClick={handleLanguageSwap}
            className="mx-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Zamień języki"
          >
            ↔️
          </button>
          
          {/* To language */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2 text-center">Na język:</p>
            <div className="flex justify-center gap-2">
              {languages
                .filter((lang) => lang.code !== currentLanguagePair.from)
                .map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage('to', lang.code)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      currentLanguagePair.to === lang.code
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="flag-emoji">{lang.flag}</span>
                    <p className="text-sm mt-1">{lang.name}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main action buttons */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push('/translate/voice')}
          className="btn-primary btn-large w-full"
        >
          <Mic className="mr-3" size={32} />
          MÓWIENIE
        </button>
        
        <button
          onClick={() => router.push('/translate/text')}
          className="btn-primary w-full"
        >
          <Type className="mr-3" size={28} />
          PISANIE
        </button>
        
        <button
          onClick={() => router.push('/phrases')}
          className="btn-secondary w-full"
        >
          <MessageSquare className="mr-3" size={28} />
          GOTOWE ZWROTY
        </button>
        
        <button
          onClick={() => router.push('/history')}
          className="btn-secondary w-full"
        >
          <History className="mr-3" size={28} />
          HISTORIA
        </button>
      </div>
      
      {/* Font size selector */}
      <div className="mt-8 flex gap-2">
        <button
          onClick={() => useStore.getState().setFontSize('normal')}
          className={`px-3 py-1 rounded ${fontSize === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          A
        </button>
        <button
          onClick={() => useStore.getState().setFontSize('large')}
          className={`px-3 py-1 rounded text-lg ${fontSize === 'large' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          A
        </button>
        <button
          onClick={() => useStore.getState().setFontSize('elderly')}
          className={`px-3 py-1 rounded text-xl ${fontSize === 'elderly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          A
        </button>
      </div>
    </main>
  );
}
