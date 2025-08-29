import React, { useState } from 'react';
import { theme } from '../../styles/theme';

const READINESS_STAGES = ['Idea', 'Workshopping', 'Tight 5 Ready', 'Show Ready'];

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

export const AddJokeForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    readinessStatus: 'Idea',
    jokeType: 'Observational',
    isClean: false,
    estimated_duration: 60,
    notes: ''
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(d => ({ ...d, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  };
  
  return (
    <>
      <h3 style={StyledForm.ModalHeader}>Add New Joke</h3>
      <form onSubmit={handleSubmit}>
        <label style={StyledForm.FormLabel}>Title *</label>
        <input 
          style={StyledForm.FormInput} 
          name="title" 
          value={formData.title} 
          onChange={handleChange}
          placeholder="Enter joke title..."
          required
        />
        <label style={StyledForm.FormLabel}>Text</label>
        <textarea 
          style={{...StyledForm.FormInput, height: '100px'}} 
          name="text" 
          value={formData.text} 
          onChange={handleChange}
          placeholder="Enter joke content..."
        />
        <label style={StyledForm.FormLabel}>Readiness Status</label>
        <select style={StyledForm.FormInput} name="readinessStatus" value={formData.readinessStatus} onChange={handleChange}>
          {READINESS_STAGES.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <label style={StyledForm.FormLabel}>Joke Type</label>
        <select style={StyledForm.FormInput} name="jokeType" value={formData.jokeType} onChange={handleChange}>
          <option value="Observational">Observational</option>
          <option value="Story">Story</option>
          <option value="One-liner">One-liner</option>
        </select>
        <label style={StyledForm.FormLabel}>
          <input type="checkbox" name="isClean" checked={formData.isClean} onChange={handleChange} />
          Clean content
        </label>
        <div style={StyledForm.ModalActions}>
          <button type="button" style={{...StyledForm.PerformanceModeButton, background: theme.colors.bg.surface}} onClick={onCancel}>Cancel</button>
          <button type="submit" style={StyledForm.PerformanceModeButton}>Add Joke</button>
        </div>
      </form>
    </>
  );
};