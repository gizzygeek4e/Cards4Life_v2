import { useState, useEffect } from 'react';
import { soundManager } from './audio';

export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'cards4life_theme';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // Default to dark mode for the high-end heraldic feel
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function applyThemeToDOM(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    applyThemeToDOM(newTheme);
  };

  const toggleTheme = () => {
    try {
      soundManager.playThemeSwitch();
    } catch {
      // ignore
    }
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return { theme, toggleTheme, setTheme };
}
