'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Language } from '@/lib/types';

interface TranslationDisplayProps {
  originalText: string;
  translatedText: string;
  fromLang: Language;
  toLang: Language;
}

export default function TranslationDisplay({
  originalText,
  translatedText,
  fromLang,
  toLang,
}: TranslationDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getLanguageFlag = (lang: Language) => {
    switch (lang) {
      case 'pl': return '🇵🇱';
      case 'en': return '🇬🇧';
      case 'fr': return '🇫🇷';
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Original text */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
        <div className="flex items-center mb-3">
          <span className="text-4xl mr-3">{getLanguageFlag(fromLang)}</span>
          <span className="text-xl font-semibold text-gray-700">Powiedziałeś:</span>
        </div>
        <p className="text-2xl text-gray-800">{originalText}</p>
      </div>

      {/* Divider */}
      <div className="flex justify-center">
        <div className="text-4xl animate-bounce">⬇️</div>
      </div>

      {/* Translated text */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 shadow-xl border-2 border-blue-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-4xl mr-3">{getLanguageFlag(toLang)}</span>
            <span className="text-xl font-semibold text-blue-800">Tłumaczenie:</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-3 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-md active:scale-95"
            aria-label="Kopiuj tłumaczenie"
          >
            {copied ? <Check size={28} className="text-green-600" /> : <Copy size={28} />}
          </button>
        </div>
        <p className="text-3xl font-bold text-blue-900">{translatedText}</p>
        {copied && (
          <p className="text-sm text-green-600 mt-2 font-semibold">✓ Skopiowane!</p>
        )}
      </div>
    </div>
  );
}