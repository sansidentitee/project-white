'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({children}:{children:React.ReactNode}) {
  useEffect(()=>{
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem('project-white-theme','light');
  },[]);

  const value = useMemo<ThemeContextValue>(()=>({
    theme:'light',
    setTheme:()=>{},
    toggleTheme:()=>{}
  }),[]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(){
  const value = useContext(ThemeContext);
  if(!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
