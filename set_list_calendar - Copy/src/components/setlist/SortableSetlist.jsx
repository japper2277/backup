import React, { useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';

export const SortableSetlist = () => {
  const listRef = useRef(null);
  const sortableRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [keyboardMode, setKeyboardMode] = useState(false);

  useEffect(() => {
    if (listRef.current && !sortableRef.current) {
      sortableRef.current = new Sortable(listRef.current, {
        animation: 350,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: true,
        fallbackClass: 'sortable-fallback',
        fallbackOnBody: true,
        swapThreshold: 0.65,
        invertSwap: false,
        onStart: (evt) => {
          // Add visual feedback when drag starts
          evt.from.classList.add('dragging-active');
        },
        onEnd: (evt) => {
          // Remove visual feedback and add snap effect
          evt.from.classList.remove('dragging-active');
          
          // Add satisfying snap animation to the dropped item
          if (evt.item) {
            evt.item.classList.add('snap-animation');
            setTimeout(() => {
              evt.item.classList.remove('snap-animation');
            }, 600);
          }
          
          console.log('🎯 Snap! Dropped at position:', evt.newIndex + 1);
        }
      });
    }

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, []);

  const [jokes, setJokes] = useState([
    { id: '1', title: 'Opening Bit About Airlines' },
    { id: '2', title: 'Dating App Horror Story' },
    { id: '3', title: 'My Cat vs My Roommate' },
    { id: '4', title: 'Grocery Store Observations' },
  ]);

  // Handle keyboard navigation and reordering
  const handleKeyDown = (e, index) => {
    const isArrowKey = ['ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(e.key);
    
    if (isArrowKey) {
      e.preventDefault();
      setKeyboardMode(true);
    }

    switch (e.key) {
      case 'ArrowUp':
        if (keyboardMode && index > 0) {
          // Move joke up in setlist
          const newJokes = [...jokes];
          [newJokes[index], newJokes[index - 1]] = [newJokes[index - 1], newJokes[index]];
          setJokes(newJokes);
          setFocusedIndex(index - 1);
          announceMove(jokes[index].title, index + 1, index);
        } else if (!keyboardMode) {
          // Navigate up
          setFocusedIndex(Math.max(0, index - 1));
        }
        break;
        
      case 'ArrowDown':
        if (keyboardMode && index < jokes.length - 1) {
          // Move joke down in setlist  
          const newJokes = [...jokes];
          [newJokes[index], newJokes[index + 1]] = [newJokes[index + 1], newJokes[index]];
          setJokes(newJokes);
          setFocusedIndex(index + 1);
          announceMove(jokes[index].title, index + 1, index + 2);
        } else if (!keyboardMode) {
          // Navigate down
          setFocusedIndex(Math.min(jokes.length - 1, index + 1));
        }
        break;
        
      case 'Space':
      case 'Enter':
        setKeyboardMode(!keyboardMode);
        if (keyboardMode) {
          announce(`Stopped moving ${jokes[index].title}. Use arrow keys to navigate.`);
        } else {
          announce(`Started moving ${jokes[index].title}. Use arrow keys to reorder, space to drop.`);
        }
        break;
        
      case 'Escape':
        setKeyboardMode(false);
        announce('Cancelled move operation.');
        break;
    }
  };

  // Screen reader announcements
  const announce = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  const announceMove = (jokeTitle, fromPos, toPos) => {
    announce(`Moved "${jokeTitle}" from position ${fromPos} to position ${toPos}`);
  };

  return (
    <div style={{ 
      padding: '2rem', 
      background: '#121212', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <style>{`
        /* Enhanced "Parting Waters" effect */
        .dragging-active li {
          transition: all 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        /* Satisfying "Snap" effect */
        .snap-animation {
          animation: snapInPlace 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        
        @keyframes snapInPlace {
          0% {
            transform: scale(0.95) rotate(1deg);
            box-shadow: 0 5px 10px rgba(29, 185, 84, 0.4);
          }
          50% {
            transform: scale(1.05) rotate(-0.5deg);
            box-shadow: 0 15px 25px rgba(29, 185, 84, 0.2);
            background: #2f4f2f !important;
            border-color: #1DB954 !important;
          }
          100% {
            transform: scale(1) rotate(0deg);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            background: #2a2a2a !important;
            border-color: #404040 !important;
          }
        }
        
        .sortable-ghost {
          opacity: 0 !important;
          height: 80px !important;
          background: linear-gradient(90deg, 
            rgba(29, 185, 84, 0.1) 0%, 
            rgba(29, 185, 84, 0.2) 50%, 
            rgba(29, 185, 84, 0.1) 100%) !important;
          border: 2px dashed #1DB954 !important;
          border-radius: 8px !important;
          margin: 8px 0 !important;
          position: relative;
          transform: none !important;
        }
        
        .sortable-ghost::before {
          content: "Drop here ✨";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1DB954;
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.8;
        }
        
        .sortable-chosen {
          cursor: grabbing !important;
          opacity: 0.5 !important;
        }
        
        .sortable-drag, .sortable-fallback {
          transform: rotate(3deg) scale(1.02) !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 
                      0 10px 20px -5px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          opacity: 1 !important;
          background: #333333 !important;
          border: 1px solid #555 !important;
          z-index: 9999 !important;
          transition: none !important;
        }
      `}</style>
      
      <h1 style={{ 
        color: '#ffffff', 
        marginBottom: '2rem',
        fontSize: '2rem',
        fontWeight: 600
      }}>
        🎭 Professional Setlist Builder
      </h1>
      
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
          <span>🎤</span> Tonight's Set
        </h2>
        
        <div style={{
          background: '#0f0f0f',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #333'
        }}>
          <p style={{ color: '#888', margin: 0, fontSize: '0.85rem' }}>
            <strong>Keyboard Controls:</strong> Tab to navigate, Space/Enter to grab, Arrow keys to reorder, Escape to cancel
          </p>
        </div>
        
        <ul 
          ref={listRef}
          role="listbox"
          aria-label="Setlist jokes - use keyboard to reorder"
          style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0 
          }}
        >
          {jokes.map((joke, index) => (
            <li
              key={joke.id}
              data-id={joke.id}
              role="option"
              tabIndex={index === focusedIndex ? 0 : -1}
              aria-selected={index === focusedIndex}
              aria-describedby={keyboardMode ? 'keyboard-mode-help' : 'navigation-help'}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              style={{
                background: index === focusedIndex ? '#333333' : '#2a2a2a',
                border: `1px solid ${keyboardMode && index === focusedIndex ? '#1DB954' : '#404040'}`,
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '0.75rem',
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.2s ease',
                userSelect: 'none',
                outline: index === focusedIndex ? '2px solid #1DB954' : 'none',
                outlineOffset: '2px'
              }}
              onMouseEnter={(e) => {
                if (!keyboardMode) {
                  e.target.style.background = '#333333';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!keyboardMode && index !== focusedIndex) {
                  e.target.style.background = '#2a2a2a';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
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
                {index + 1}
              </div>
              
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
            </li>
          ))}
        </ul>
        
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#0f0f0f',
          borderRadius: '6px',
          border: '1px solid #333',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#888', 
            margin: 0,
            fontSize: '0.9rem'
          }}>
            ✨ Drag with mouse or use keyboard • Perfect for quick backstage adjustments
          </p>
        </div>
        
        {/* Hidden accessibility help text */}
        <div id="navigation-help" style={{ position: 'absolute', left: '-10000px' }}>
          Use arrow keys to navigate, space or enter to start moving, escape to cancel
        </div>
        <div id="keyboard-mode-help" style={{ position: 'absolute', left: '-10000px' }}>
          Moving mode active. Use arrow keys to reorder, space or enter to drop, escape to cancel
        </div>
      </div>
    </div>
  );
};