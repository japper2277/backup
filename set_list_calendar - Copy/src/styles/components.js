/**
 * Component Styles - Optimized CSS-in-JS
 * Replaces massive inline style objects with memoized, performant styling
 */

import { css } from '@emotion/react';
import { theme } from './theme';

// Memoized style objects - computed once, reused everywhere
export const components = {
  // Application Layout
  appContainer: css`
    max-width: 1100px;
    width: 100%;
    background: ${theme.colors.bg.surface};
    padding: 2rem;
    border-radius: 12px;
    box-shadow: ${theme.shadows.lg};
    margin: 0 auto;
    position: relative;
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      padding: 1rem;
      margin: 0.5rem;
      width: calc(100% - 1rem);
    }
  `,

  // Builder Interface
  builder: css`
    border: 1px solid ${theme.colors.border};
    border-radius: 8px;
    background: ${theme.colors.bg.surface};
    min-height: 500px;
    overflow: hidden;
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      min-height: 400px;
    }
  `,

  // Panel Layout - CSS Grid for performance
  panels: css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    height: 600px;
    
    @media (max-width: ${theme.breakpoints.tablet}) {
      grid-template-columns: 1fr;
      grid-template-rows: 300px 300px;
      height: 600px;
    }
  `,

  // Individual Panel
  panel: css`
    background: ${theme.colors.bg.main};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `,

  // Panel Header - Optimized for repaints
  panelHeader: css`
    padding: 0.75rem 1rem;
    border-bottom: 1px solid ${theme.colors.border};
    background: ${theme.colors.bg.surface2};
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    will-change: transform;
  `,

  // Performance-optimized list containers
  jokeList: css`
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    
    /* Optimize scrolling performance */
    transform: translateZ(0);
    -webkit-overflow-scrolling: touch;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${theme.colors.bg.surface2};
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${theme.colors.border};
      border-radius: 4px;
    }
  `,

  // Joke Item - Optimized for drag operations
  jokeItem: css`
    background: ${theme.colors.bg.surface2};
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    cursor: grab;
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    will-change: transform;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: ${theme.shadows.md};
    }
    
    &:active {
      cursor: grabbing;
      transform: translateY(0);
    }
    
    &.dragging {
      opacity: 0.5;
      transform: rotate(5deg);
      z-index: 1000;
    }
  `,

  // Status Pills - Pre-computed for performance
  statusPill: (status) => css`
    background-color: ${theme.colors.status[status]};
    padding: 0.125rem 0.6rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    white-space: nowrap;
  `,

  // Setlist with drag-over optimization
  setlist: (isDragOver) => css`
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    transition: background-color 0.15s ease;
    background-color: ${isDragOver ? 'rgba(69, 163, 255, 0.05)' : 'transparent'};
    transform: translateZ(0);
    -webkit-overflow-scrolling: touch;
    
    &.drag-over {
      background-color: rgba(69, 163, 255, 0.1);
      border: 2px dashed ${theme.colors.accent};
    }
  `,

  // Form Controls - Optimized for interaction
  searchInput: css`
    width: 100%;
    background: ${theme.colors.bg.input};
    border: 1px solid ${theme.colors.border};
    border-radius: 6px;
    padding: 0.75rem;
    color: ${theme.colors.text.primary};
    font-size: 0.95rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: ${theme.colors.accent};
      box-shadow: 0 0 0 2px rgba(69, 163, 255, 0.1);
    }
    
    &::placeholder {
      color: ${theme.colors.text.secondary};
    }
  `,

  // Loading States - Hardware accelerated
  loadingSkeleton: css`
    background: linear-gradient(
      90deg,
      ${theme.colors.bg.surface2} 25%,
      ${theme.colors.border} 50%,
      ${theme.colors.bg.surface2} 75%
    );
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 6px;
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `,

  // Modal Overlay - Optimized for mobile
  modalOverlay: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    
    /* Optimize for mobile scroll performance */
    position: fixed;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  `
};

// Animation keyframes
export const animations = {
  fadeIn: css`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  
  slideIn: css`
    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
  `,
  
  spin: css`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
};

// Performance utilities
export const optimizations = {
  // GPU layer promotion for smooth animations
  willChange: css`
    will-change: transform;
    transform: translateZ(0);
  `,
  
  // Prevent layout thrashing
  preventReflow: css`
    contain: layout style paint;
  `,
  
  // Optimize text rendering
  textOptimization: css`
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `
};