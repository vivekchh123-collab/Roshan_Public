'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

type Lang = 'en' | 'hi';
type Theme = 'light' | 'dark';
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  toggleTheme: () => void;
  /** tx('English text', 'हिंदी टेक्स्ट') returns the one for the current language */
  tx: (en: string, hi: string) => string;
};

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside Providers');
  return c;
};

export default function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    try {
      const l = localStorage.getItem('rt_lang') as Lang | null;
      if (l === 'en' || l === 'hi') setLangState(l);
      const t = localStorage.getItem('rt_theme') as Theme | null;
      setTheme(t ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = lang;
  }, [theme, lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('rt_lang', l); } catch {}
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const n = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('rt_theme', n); } catch {}
      return n;
    });
  }, []);
  const tx = useCallback((en: string, hi: string) => (lang === 'hi' ? hi : en), [lang]);

  return <AppCtx.Provider value={{ lang, setLang, theme, toggleTheme, tx }}>{children}</AppCtx.Provider>;
}
