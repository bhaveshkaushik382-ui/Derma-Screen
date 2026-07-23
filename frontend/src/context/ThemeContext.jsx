import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'light', name: 'Light Theme', icon: 'light_mode', color: '#006b2c', bg: '#f8f9ff', desc: 'Classic Emerald & White' },
  { id: 'dark', name: 'Dark Theme', icon: 'dark_mode', color: '#00873a', bg: '#0a0e17', desc: 'Midnight Slate & Black' },
  { id: 'ocean', name: 'Ocean Cyan', icon: 'water_drop', color: '#00a896', bg: '#061826', desc: 'Deep Aquamarine' },
  { id: 'cyber', name: 'Neon Cyber', icon: 'bolt', color: '#a855f7', bg: '#0f0919', desc: 'Synthwave Purple' },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dermascreen_theme') || localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'ocean', 'cyber');
    if (theme !== 'light') {
      root.classList.add(theme);
    }
    localStorage.setItem('dermascreen_theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES, currentThemeObj }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
