/**
 * Skeleton Loading Components
 * Hardware-accelerated loading states for perceived performance
 */

import React from 'react';
import { css } from '@emotion/react';
import { theme } from '../../styles/theme';

// Base skeleton animation
const skeletonBase = css`
  background: linear-gradient(
    90deg,
    ${theme.colors.bg.surface2} 25%,
    ${theme.colors.border} 50%,
    ${theme.colors.bg.surface2} 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Joke item skeleton
export const JokeSkeleton = () => (
  <div css={css`
    background: ${theme.colors.bg.surface2};
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  `}>
    {/* Title skeleton */}
    <div css={[skeletonBase, css`
      height: 1.2rem;
      width: 80%;
      margin-bottom: 0.75rem;
    `]} />
    
    {/* Content skeleton */}
    <div css={[skeletonBase, css`
      height: 0.9rem;
      width: 100%;
      margin-bottom: 0.5rem;
    `]} />
    <div css={[skeletonBase, css`
      height: 0.9rem;
      width: 70%;
      margin-bottom: 0.75rem;
    `]} />
    
    {/* Footer skeleton */}
    <div css={css`
      display: flex;
      gap: 0.5rem;
      align-items: center;
    `}>
      <div css={[skeletonBase, css`
        height: 1.5rem;
        width: 60px;
        border-radius: 12px;
      `]} />
      <div css={[skeletonBase, css`
        height: 1rem;
        width: 40px;
      `]} />
    </div>
  </div>
);

// Setlist item skeleton
export const SetlistItemSkeleton = ({ index }) => (
  <div css={css`
    background: ${theme.colors.bg.surface};
    border: 1px solid ${theme.colors.border};
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `}>
    {/* Number skeleton */}
    <div css={[skeletonBase, css`
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;
    `]} />
    
    {/* Content skeleton */}
    <div css={css`flex: 1;`}>
      <div css={[skeletonBase, css`
        height: 1rem;
        width: 75%;
        margin-bottom: 0.5rem;
      `]} />
      <div css={[skeletonBase, css`
        height: 0.8rem;
        width: 50%;
      `]} />
    </div>
  </div>
);

// Joke bank loading skeleton
export const JokeBankSkeleton = () => (
  <div css={css`
    padding: 0.5rem;
    height: 100%;
  `}>
    {[...Array(6)].map((_, i) => (
      <JokeSkeleton key={i} />
    ))}
  </div>
);

// Setlist loading skeleton
export const SetlistSkeleton = () => (
  <div css={css`
    padding: 0.5rem;
    height: 100%;
  `}>
    {[...Array(4)].map((_, i) => (
      <SetlistItemSkeleton key={i} index={i + 1} />
    ))}
  </div>
);

// App loading skeleton - full layout
export const AppSkeleton = () => (
  <div css={css`
    max-width: 1100px;
    width: 100%;
    background: ${theme.colors.bg.surface};
    padding: 2rem;
    border-radius: 12px;
    margin: 0 auto;
  `}>
    {/* Header skeleton */}
    <div css={[skeletonBase, css`
      height: 2.5rem;
      width: 60%;
      margin: 0 auto 2rem auto;
    `]} />
    
    {/* Main content skeleton */}
    <div css={css`
      border: 1px solid ${theme.colors.border};
      border-radius: 8px;
      background: ${theme.colors.bg.surface};
      height: 600px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
    `}>
      {/* Joke bank skeleton */}
      <div css={css`
        background: ${theme.colors.bg.main};
        display: flex;
        flex-direction: column;
      `}>
        {/* Panel header */}
        <div css={css`
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${theme.colors.border};
          background: ${theme.colors.bg.surface2};
        `}>
          <div css={[skeletonBase, css`
            height: 1.2rem;
            width: 120px;
          `]} />
        </div>
        <JokeBankSkeleton />
      </div>
      
      {/* Setlist skeleton */}
      <div css={css`
        background: ${theme.colors.bg.main};
        display: flex;
        flex-direction: column;
      `}>
        {/* Panel header */}
        <div css={css`
          padding: 0.75rem 1rem;
          border-bottom: 1px solid ${theme.colors.border};
          background: ${theme.colors.bg.surface2};
        `}>
          <div css={[skeletonBase, css`
            height: 1.2rem;
            width: 100px;
          `]} />
        </div>
        <SetlistSkeleton />
      </div>
    </div>
  </div>
);

// Performance optimized skeleton with intersection observer
export const LazySkeletonLoader = ({ 
  children, 
  skeleton: Skeleton, 
  loading = false,
  minLoadTime = 500 // Minimum time to show skeleton
}) => {
  const [showSkeleton, setShowSkeleton] = React.useState(loading);
  const [startTime] = React.useState(Date.now());
  
  React.useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsed);
      
      setTimeout(() => {
        setShowSkeleton(false);
      }, remainingTime);
    }
  }, [loading, startTime, minLoadTime]);
  
  return showSkeleton ? <Skeleton /> : children;
};