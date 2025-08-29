import React, { useState } from 'react';
import { theme } from '../../styles/theme';
import { trackSetlistCreated } from '../../services/analytics';

const StyledForm = {
  ModalHeader: { marginTop: 0, color: theme.colors.text.primary },
  FormLabel: { display: 'block', color: theme.colors.text.secondary, marginBottom: '0.5rem', fontSize: '0.9rem' },
  FormInput: { 
    width: '100%', 
    background: theme.colors.bg.input, 
    border: `1px solid ${theme.colors.border}`, 
    borderRadius: theme.borderRadius.md, 
    padding: theme.spacing.md, 
    color: theme.colors.text.primary, 
    fontSize: '1rem',
    marginBottom: theme.spacing.lg 
  },
  ModalActions: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: theme.spacing.lg, 
    marginTop: theme.spacing.xl 
  },
  PerformanceModeButton: { 
    background: theme.colors.accent.green, 
    color: 'white', 
    border: 'none', 
    padding: `${theme.spacing.md} ${theme.spacing.lg}`, 
    borderRadius: theme.borderRadius.md, 
    cursor: 'pointer' 
  }
};

export const CreateSetlistForm = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      const result = onSave(name.trim());
      
      // Track setlist creation - if onSave returns a setlist ID or promise
      if (result && typeof result.then === 'function') {
        result.then((setlistId) => {
          if (setlistId) {
            trackSetlistCreated(setlistId);
          }
        }).catch(console.error);
      } else if (result) {
        trackSetlistCreated(result);
      }
    }
  };
  
  return (
    <>
      <h3 style={StyledForm.ModalHeader}>Create New Setlist</h3>
      <form onSubmit={handleSubmit}>
        <label style={StyledForm.FormLabel}>Setlist Name *</label>
        <input 
          style={StyledForm.FormInput} 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter setlist name..."
          required
          autoFocus
        />
        <div style={StyledForm.ModalActions}>
          <button type="button" style={{...StyledForm.PerformanceModeButton, background: theme.colors.bg.surface}} onClick={onCancel}>Cancel</button>
          <button type="submit" style={StyledForm.PerformanceModeButton}>Create Setlist</button>
        </div>
      </form>
    </>
  );
};