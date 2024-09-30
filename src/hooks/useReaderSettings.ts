"use client";

import { useState, useEffect } from "react";

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  lineHeight: number;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontSize: 18,
  lineHeight: 1.6,
};

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('reader_settings');
    if (saved) {
      try {
         
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar configurações de leitura:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSetting = (newSettings: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('reader_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return { settings, updateSetting, isLoaded };
}
