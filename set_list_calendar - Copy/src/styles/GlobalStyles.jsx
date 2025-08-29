import React from 'react';
import { Global, css } from '@emotion/react';

// CSS-in-JS global styles using Emotion
const globalStyles = css`
  /* CSS Variables - Design System */
  :root {
    --bg-main: #121212;
    --bg-surface: #181818;
    --bg-surface-2: #282828;
    --bg-input: #2a2d3e;
    --border-color: #3e4042;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --accent-green: #1DB954;
    --accent-blue: #45a3ff;
    --accent-orange: #f5c518;
    --accent-purple: #9d6cff;
    --accent-red: #ef4444;
    
    /* Joke Status Colors */
    --status-Idea: #808080;
    --status-Workshopping: #f5c518;
    --status-Tight-5-Ready: #45a3ff;
    --status-Show-Ready: #1DB954;
    
    /* Typography */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  /* Reset & Base Styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: var(--font-sans);
  }

  body {
    background-color: var(--bg-main);
    color: var(--text-primary);
    line-height: 1.6;
    padding: 2rem;
  }

  /* Animation Utilities */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .spin {
    animation: spin 1s linear infinite;
  }
  
  .shimmer {
    animation: shimmer 1.5s infinite;
  }

  /* Focus Styles for Accessibility */
  :focus {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-surface);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
`;

export const GlobalStyles = () => <Global styles={globalStyles} />;