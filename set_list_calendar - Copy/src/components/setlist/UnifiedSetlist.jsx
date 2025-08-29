import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  rectIntersection,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// We'll use props or context from the parent component
import { theme } from '../../styles/theme';
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect';
import { trackUserActivation } from '../../services/analytics';

/**
 * Unified Draggable Joke Card
 * Works for both bank-to-setlist and within-setlist dragging
 */
const DraggableJokeCard = ({ joke, isDragging, isOverlay = false, showPosition = false, position }) => {
  const style = {
    background: isDragging ? '#333333' : '#2a2a2a',
    border: `1px solid ${isDragging ? '#1DB954' : '#404040'}`,
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    userSelect: 'none',
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    transform: isOverlay ? 'rotate(3deg) scale(1.02)' : 'none',
    boxShadow: isOverlay 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 20px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : isDragging 
      ? '0 5px 10px rgba(29, 185, 84, 0.4)'
      : '0 2px 4px rgba(0,0,0,0.1)',
  };

  return (
    <div style={style}>
      {showPosition && (
        <div style={{
          background: '#1DB954',
          color: 'white',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: 600,
          flexShrink: 0
        }}>
          {position}
        </div>
      )}
      
      <div style={{
        flex: 1,
        color: '#ffffff',
        fontSize: '1rem',
        fontWeight: 500
      }}>
        {joke.title}
      </div>
      
      <div style={{
        color: '#888',
        fontSize: '1.5rem',
        opacity: 0.6
      }}>
        ⋮⋮
      </div>
    </div>
  );
};

/**
 * Draggable item for joke bank
 */
const DraggableBankItem = ({ id, joke }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id: `bank-${id}`,
    data: {
      type: 'bank-joke',
      joke
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DraggableJokeCard 
        joke={joke}
        isDragging={isDragging}
      />
    </div>
  );
};

/**
 * Sortable item for setlist reordering
 */
const SortableSetlistItem = ({ id, joke, position }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `setlist-${id}`,
    data: {
      type: 'setlist-joke',
      joke,
      position
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DraggableJokeCard 
        joke={joke}
        isDragging={isDragging}
        showPosition={true}
        position={position}
      />
    </div>
  );
};

/**
 * Droppable zone for bank-to-setlist drops
 */
const DroppableSetlistZone = ({ children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'setlist-zone',
    data: {
      type: 'setlist-zone'
    }
  });

  const style = {
    background: isOver 
      ? 'linear-gradient(90deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.2) 50%, rgba(29, 185, 84, 0.1) 100%)'
      : '#1a1a1a',
    borderRadius: '12px',
    padding: '1.5rem',
    border: isOver ? '2px dashed #1DB954' : '1px solid #333',
    minHeight: '200px',
    transition: 'all 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
      {isOver && (
        <div style={{
          textAlign: 'center',
          color: '#1DB954',
          fontSize: '0.9rem',
          fontWeight: 600,
          opacity: 0.8,
          marginTop: '1rem'
        }}>
          Drop here to add to setlist ✨
        </div>
      )}
    </div>
  );
};

/**
 * Main Unified Setlist Component
 */
export const UnifiedSetlist = ({ jokeBank, setlistTitle = "Tonight's Set", state, dispatch, setlistId }) => {
  const [activeJoke, setActiveJoke] = useState(null);
  const [dragSource, setDragSource] = useState(null); // 'bank' or 'setlist'
  const [hasActivated, setHasActivated] = useState(false); // Track if user has been activated

  // Configure sensors with proper settings
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that handles both bank and setlist drops
  const collisionDetection = useCallback((args) => {
    const { active, droppableContainers } = args;
    
    // If dragging from bank, only allow dropping on setlist zone
    if (dragSource === 'bank') {
      const setlistContainer = droppableContainers.find(container => 
        container.id === 'setlist-zone'
      );
      if (setlistContainer) {
        const collision = rectIntersection({
          ...args,
          droppableContainers: [setlistContainer]
        });
        return collision;
      }
      return [];
    }
    
    // If dragging within setlist, use default collision detection
    return closestCenter(args);
  }, [dragSource]);

  const handleDragStart = (event) => {
    const { active } = event;
    
    // Check the active item's data to determine source
    if (active.data.current?.type === 'bank-joke') {
      setActiveJoke(active.data.current.joke);
      setDragSource('bank');
    } else if (active.data.current?.type === 'setlist-joke') {
      setActiveJoke(active.data.current.joke);
      setDragSource('setlist');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveJoke(null);
      setDragSource(null);
      return;
    }

    if (dragSource === 'bank' && over.id === 'setlist-zone') {
      // Add joke from bank to setlist
      const joke = active.data.current?.joke;
      if (joke) {
        dispatch({ type: 'ADD_TO_SETLIST', payload: joke });
        
        // Check for user activation milestone (3 jokes)
        const newSetlistLength = state.setlist.length + 1;
        if (newSetlistLength === 3 && !hasActivated && setlistId) {
          trackUserActivation(setlistId, newSetlistLength);
          setHasActivated(true);
          console.log('🎉 User Activated! First 3-joke setlist created');
        }
        
        // Add satisfying snap effect
        setTimeout(() => {
          console.log('🎯 Snap! Added to setlist:', joke.title);
        }, 100);
      }
    } else if (dragSource === 'setlist' && active.id !== over.id) {
      // Reorder within setlist
      const activeId = active.id.replace('setlist-', '');
      const overId = over.id.replace('setlist-', '');
      
      const oldIndex = state.setlist.findIndex(joke => joke.id === activeId);
      const newIndex = state.setlist.findIndex(joke => joke.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSetlist = arrayMove(state.setlist, oldIndex, newIndex);
        dispatch({ type: 'REORDER_SETLIST', payload: newSetlist });
        
        // Add satisfying snap effect
        setTimeout(() => {
          console.log('🎯 Snap! Reordered in setlist:', activeJoke?.title);
        }, 100);
      }
    }

    setActiveJoke(null);
    setDragSource(null);
  };

  const handleDragOver = (event) => {
    // Handle any drag over logic if needed
  };

  return (
    <div style={{
      background: '#121212',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        /* Enhanced animations for unified system */
        .setlist-item-entering {
          animation: slideInAndSnap 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        
        @keyframes slideInAndSnap {
          0% {
            transform: translateX(-100%) scale(0.95) rotate(1deg);
            box-shadow: 0 5px 10px rgba(29, 185, 84, 0.4);
            opacity: 0;
          }
          50% {
            transform: translateX(0) scale(1.05) rotate(-0.5deg);
            box-shadow: 0 15px 25px rgba(29, 185, 84, 0.2);
            background: #2f4f2f;
            border-color: #1DB954;
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            background: #2a2a2a;
            border-color: #404040;
            opacity: 1;
          }
        }
      `}</style>

      <h1 style={{ 
        color: '#ffffff', 
        marginBottom: '2rem',
        fontSize: '2rem',
        fontWeight: 600
      }}>
        🎭 Unified Setlist Builder
      </h1>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Joke Bank */}
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #333'
          }}>
            <h2 style={{ 
              color: '#1DB954', 
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📚</span> Joke Bank
            </h2>
            
            {jokeBank.map(joke => (
              <DraggableBankItem 
                key={joke.id}
                id={joke.id}
                joke={joke}
              />
            ))}
          </div>

          {/* Setlist */}
          <div>
            <h2 style={{ 
              color: '#1DB954', 
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🎤</span> {setlistTitle}
            </h2>

            <DroppableSetlistZone>
              {state.setlist.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  padding: '3rem 1rem',
                  fontStyle: 'italic'
                }}>
                  Drag jokes from your bank to build your setlist
                </div>
              ) : (
                <SortableContext 
                  items={state.setlist.map(joke => `setlist-${joke.id}`)} 
                  strategy={verticalListSortingStrategy}
                >
                  {state.setlist.map((joke, index) => (
                    <SortableSetlistItem 
                      key={`setlist-${joke.id}`}
                      id={joke.id}
                      joke={joke}
                      position={index + 1}
                    />
                  ))}
                </SortableContext>
              )}
            </DroppableSetlistZone>
          </div>
        </div>

        {/* Unified Drag Overlay */}
        <DragOverlay>
          {activeJoke ? (
            <DraggableJokeCard 
              joke={activeJoke}
              isDragging={false}
              isOverlay={true}
              showPosition={dragSource === 'setlist'}
              position={dragSource === 'setlist' 
                ? state.setlist.findIndex(j => j.id === activeJoke.id) + 1 
                : undefined
              }
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};