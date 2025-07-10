export type Language = 'pl' | 'en' | 'fr';

export interface LanguagePair {
  from: Language;
  to: Language;
}

export interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  from: Language;
  to: Language;
  timestamp: Date;
  type: 'text' | 'voice';
}

export interface OfflinePhrase {
  pl: string;
  en: string;
  fr: string;
}

export interface PhraseCategory {
  sos: OfflinePhrase[];
  transport: OfflinePhrase[];
  hotel: OfflinePhrase[];
  restaurant: OfflinePhrase[];
  shopping: OfflinePhrase[];
}

export const API_LIMITS = {
  translationsPerDay: 100,
  maxTranslationLength: 500,
  speechRecordingMaxSeconds: 30,
};