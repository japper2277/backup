/**
 * High-fidelity skeleton for JokeCard
 * Prevents layout shift by matching the exact dimensions of the real component
 */

import React from 'react';

interface JokeCardSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
}

export const JokeCardSkeleton: React.FC<JokeCardSkeletonProps> = ({ 
  variant = 'default',
  showActions = true 
}) => {
  return (
    <div className="joke-card-skeleton" style={styles.container}>
      {/* Header with menu button */}
      <div style={styles.header}>
        <div style={{...styles.skeletonLine, width: '20px', height: '20px', borderRadius: '50%'}} />
      </div>
      
      {/* Joke text area - varies by variant */}
      <div style={styles.content}>
        {variant === 'detailed' ? (
          <>
            <div style={{...styles.skeletonLine, width: '85%', marginBottom: '8px'}} />
            <div style={{...styles.skeletonLine, width: '92%', marginBottom: '8px'}} />
            <div style={{...styles.skeletonLine, width: '78%', marginBottom: '8px'}} />
            <div style={{...styles.skeletonLine, width: '65%', marginBottom: '12px'}} />
          </>
        ) : variant === 'compact' ? (
          <>
            <div style={{...styles.skeletonLine, width: '88%', marginBottom: '6px'}} />
            <div style={{...styles.skeletonLine, width: '72%', marginBottom: '8px'}} />
          </>
        ) : (
          <>
            <div style={{...styles.skeletonLine, width: '90%', marginBottom: '8px'}} />
            <div style={{...styles.skeletonLine, width: '75%', marginBottom: '8px'}} />
            <div style={{...styles.skeletonLine, width: '82%', marginBottom: '10px'}} />
          </>
        )}
        
        {/* Tags skeleton */}
        <div style={styles.tagsRow}>
          <div style={{...styles.tagSkeleton, width: '60px'}} />
          <div style={{...styles.tagSkeleton, width: '45px'}} />
          <div style={{...styles.tagSkeleton, width: '72px'}} />
        </div>
      </div>
      
      {/* Actions area */}
      {showActions && (
        <div style={styles.actions}>
          <div style={{...styles.actionButton, width: '24px'}} />
          <div style={{...styles.actionButton, width: '24px'}} />
          <div style={{...styles.actionButton, width: '24px'}} />
        </div>
      )}
    </div>
  );
};

export const JokeBankSkeleton: React.FC = () => {
  return (
    <div style={styles.bankContainer}>
      {/* Search bar skeleton */}
      <div style={styles.searchContainer}>
        <div style={{...styles.skeletonLine, width: '100%', height: '40px', borderRadius: '8px'}} />
      </div>
      
      {/* Filter pills skeleton */}
      <div style={styles.filtersContainer}>
        <div style={{...styles.filterPill, width: '55px'}} />
        <div style={{...styles.filterPill, width: '68px'}} />
        <div style={{...styles.filterPill, width: '42px'}} />
        <div style={{...styles.filterPill, width: '78px'}} />
      </div>
      
      {/* Joke cards skeleton */}
      <div style={styles.jokesContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <JokeCardSkeleton 
            key={index}
            variant={index % 3 === 0 ? 'detailed' : index % 3 === 1 ? 'compact' : 'default'}
          />
        ))}
      </div>
    </div>
  );
};

export const SetlistSkeleton: React.FC = () => {
  return (
    <div style={styles.setlistContainer}>
      {/* Setlist header */}
      <div style={styles.setlistHeader}>
        <div style={{...styles.skeletonLine, width: '200px', height: '24px', marginBottom: '8px'}} />
        <div style={{...styles.skeletonLine, width: '150px', height: '16px'}} />
      </div>
      
      {/* Setlist items */}
      <div style={styles.setlistItems}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={styles.setlistItem}>
            <div style={{...styles.skeletonLine, width: '24px', height: '24px', borderRadius: '4px'}} />
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{...styles.skeletonLine, width: '85%', marginBottom: '6px'}} />
              <div style={{...styles.skeletonLine, width: '60%', height: '14px'}} />
            </div>
            <div style={{...styles.skeletonLine, width: '20px', height: '20px', borderRadius: '50%'}} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Styles object with proper spacing to match real components
const styles = {
  container: {
    background: '#2a2a2a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '10px',
    position: 'relative' as const,
    minHeight: '120px', // Prevent layout shift
    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '12px',
  },
  
  content: {
    marginBottom: '16px',
  },
  
  tagsRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px',
  },
  
  tagSkeleton: {
    height: '20px',
    background: '#404040',
    borderRadius: '10px',
  },
  
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #404040',
  },
  
  actionButton: {
    height: '24px',
    background: '#404040',
    borderRadius: '4px',
  },
  
  skeletonLine: {
    height: '16px',
    background: '#404040',
    borderRadius: '4px',
    marginBottom: '8px',
  },
  
  // JokeBank skeleton styles
  bankContainer: {
    padding: '16px',
    background: '#1a1a1a',
    borderRadius: '12px',
    minHeight: '600px',
  },
  
  searchContainer: {
    marginBottom: '16px',
  },
  
  filtersContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  
  filterPill: {
    height: '28px',
    background: '#404040',
    borderRadius: '14px',
  },
  
  jokesContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  
  // Setlist skeleton styles
  setlistContainer: {
    padding: '16px',
    background: '#1a1a1a',
    borderRadius: '12px',
    minHeight: '400px',
  },
  
  setlistHeader: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #404040',
  },
  
  setlistItems: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  
  setlistItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    background: '#2a2a2a',
    borderRadius: '8px',
  },
};

// CSS animation (add this to your global CSS file)
export const SKELETON_CSS = `
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.joke-card-skeleton {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Improved skeleton animation with shimmer effect */
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.skeleton-shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(to right, #404040 8%, #505050 18%, #404040 33%);
  background-size: 800px 104px;
}
`;

export default JokeCardSkeleton;