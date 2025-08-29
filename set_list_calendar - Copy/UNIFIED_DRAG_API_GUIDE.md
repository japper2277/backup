# 🚀 Unified Drag System - API Integration Guide

## Quick Start

### Installation
The unified drag system uses `@dnd-kit` which is already installed:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Basic Implementation

```javascript
import { UnifiedSetlist } from './components/setlist/UnifiedSetlist';

// Your app state management
const [state, dispatch] = useReducer(appReducer, initialState);

// Sample data structure
const jokeBank = [
  { id: '1', title: 'Opening Joke', type: 'Observational' },
  { id: '2', title: 'Story Bit', type: 'Story' }
];

// Render the unified system
<UnifiedSetlist 
  jokeBank={jokeBank}
  setlistTitle="Tonight's Set"
  state={state}
  dispatch={dispatch}
/>
```

## State Management Integration

### Required State Structure

```javascript
const initialState = {
  jokes: [/* joke objects */],
  setlist: [/* currently selected jokes */]
};
```

### Reducer Actions

```javascript
const appReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_SETLIST':
      return {
        ...state,
        setlist: [...state.setlist, action.payload]
      };
    
    case 'REORDER_SETLIST':
      return {
        ...state,
        setlist: action.payload
      };
    
    case 'REMOVE_FROM_SETLIST':
      return {
        ...state,
        setlist: state.setlist.filter(joke => joke.id !== action.payload.id)
      };
      
    default:
      return state;
  }
};
```

## Custom Drag Components

### Creating Draggable Items

```javascript
import { useDraggable } from '@dnd-kit/core';

const CustomDraggableItem = ({ id, item, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id,
    data: {
      type: 'custom-item',
      item
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
```

### Creating Sortable Items

```javascript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CustomSortableItem = ({ id, item, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: {
      type: 'sortable-item',
      item
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};
```

## Custom Drop Zones

### Basic Droppable Area

```javascript
import { useDroppable } from '@dnd-kit/core';

const CustomDropZone = ({ id, children, className }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'drop-zone'
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`${className} ${isOver ? 'drop-active' : ''}`}
    >
      {children}
      {isOver && <div>Drop here! ✨</div>}
    </div>
  );
};
```

## Collision Detection Patterns

### Custom Collision Detection

```javascript
import { rectIntersection, closestCenter } from '@dnd-kit/core';

const customCollisionDetection = (args) => {
  const { active, droppableContainers } = args;
  
  // Custom logic based on drag source
  if (active.data.current?.type === 'bank-item') {
    // Only allow dropping on specific zones for bank items
    const validContainers = droppableContainers.filter(
      container => container.data.current?.accepts?.includes('bank-item')
    );
    return rectIntersection({
      ...args,
      droppableContainers: validContainers
    });
  }
  
  // Default collision detection for other cases
  return closestCenter(args);
};
```

## Event Handling Patterns

### Comprehensive Drag Handlers

```javascript
const handleDragStart = (event) => {
  const { active } = event;
  const draggedItem = active.data.current?.item;
  const dragType = active.data.current?.type;
  
  // Set active state for visual feedback
  setActiveItem(draggedItem);
  setDragSource(dragType);
  
  // Optional: Custom logic based on item type
  if (dragType === 'special-item') {
    // Handle special drag start logic
  }
};

const handleDragEnd = (event) => {
  const { active, over } = event;
  
  // Clear active state
  setActiveItem(null);
  setDragSource(null);
  
  if (!over) return;
  
  // Handle different drop scenarios
  const activeData = active.data.current;
  const overData = over.data.current;
  
  if (activeData?.type === 'bank-item' && overData?.type === 'setlist-zone') {
    // Bank to setlist logic
    handleBankToSetlistDrop(activeData.item);
  } else if (activeData?.type === 'setlist-item' && overData?.type === 'setlist-item') {
    // Reordering logic
    handleSetlistReorder(active.id, over.id);
  }
};
```

## Animation Customization

### Consistent Animation Timing

```css
/* Use these values for consistent animations */
.drag-transition {
  transition: transform 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.snap-animation {
  animation: snapEffect 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
}

@keyframes snapEffect {
  0% {
    transform: scale(0.95) rotate(1deg);
    box-shadow: 0 5px 10px rgba(29, 185, 84, 0.4);
  }
  50% {
    transform: scale(1.05) rotate(-0.5deg);
    box-shadow: 0 15px 25px rgba(29, 185, 84, 0.2);
  }
  100% {
    transform: scale(1) rotate(0deg);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
}
```

### Custom Drag Overlay

```javascript
<DragOverlay>
  {activeItem ? (
    <CustomDragPreview 
      item={activeItem}
      isDragging={true}
      showRotation={true}
      showShadow={true}
    />
  ) : null}
</DragOverlay>
```

## Accessibility Integration

### Keyboard Support

```javascript
import { KeyboardSensor, sortableKeyboardCoordinates } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Minimum drag distance
    },
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

### Screen Reader Announcements

```javascript
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

// Usage in drag handlers
handleDragEnd = (event) => {
  // ... drag logic
  announce(`Moved "${item.title}" to new position`);
};
```

## Error Handling

### Drag Operation Failures

```javascript
const handleDragEnd = (event) => {
  try {
    // Your drag logic here
    performDragOperation(event);
  } catch (error) {
    console.error('Drag operation failed:', error);
    
    // Revert to previous state
    dispatch({ type: 'REVERT_DRAG_OPERATION' });
    
    // Show user feedback
    showErrorMessage('Unable to complete drag operation');
  }
};
```

## Performance Optimization

### Memoization Patterns

```javascript
import { useMemo, useCallback } from 'react';

// Memoize expensive calculations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.order - b.order);
}, [items]);

// Memoize event handlers
const handleItemDrag = useCallback((event) => {
  // Drag handling logic
}, [dependencies]);
```

### Virtualization for Large Lists

```javascript
import { FixedSizeList as List } from 'react-window';

const VirtualizedDragList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <SortableItem id={items[index].id} item={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};
```

## Integration Checklist

### Before Implementation
- [ ] Install required dependencies
- [ ] Set up state management structure
- [ ] Define data flow patterns
- [ ] Plan accessibility requirements

### During Implementation
- [ ] Use consistent animation timing
- [ ] Implement proper error handling
- [ ] Add keyboard support
- [ ] Test across devices and browsers

### After Implementation
- [ ] Add unit tests for drag operations
- [ ] Verify accessibility compliance
- [ ] Performance testing with large datasets
- [ ] User acceptance testing

## Common Patterns

### Multi-Select Drag

```javascript
const [selectedItems, setSelectedItems] = useState([]);

const handleMultiDrag = (event) => {
  const draggedItems = selectedItems.length > 0 
    ? selectedItems 
    : [event.active.data.current.item];
    
  // Handle multiple items drag
};
```

### Conditional Drop Zones

```javascript
const canDrop = (activeItem, dropZone) => {
  return dropZone.acceptedTypes.includes(activeItem.type);
};

const CustomDropZone = ({ acceptedTypes, onDrop }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'conditional-zone',
    data: { acceptedTypes }
  });

  return (
    <div ref={setNodeRef} className={isOver ? 'can-drop' : 'cannot-drop'}>
      {/* Drop zone content */}
    </div>
  );
};
```

---

**Note:** This unified system replaces all previous dual-system implementations. Always use these patterns for new drag functionality to maintain consistency and performance.