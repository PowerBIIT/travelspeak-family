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
    <div className="w-full max-w-2xl space-y-4">
      {/* Original text */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">{getLanguageFlag(fromLang)}</span>
          <span className="text-sm text-gray-600">Oryginał</span>
        </div>
        <p className="text-lg">{originalText}</p>
      </div>

      {/* Divider */}
      <div className="flex justify-center">
        <div className="text-2xl">↓</div>
      </div>

      {/* Translated text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{getLanguageFlag(toLang)}</span>
            <span className="text-sm text-gray-600">Tłumaczenie</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Kopiuj tłumaczenie"
          >
            {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
          </button>
        </div>
        <p className="text-lg font-semibold">{translatedText}</p>
      </div>
    </div>
  );
}