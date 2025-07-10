import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, LanguagePair, Translation } from './types';

interface AppState {
  // Language settings
  currentLanguagePair: LanguagePair;
  setLanguagePair: (pair: LanguagePair) => void;
  
  // Translation history
  translations: Translation[];
  addTranslation: (translation: Omit<Translation, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  
  // User preferences
  fontSize: 'normal' | 'large' | 'elderly';
  setFontSize: (size: 'normal' | 'large' | 'elderly') => void;
  
  // Daily usage tracking
  dailyTranslationCount: number;
  lastResetDate: string;
  incrementDailyCount: () => void;
  checkAndResetDailyCount: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Language settings
      currentLanguagePair: { from: 'pl', to: 'en' },
      setLanguagePair: (pair) => set({ currentLanguagePair: pair }),
      
      // Translation history
      translations: [],
      addTranslation: (translation) => {
        const newTranslation: Translation = {
          ...translation,
          id: Date.now().toString(),
          timestamp: new Date(),
        };
        
        set((state) => ({
          translations: [newTranslation, ...state.translations].slice(0, 50), // Keep last 50
        }));
      },
      clearHistory: () => set({ translations: [] }),
      
      // User preferences
      fontSize: 'normal',
      setFontSize: (size) => set({ fontSize: size }),
      
      // Daily usage tracking
      dailyTranslationCount: 0,
      lastResetDate: new Date().toDateString(),
      incrementDailyCount: () => {
        get().checkAndResetDailyCount();
        set((state) => ({ dailyTranslationCount: state.dailyTranslationCount + 1 }));
      },
      checkAndResetDailyCount: () => {
        const today = new Date().toDateString();
        const lastReset = get().lastResetDate;
        
        if (today !== lastReset) {
          set({
            dailyTranslationCount: 0,
            lastResetDate: today,
          });
        }
      },
    }),
    {
      name: 'travelspeak-storage',
    }
  )
);