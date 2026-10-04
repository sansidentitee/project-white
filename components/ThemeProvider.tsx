'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'project-white-theme';

export function ThemeProvider({children}:{children:React.ReactNode}) {
  const [theme,setThemeState] = useState<Theme>('light');

  useEffect(()=>{
    const saved = localStorage.getItem(THEME_KEY);
    const initial: Theme = saved === 'dark' ? 'dark' : 'light';
    setThemeState(initial);
    document.documentElement.dataset.theme = initial;
  },[]);

  function setTheme(next:Theme) {
    setThemeState(next);
    localStorage.setItem(THEME_KEY,next);
    document.documentElement.dataset.theme = next;
  }

  const value = useMemo(()=>({
    theme,
    setTheme,
    toggleTheme:()=>setTheme(theme === 'light' ? 'dark' : 'light')
  }),[theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(){
  const value = useContext(ThemeContext);
  if(!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
