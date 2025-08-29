/**
 * ThemeContext - Provides theme management and dark/light mode support
 * 
 * This context manages application theming including:
 * - Dark/light mode toggle
 * - Theme persistence in localStorage
 * - CSS custom properties injection
 * - Performance optimized theme switching
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { theme } from '../styles/theme';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'dark'
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-theme') || 'dark';
    }
    return 'dark';
  });

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Set specific theme
  const setTheme = (newTheme) => {
    if (['dark', 'light'].includes(newTheme)) {
      setCurrentTheme(newTheme);
    }
  };

  // Persist theme changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', currentTheme);
    }
  }, [currentTheme]);

  // Inject CSS custom properties for theme switching
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = theme.colors;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    
    // Update CSS custom properties
    Object.entries(themeColors).forEach(([category, values]) => {
      if (typeof values === 'object') {
        Object.entries(values).forEach(([key, value]) => {
          root.style.setProperty(`--color-${category}-${key}`, value);
        });
      } else {
        root.style.setProperty(`--color-${category}`, values);
      }
    });
  }, [currentTheme]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    toggleTheme,
    setTheme,
    colors: theme.colors,
    breakpoints: theme.breakpoints,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius
  }), [currentTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};