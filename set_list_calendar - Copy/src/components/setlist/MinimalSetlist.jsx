import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Simple sortable item component
const SimpleSortableItem = ({ id, joke, position }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
    opacity: isDragging ? 0.5 : 1,
    background: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{
        background: '#1DB954',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 600,
      }}>
        {position}
      </div>
      <div style={{ flex: 1, color: '#ffffff' }}>
        {joke.title}
      </div>
    </div>
  );
};

export const MinimalSetlist = () => {
  const [jokes] = useState([
    { id: '1', title: 'Test Joke 1' },
    { id: '2', title: 'Test Joke 2' },
    { id: '3', title: 'Test Joke 3' },
  ]);
  const [activeJoke, setActiveJoke] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragStart = (event) => {
    const draggedJoke = jokes.find(joke => joke.id === event.active.id);
    setActiveJoke(draggedJoke);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveJoke(null);

    if (!over || active.id === over.id) return;

    console.log('Drag completed:', active.id, 'to', over.id);
  };

  return (
    <div style={{ padding: '2rem', background: '#121212', minHeight: '100vh' }}>
      <h2 style={{ color: '#ffffff', marginBottom: '2rem' }}>Minimal Drag Test</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={jokes.map(joke => joke.id)} 
          strategy={verticalListSortingStrategy}
        >
          {jokes.map((joke, index) => (
            <SimpleSortableItem 
              key={joke.id}
              id={joke.id}
              joke={joke}
              position={index + 1}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeJoke ? (
            <div style={{
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
              transform: 'rotate(3deg)',
            }}>
              <div style={{
                background: '#1DB954',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}>
                {jokes.findIndex(j => j.id === activeJoke.id) + 1}
              </div>
              <div style={{ flex: 1, color: '#ffffff' }}>
                {activeJoke.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};