import React, { useState, useRef, useCallback } from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';
import { Modal, StatusPill, JokeTypePill, CleanPill, JokeContextMenu } from '../common';
import { useUserJokes } from '../../hooks/useFirestore';
import { useAppDispatch } from '../../contexts/AppContext';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import { isFeatureEnabled } from '../../config/features';

// Styled components for JokeCard
const CardContainer = styled.div`
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  position: relative;
  cursor: grab;
  transition: all 0.2s ease;
  opacity: ${props => props.loading ? 0.6 : 1};
  pointer-events: ${props => props.loading ? 'none' : 'auto'};
  
  &:hover {
    background: #2a2a2a;
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.sm};
  }
  
  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const CardTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 600;
  flex: 1;
  margin-right: 2rem;
  color: ${theme.colors.text.primary};
`;

const CardFooter = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ContextMenuButton = styled.button`
  position: absolute;
  top: ${theme.spacing.sm};
  right: ${theme.spacing.sm};
  background: none;
  border: none;
  color: ${theme.colors.text.secondary};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  z-index: 10;
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background: ${theme.colors.bg.surface};
    color: ${theme.colors.text.primary};
  }
`;

// Import form components that we'll need
const EditJokeForm = ({ joke, onSave, onCancel }) => {
  const [formData, setFormData] = useState(joke);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  };

  const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];

  return (
    <>
      <h3 style={{ marginTop: 0, color: theme.colors.text.primary }}>Edit Joke</h3>
      <label style={{ display: 'block', color: theme.colors.text.secondary, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
      <input 
        style={{ 
          width: '100%', 
          background: theme.colors.bg.input, 
          border: `1px solid ${theme.colors.border}`, 
          borderRadius: theme.borderRadius.md, 
          padding: theme.spacing.md, 
          color: theme.colors.text.primary, 
          fontSize: '1rem',
          marginBottom: theme.spacing.lg 
        }} 
        name="title" 
        value={formData.title} 
        onChange={handleChange} 
      />
      
      <label style={{ display: 'block', color: theme.colors.text.secondary, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Text</label>
      <textarea 
        style={{
          width: '100%', 
          background: theme.colors.bg.input, 
          border: `1px solid ${theme.colors.border}`, 
          borderRadius: theme.borderRadius.md, 
          padding: theme.spacing.md, 
          color: theme.colors.text.primary, 
          fontSize: '1rem',
          marginBottom: theme.spacing.lg,
          height: '100px'
        }} 
        name="text" 
        value={formData.text} 
        onChange={handleChange}
      />
      
      <label style={{ display: 'block', color: theme.colors.text.secondary, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Readiness Status</label>
      <select 
        style={{ 
          width: '100%', 
          background: theme.colors.bg.input, 
          border: `1px solid ${theme.colors.border}`, 
          borderRadius: theme.borderRadius.md, 
          padding: theme.spacing.md, 
          color: theme.colors.text.primary, 
          fontSize: '1rem',
          marginBottom: theme.spacing.lg 
        }} 
        name="readinessStatus" 
        value={formData.readinessStatus} 
        onChange={handleChange}
      >
        {READINESS_STAGES.map(stage => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
      
      <label style={{ display: 'block', color: theme.colors.text.secondary, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Joke Type</label>
      <select 
        style={{ 
          width: '100%', 
          background: theme.colors.bg.input, 
          border: `1px solid ${theme.colors.border}`, 
          borderRadius: theme.borderRadius.md, 
          padding: theme.spacing.md, 
          color: theme.colors.text.primary, 
          fontSize: '1rem',
          marginBottom: theme.spacing.lg 
        }} 
        name="jokeType" 
        value={formData.jokeType} 
        onChange={handleChange}
      >
        <option value="Observational">Observational</option>
        <option value="Story">Story</option>
        <option value="One-liner">One-liner</option>
      </select>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <input type="checkbox" name="isClean" checked={formData.isClean} onChange={handleChange} />
        <span style={{ color: theme.colors.text.secondary }}>Clean content</span>
      </label>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.lg, marginTop: theme.spacing.xl }}>
        <button 
          style={{
            background: theme.colors.bg.surface,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border}`,
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer'
          }} 
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          style={{
            background: theme.colors.accent.green,
            color: 'white',
            border: 'none',
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            borderRadius: theme.borderRadius.md,
            cursor: 'pointer'
          }} 
          onClick={() => onSave(formData)}
        >
          Save Changes
        </button>
      </div>
    </>
  );
};

const JokeHistory = ({ joke }) => (
  <>
    <h3 style={{ marginTop: 0, color: theme.colors.text.primary }}>Performance History: {joke.title}</h3>
    {joke.performanceHistory && joke.performanceHistory.length > 0 ? (
      <ul style={{ color: theme.colors.text.secondary }}>
        {joke.performanceHistory.map((p, index) => (
          <li key={index}>{p.date}</li>
        ))}
      </ul>
    ) : (
      <p style={{ color: theme.colors.text.secondary }}>No performances logged yet.</p>
    )}
  </>
);

export const JokeCard = React.memo(({ joke, onDragStart }) => {
  const { startMeasure } = usePerformanceMonitor('JokeCard');
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const firebaseHooks = isDemoMode ? {} : useUserJokes();
  const dispatch = useAppDispatch();
  const [modal, setModal] = useState({ type: null });
  const [menu, setMenu] = useState({ open: false, position: {} });
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);

  const handleMenuClick = useCallback((e) => {
    e.stopPropagation();
    const rect = buttonRef.current.getBoundingClientRect();
    setMenu({ 
      open: true, 
      position: { 
        top: rect.bottom + 5, 
        left: rect.left - 150 
      } 
    });
  }, []);

  const handleMenuAction = useCallback(async (type) => {
    const endMeasure = startMeasure('menu-action');
    setMenu({ open: false, position: {} });
    
    if (['edit', 'history', 'archive'].includes(type)) {
      setModal({ type });
      endMeasure();
    } else if (type === 'cycle') {
      if (isDemoMode) {
        dispatch({ type: 'CYCLE_STATUS', payload: { id: joke.id } });
      } else {
        try {
          setLoading(true);
          const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];
          const currentIndex = READINESS_STAGES.indexOf(joke.readinessStatus);
          const nextIndex = (currentIndex + 1) % READINESS_STAGES.length;
          const newStatus = READINESS_STAGES[nextIndex];
          await firebaseHooks.updateJoke(joke.id, { readinessStatus: newStatus });
        } catch (error) {
          console.error('Error updating joke status:', error);
        } finally {
          setLoading(false);
        }
      }
    } else if (type === 'duplicate') {
      if (isDemoMode) {
        dispatch({ type: 'DUPLICATE_JOKE', payload: { id: joke.id } });
      } else {
        try {
          setLoading(true);
          await firebaseHooks.addJoke({
            ...joke,
            title: `${joke.title} (Copy)`,
            id: undefined
          });
        } catch (error) {
          console.error('Error duplicating joke:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    endMeasure();
  }, [isDemoMode, dispatch, joke.id, firebaseHooks, startMeasure]);
  
  const handleSaveEdit = async (editedJoke) => {
    if (isDemoMode) {
      dispatch({ type: 'EDIT_JOKE', payload: { joke: editedJoke } });
      setModal({ type: null });
    } else {
      try {
        setLoading(true);
        const { id, createdAt, updatedAt, ...updateData } = editedJoke;
        await firebaseHooks.updateJoke(joke.id, updateData);
        setModal({ type: null });
      } catch (error) {
        console.error('Error updating joke:', error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleArchive = async () => {
    if (isDemoMode) {
      dispatch({ type: 'ARCHIVE_JOKE', payload: { id: joke.id } });
      setModal({ type: null });
    } else {
      try {
        setLoading(true);
        await firebaseHooks.updateJoke(joke.id, { archived: true });
        setModal({ type: null });
      } catch (error) {
        console.error('Error archiving joke:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Modal isOpen={!!modal.type} onClose={() => setModal({ type: null })}>
        {modal.type === 'edit' && (
          <EditJokeForm 
            joke={joke} 
            onSave={handleSaveEdit} 
            onCancel={() => setModal({ type: null })} 
          />
        )}
        {modal.type === 'history' && <JokeHistory joke={joke} />}
        {modal.type === 'archive' && (
          <div>
            <h3 style={{ marginTop: 0, color: theme.colors.text.primary }}>Confirm Archive</h3>
            <p style={{ color: theme.colors.text.secondary, marginBottom: '2rem' }}>
              Are you sure you want to archive this joke? You can restore it later from your archived jokes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing.lg }}>
              <button 
                style={{
                  background: theme.colors.bg.surface,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border}`,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer'
                }}
                onClick={() => setModal({type: null})}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                style={{
                  background: theme.colors.accent.red,
                  color: 'white',
                  border: 'none',
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
                onClick={handleArchive}
                disabled={loading}
              >
                {loading ? 'Archiving...' : 'Archive Joke'}
              </button>
            </div>
          </div>
        )}
      </Modal>
      
      <CardContainer 
        draggable="true" 
        onDragStart={onDragStart}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        <ContextMenuButton ref={buttonRef} onClick={handleMenuClick} title="Joke Actions">
          <i className="fas fa-ellipsis-v"></i>
        </ContextMenuButton>
        
        {menu.open && <JokeContextMenu position={menu.position} onAction={handleMenuAction} />}
        
        <CardHeader>
          <CardTitle>{joke.title}</CardTitle>
        </CardHeader>
        
        <CardFooter>
          <StatusPill status={joke.readinessStatus} />
          <JokeTypePill type={joke.jokeType} />
          {joke.isClean && <CleanPill />}
        </CardFooter>
      </CardContainer>
    </>
  );
});

JokeCard.displayName = 'JokeCard';