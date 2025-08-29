/**
 * Accessibility Provider - WCAG 2.1 AAA Compliance
 * Comprehensive a11y features and keyboard navigation
 */

import React, { createContext, useContext, useEffect, useReducer } from 'react';

// Accessibility Context
const AccessibilityContext = createContext();

// Accessibility State
const initialA11yState = {
  // Keyboard Navigation
  focusVisible: false,
  keyboardUser: false,
  focusedElement: null,
  focusTrapStack: [],
  
  // Screen Reader
  announcements: [],
  liveRegion: null,
  
  // User Preferences
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  
  // Focus Management
  skipLinks: [],
  landmarks: []
};

// Actions
const A11Y_ACTIONS = {
  SET_KEYBOARD_USER: 'SET_KEYBOARD_USER',
  SET_FOCUSED_ELEMENT: 'SET_FOCUSED_ELEMENT',
  PUSH_FOCUS_TRAP: 'PUSH_FOCUS_TRAP',
  POP_FOCUS_TRAP: 'POP_FOCUS_TRAP',
  ANNOUNCE: 'ANNOUNCE',
  CLEAR_ANNOUNCEMENTS: 'CLEAR_ANNOUNCEMENTS',
  SET_PREFERENCES: 'SET_PREFERENCES',
  ADD_SKIP_LINK: 'ADD_SKIP_LINK',
  REMOVE_SKIP_LINK: 'REMOVE_SKIP_LINK'
};

// Reducer
function a11yReducer(state, action) {
  switch (action.type) {
    case A11Y_ACTIONS.SET_KEYBOARD_USER:
      return { ...state, keyboardUser: action.payload };
      
    case A11Y_ACTIONS.SET_FOCUSED_ELEMENT:
      return { ...state, focusedElement: action.payload };
      
    case A11Y_ACTIONS.PUSH_FOCUS_TRAP:
      return { 
        ...state, 
        focusTrapStack: [...state.focusTrapStack, action.payload] 
      };
      
    case A11Y_ACTIONS.POP_FOCUS_TRAP:
      return { 
        ...state, 
        focusTrapStack: state.focusTrapStack.slice(0, -1) 
      };
      
    case A11Y_ACTIONS.ANNOUNCE:
      return { 
        ...state, 
        announcements: [...state.announcements, action.payload] 
      };
      
    case A11Y_ACTIONS.CLEAR_ANNOUNCEMENTS:
      return { ...state, announcements: [] };
      
    case A11Y_ACTIONS.SET_PREFERENCES:
      return { ...state, ...action.payload };
      
    case A11Y_ACTIONS.ADD_SKIP_LINK:
      return { 
        ...state, 
        skipLinks: [...state.skipLinks, action.payload] 
      };
      
    case A11Y_ACTIONS.REMOVE_SKIP_LINK:
      return { 
        ...state, 
        skipLinks: state.skipLinks.filter(link => link.id !== action.payload) 
      };
      
    default:
      return state;
  }
}

/**
 * Accessibility Provider Component
 */
export const AccessibilityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(a11yReducer, initialA11yState);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    };

    const updatePreferences = () => {
      dispatch({
        type: A11Y_ACTIONS.SET_PREFERENCES,
        payload: {
          reducedMotion: mediaQueries.reducedMotion.matches,
          highContrast: mediaQueries.highContrast.matches
        }
      });
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  // Keyboard user detection
  useEffect(() => {
    let isMouseUser = false;
    
    const handleMouseDown = () => {
      isMouseUser = true;
      dispatch({ type: A11Y_ACTIONS.SET_KEYBOARD_USER, payload: false });
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && !isMouseUser) {
        dispatch({ type: A11Y_ACTIONS.SET_KEYBOARD_USER, payload: true });
      }
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Context value
  const contextValue = {
    ...state,
    
    // Actions
    announce: (message, priority = 'polite') => {
      dispatch({
        type: A11Y_ACTIONS.ANNOUNCE,
        payload: { message, priority, timestamp: Date.now() }
      });
    },
    
    setFocusedElement: (element) => {
      dispatch({ type: A11Y_ACTIONS.SET_FOCUSED_ELEMENT, payload: element });
    },
    
    pushFocusTrap: (element) => {
      dispatch({ type: A11Y_ACTIONS.PUSH_FOCUS_TRAP, payload: element });
    },
    
    popFocusTrap: () => {
      dispatch({ type: A11Y_ACTIONS.POP_FOCUS_TRAP });
    },
    
    addSkipLink: (link) => {
      dispatch({ type: A11Y_ACTIONS.ADD_SKIP_LINK, payload: link });
    },
    
    removeSkipLink: (id) => {
      dispatch({ type: A11Y_ACTIONS.REMOVE_SKIP_LINK, payload: id });
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      <LiveRegion announcements={state.announcements} />
      <SkipLinks links={state.skipLinks} />
    </AccessibilityContext.Provider>
  );
};

/**
 * Live Region for Screen Reader Announcements
 */
const LiveRegion = ({ announcements }) => {
  const [currentAnnouncement, setCurrentAnnouncement] = React.useState('');
  
  React.useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[announcements.length - 1];
      setCurrentAnnouncement(latest.message);
      
      // Clear after announcement
      const timer = setTimeout(() => {
        setCurrentAnnouncement('');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [announcements]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {currentAnnouncement}
    </div>
  );
};

/**
 * Skip Links Component
 */
const SkipLinks = ({ links }) => {
  if (links.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '-100px',
        left: '0',
        zIndex: 9999
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
      }}
    >
      {links.map(link => (
        <a
          key={link.id}
          href={`#${link.target}`}
          style={{
            display: 'block',
            padding: '8px 16px',
            background: '#000',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Hook for using accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// HOC for keyboard navigation
export const withKeyboardNavigation = (Component) => {
  return React.forwardRef((props, ref) => {
    const { keyboardUser } = useAccessibility();
    
    return (
      <Component 
        {...props} 
        ref={ref}
        className={`${props.className || ''} ${keyboardUser ? 'keyboard-user' : ''}`.trim()}
      />
    );
  });
};

// Focus Trap Hook
export const useFocusTrap = (ref, isActive = true) => {
  const { pushFocusTrap, popFocusTrap } = useAccessibility();
  
  React.useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    pushFocusTrap(element);
    
    // Focus first element
    firstFocusable?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
      popFocusTrap();
    };
  }, [isActive, ref, pushFocusTrap, popFocusTrap]);
};

// Announcement Hook
export const useAnnouncement = () => {
  const { announce } = useAccessibility();
  
  return React.useCallback((message, priority = 'polite') => {
    announce(message, priority);
  }, [announce]);
};

// ARIA Attributes Helper
export const useAriaAttributes = (element, role, labelledBy, describedBy) => {
  React.useEffect(() => {
    if (!element) return;
    
    if (role) element.setAttribute('role', role);
    if (labelledBy) element.setAttribute('aria-labelledby', labelledBy);
    if (describedBy) element.setAttribute('aria-describedby', describedBy);
    
    return () => {
      if (role) element.removeAttribute('role');
      if (labelledBy) element.removeAttribute('aria-labelledby');
      if (describedBy) element.removeAttribute('aria-describedby');
    };
  }, [element, role, labelledBy, describedBy]);
};

// Roving Tabindex Hook for Lists
export const useRovingTabindex = (containerRef, itemSelector = '[role="option"]') => {
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const items = Array.from(container.querySelectorAll(itemSelector));
    
    let currentIndex = 0;
    
    const updateTabindex = () => {
      items.forEach((item, index) => {
        item.tabIndex = index === currentIndex ? 0 : -1;
      });
    };
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          currentIndex = Math.min(currentIndex + 1, items.length - 1);
          items[currentIndex].focus();
          e.preventDefault();
          break;
          
        case 'ArrowUp':
          currentIndex = Math.max(currentIndex - 1, 0);
          items[currentIndex].focus();
          e.preventDefault();
          break;
          
        case 'Home':
          currentIndex = 0;
          items[currentIndex].focus();
          e.preventDefault();
          break;
          
        case 'End':
          currentIndex = items.length - 1;
          items[currentIndex].focus();
          e.preventDefault();
          break;
      }
      updateTabindex();
    };
    
    container.addEventListener('keydown', handleKeyDown);
    updateTabindex();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector]);
};