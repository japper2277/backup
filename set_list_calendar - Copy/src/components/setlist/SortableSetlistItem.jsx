import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { theme } from '../../styles/theme';

const StyledSetlistItem = {
  SetlistItem: { 
    background: theme.colors.bg.surface, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: theme.borderRadius.md, 
    padding: theme.spacing.md, 
    marginBottom: theme.spacing.sm, 
    transition: 'all 0.2s ease', 
    display: 'flex', 
    alignItems: 'center', 
    gap: theme.spacing.md, 
    cursor: 'grab',
    transformOrigin: '50% 50%'
  },
  SetlistNumber: { 
    background: theme.colors.accent.green, 
    color: 'white', 
    borderRadius: '50%', 
    width: '24px', 
    height: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '0.8rem', 
    fontWeight: 600, 
    flexShrink: 0 
  },
  SetlistItemContent: { 
    flex: 1, 
    color: theme.colors.text.primary, 
    fontSize: '0.95rem' 
  }
};

export const SortableSetlistItem = React.memo(({ 
  id, 
  joke, 
  position, 
  setlistId, 
  isSharedSetlist, 
  onJokeClick 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: id,
    disabled: isSharedSetlist 
  });

  const handleClick = (e) => {
    // In shared setlists, clicking opens comments instead of dragging
    if (isSharedSetlist && onJokeClick) {
      e.preventDefault();
      onJokeClick(joke);
    }
  };
  
  const style = {
    ...StyledSetlistItem.SetlistItem,
    cursor: isSharedSetlist ? 'pointer' : 'grab',
    // Apply @dnd-kit transforms and transitions
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    // Fade out the original item while dragging (ghost effect)
    opacity: isDragging ? 0.5 : 1,
    // Scale effect for active grab
    ...(isDragging && {
      cursor: 'grabbing',
      zIndex: 999
    })
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...attributes}
      {...(isSharedSetlist ? {} : listeners)}
    >
      <div style={StyledSetlistItem.SetlistNumber}>{position}</div>
      <div style={StyledSetlistItem.SetlistItemContent}>
        {joke.title}
        {isSharedSetlist && (
          <i 
            className="fas fa-comment" 
            style={{ 
              marginLeft: '0.5rem', 
              fontSize: '0.8rem', 
              color: theme.colors.accent.blue,
              opacity: 0.7
            }}
          />
        )}
      </div>
    </div>
  );
});

SortableSetlistItem.displayName = 'SortableSetlistItem';