- CALENDAR PROJECT STRUCTURE RULES:

  The mic_calendar project uses a modular structure that must be 
  maintained:

  FILES:
  - set_list_Calendar.html (290+ lines) - Clean HTML only, no 
  inline styles/scripts
  - css/calendar.css - Main calendar, layout, navigation styles  
  - css/modals.css - All popups, forms, overlays, context menus
  - js/events.js - All event handlers and user interactions
  - js/modals.js - Modal functionality and forms
  - js/ui.js - UI rendering and view management
  - js/data.js - Data management and storage

  WHEN ADDING FEATURES:
  - Keep HTML minimal with clear section comments
  - Add styles to appropriate CSS file (calendar.css vs 
  modals.css)
  - Add JavaScript to appropriate JS module (events.js for 
  interactions, modals.js for modal logic, etc.)
  - Never add inline styles or scripts to HTML
  - Maintain the organized comment structure in HTML

  RECENT MAJOR FEATURES ADDED:
  - Collapsible Joke Bank: The setlist builder now includes a 
  dropdown arrow to collapse/expand the joke bank panel, saving 
  vertical space and improving UX. State persists across sessions.
  - Enhanced UX: Tag suggestions with debouncing, safe data 
  clearing with typed confirmation, hover effects for discoverable 
  actions.
  - Joke Quick-View: Click any joke in the setlist builder to see 
  full details in a modal without accidentally triggering drag 
  operations.

  MAJOR ARCHITECTURAL ACHIEVEMENT - UNIFIED DRAG SYSTEM:
  - Successfully eliminated dual drag system architecture crime
  - REMOVED: SortableJS + HTML5 native drag dual system nightmare
  - IMPLEMENTED: Single @dnd-kit solution for all drag interactions
  - Fixed React 19 compatibility with useIsomorphicLayoutEffect hook
  - Delivers consistent UX across bank-to-setlist and setlist reordering
  - Production-ready, maintainable, enterprise-grade architecture
  - Same physics, animations, and interaction model throughout
  - Performance optimized with reduced bundle size and dependencies

  KEY UNIFIED DRAG SYSTEM FILES:
  - src/components/setlist/UnifiedSetlist.jsx - Main unified drag component
  - src/components/UnifiedDemoApp.jsx - Demo application showcasing unified system
  - src/hooks/useIsomorphicLayoutEffect.js - React 19 SSR compatibility hook
  - Removed: All sortablejs imports and dual system implementations
  - Demo URL: http://localhost:3003/react-demo.html?unified=true

  UNIFIED DRAG TECHNICAL DETAILS:
  - Uses @dnd-kit/core for all drag operations (useDraggable, useDroppable, useSortable)
  - Consistent collision detection and drag overlay across all interactions
  - Same cubic-bezier easing animations for bank-to-setlist and setlist reordering
  - Unified visual feedback with "snap" effects and "parting waters" transitions
  - Full keyboard accessibility and screen reader support
  - Proper TypeScript integration and error boundaries

  TRIGGER PHRASES:
  - "Follow the modular structure"
  - "Keep the calendar organized" 
  - "Add this feature to the calendar following our structure"

  The original file was 2000+ lines - keep it modular and 
  maintainable!

  🎯 Why This Memory Entry Helps:

  1. Reminds me of the structure every time you mention the
  calendar
  2. Prevents regression back to inline styles/scripts
  3. Maintains organization as features are added
  4. Gives clear file responsibilities so I know where to put what
  5. Includes trigger phrases you can use to activate this
  behavior
- save thse 4 demos to memory