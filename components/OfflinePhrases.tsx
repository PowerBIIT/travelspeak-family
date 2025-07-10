'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Language, OfflinePhrase } from '@/lib/types';
import { OFFLINE_PHRASES } from '@/lib/offline-data';

interface OfflinePhrasesProps {
  fromLang: Language;
  toLang: Language;
}

export default function OfflinePhrases({ fromLang, toLang }: OfflinePhrasesProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['sos']);

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
                    <p className="text-gray-700 mb-2">{phrase[fromLang]}</p>
                    <p className="font-semibold text-blue-600">{phrase[toLang]}</p>
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