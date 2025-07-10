'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import OfflinePhrases from '@/components/OfflinePhrases';
import { useStore } from '@/lib/store';

export default function PhrasesPage() {
  const router = useRouter();
  const { currentLanguagePair, fontSize } = useStore();
  
  const fontSizeClass = fontSize === 'elderly' ? 'text-elderly' : fontSize === 'large' ? 'text-xl' : 'text-base';

  return (
    <main className={`flex min-h-screen flex-col items-center p-4 ${fontSizeClass}`}>
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.push('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="mr-2" size={24} />
          Powrót
        </button>

        <h1 className="text-2xl font-bold mb-4 text-center">Gotowe zwroty</h1>
        <p className="text-gray-600 text-center mb-8">
          Działają bez internetu! Pokaż rozmówcy ekran z tłumaczeniem.
        </p>

        <OfflinePhrases
          fromLang={currentLanguagePair.from}
          toLang={currentLanguagePair.to}
        />

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Wskazówka: Te zwroty są zapisane w aplikacji i działają nawet bez połączenia z internetem.
            Idealne na lotnisko czy miejsca bez zasięgu!
          </p>
        </div>
      </div>
    </main>
  );
}