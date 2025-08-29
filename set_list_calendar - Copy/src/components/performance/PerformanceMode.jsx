import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../../styles/theme';

const StyledPerformance = {
  PerformanceModeOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(0,0,0,0.95)', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 9999, 
    padding: '2rem' 
  },
  PerformanceJoke: { 
    fontSize: '3rem', 
    fontWeight: 600, 
    color: theme.colors.text.primary, 
    textAlign: 'center', 
    maxWidth: '80%', 
    marginBottom: '2rem' 
  },
  PerformanceNav: { 
    display: 'flex', 
    gap: '2rem' 
  },
  PerformanceModeButton: { 
    background: theme.colors.accent.green, 
    color: 'white', 
    border: 'none', 
    padding: `${theme.spacing.md} ${theme.spacing.lg}`, 
    borderRadius: theme.borderRadius.md, 
    cursor: 'pointer',
    fontSize: '1.2rem'
  }
};

export const PerformanceMode = ({ jokes, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentJoke = jokes[currentIndex];
  
  const nextJoke = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % jokes.length);
  }, [jokes.length]);
  
  const prevJoke = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + jokes.length) % jokes.length);
  }, [jokes.length]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextJoke();
      if (e.key === 'ArrowLeft') prevJoke();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextJoke, prevJoke, onExit]);

  if (!currentJoke) return null;

  return (
    <div style={StyledPerformance.PerformanceModeOverlay}>
      <p style={{ position: 'absolute', top: '1rem', right: '2rem', color: theme.colors.text.secondary }}>
        {currentIndex + 1} / {jokes.length}
      </p>
      <button 
        onClick={onExit} 
        style={{
          ...StyledPerformance.PerformanceModeButton, 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem', 
          padding: '0.5rem 1rem', 
          fontSize: '1rem' 
        }}
      >
        Exit
      </button>
      <div style={StyledPerformance.PerformanceJoke}>{currentJoke.title}</div>
      <div style={StyledPerformance.PerformanceNav}>
        <button style={StyledPerformance.PerformanceModeButton} onClick={prevJoke}>&larr;</button>
        <button style={StyledPerformance.PerformanceModeButton} onClick={nextJoke}>&rarr;</button>
      </div>
    </div>
  );
};