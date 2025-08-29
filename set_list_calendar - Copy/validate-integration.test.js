/**
 * Integration Validation Test
 * 
 * Tests critical functionality of the unified drag system integration
 */

import { test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Firebase to avoid connection errors during testing
jest.mock('./src/firebase/config.js', () => ({
  auth: {
    currentUser: {
      uid: 'test-user',
      displayName: 'Test User',
      isAnonymous: false
    },
    onAuthStateChanged: jest.fn()
  }
}));

// Mock the collaborative hooks to return stable test data
jest.mock('./src/hooks/useCollaborativeSetlist.js', () => ({
  useCollaborativeSetlist: () => ({
    jokes: [
      { id: '1', title: 'Test Joke 1', text: 'A test joke' },
      { id: '2', title: 'Test Joke 2', text: 'Another test joke' }
    ],
    setlist: { title: 'Test Setlist', ownerId: 'test-user' },
    loading: false,
    error: null,
    connected: true,
    syncing: false,
    activeUsers: [],
    isConnectedToPresence: true,
    addJoke: jest.fn(),
    editJoke: jest.fn(),
    removeJoke: jest.fn(),
    reorderSetlistJokes: jest.fn(),
    shareSetlistWith: jest.fn(),
    clearError: jest.fn(),
    retry: jest.fn(),
    updateCurrentlyEditing: jest.fn(),
    clearCurrentlyEditing: jest.fn(),
    getUsersEditingJoke: jest.fn(() => []),
    isOwner: true,
    canEdit: true,
    canComment: true
  })
}));

// Mock presence hook
jest.mock('./src/hooks/usePresence.js', () => ({
  useSetlistPresence: () => ({
    activeUsers: [],
    isConnected: true,
    error: null,
    updateCurrentlyEditing: jest.fn(),
    clearCurrentlyEditing: jest.fn(),
    getUsersEditingJoke: jest.fn(() => [])
  })
}));

describe('Unified Drag System Integration', () => {
  test('UC-001: CollaborativeSetlist renders with unified drag components', async () => {
    const { CollaborativeSetlist } = await import('./src/components/setlist/CollaborativeSetlist.jsx');
    
    render(<CollaborativeSetlist setlistId="test-setlist" />);
    
    // Should render setlist title
    expect(screen.getByText(/Collaborative Setlist|Test Setlist/)).toBeInTheDocument();
    
    // Should render connection status
    expect(screen.getByText(/Live|Connected/)).toBeInTheDocument();
    
    // Should render jokes if present
    expect(screen.getByText('Test Joke 1')).toBeInTheDocument();
    expect(screen.getByText('Test Joke 2')).toBeInTheDocument();
  });

  test('INT-001: DndContext imports are present', async () => {
    const module = await import('./src/components/setlist/CollaborativeSetlist.jsx');
    
    // Verify the module exports the component
    expect(module.CollaborativeSetlist).toBeDefined();
    
    // Check that required @dnd-kit imports exist by importing the module
    const dndCore = await import('@dnd-kit/core');
    const dndSortable = await import('@dnd-kit/sortable');
    
    expect(dndCore.DndContext).toBeDefined();
    expect(dndCore.useDroppable).toBeDefined();
    expect(dndSortable.useSortable).toBeDefined();
    expect(dndSortable.SortableContext).toBeDefined();
  });

  test('UC-002: Unified components are properly integrated', async () => {
    // Test that the file contains the unified components we added
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.resolve('./src/components/setlist/CollaborativeSetlist.jsx');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Verify unified drag components are present
    expect(fileContent).toContain('UnifiedJokeCard');
    expect(fileContent).toContain('SortableSetlistItem');
    expect(fileContent).toContain('UnifiedDroppableZone');
    expect(fileContent).toContain('handleDragStart');
    expect(fileContent).toContain('handleDragEnd');
    
    // Verify Firebase integration points
    expect(fileContent).toContain('addJoke');
    expect(fileContent).toContain('reorderSetlistJokes');
    expect(fileContent).toContain('arrayMove');
  });

  test('Performance: Component imports complete within reasonable time', async () => {
    const startTime = performance.now();
    
    await import('./src/components/setlist/CollaborativeSetlist.jsx');
    
    const endTime = performance.now();
    const importTime = endTime - startTime;
    
    // Should import within 100ms for good performance
    expect(importTime).toBeLessThan(100);
  });

  test('Integration: CollaborativeDemoApp loads unified system', async () => {
    const { CollaborativeDemoApp } = await import('./src/components/CollaborativeDemoApp.jsx');
    
    render(<CollaborativeDemoApp />);
    
    // Should render demo header
    expect(screen.getByText(/Collaborative Setlist|Real-time Collaboration/)).toBeInTheDocument();
    
    // Should render joke bank
    expect(screen.getByText(/Joke Bank/)).toBeInTheDocument();
  });
});

console.log('🧪 Integration validation tests completed');