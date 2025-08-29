/**
 * TimeInput Component
 * 
 * Professional time input component for MM:SS format.
 * Handles validation, auto-formatting, and provides real-time feedback.
 */

import React, { useState, useEffect } from 'react';

const TimeInputStyles = {
  Input: {
    fontFamily: 'monospace',
    textAlign: 'center',
    width: '60px',
    padding: '0.375rem 0.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  InputInvalid: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.1)'
  },
  InputFocused: {
    borderColor: 'var(--accent-green)',
    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)'
  }
};

export const TimeInput = ({ 
  value = 0, 
  onChange, 
  placeholder = "0:00",
  className = "",
  max = 3600, // 1 hour max
  disabled = false,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Parse MM:SS to seconds
  const parseTime = (input) => {
    if (!input || input === '') return 0;
    
    // Handle direct number input (legacy support)
    if (/^\d+$/.test(input)) {
      return Math.min(parseInt(input, 10), max);
    }
    
    // Handle MM:SS format
    const parts = input.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return Math.min(mins * 60 + secs, max);
    }
    
    // Handle single number as seconds
    if (parts.length === 1 && !isNaN(parts[0])) {
      return Math.min(parseInt(parts[0], 10) || 0, max);
    }
    
    return 0;
  };

  // Initialize display value from prop
  useEffect(() => {
    setDisplayValue(formatTime(value));
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    setDisplayValue(input);
    
    // Real-time validation
    const seconds = parseTime(input);
    const formatted = formatTime(seconds);
    
    // Valid formats: empty, partial (M:, MM:, MM:S), or complete (MM:SS)
    const valid = input === '' || 
                  input === formatted || 
                  /^\d{1,2}:?\d{0,2}$/.test(input) ||
                  /^\d+$/.test(input);
    
    setIsValid(valid);
    
    // Only call onChange if valid and different from current value
    if (valid && onChange && seconds !== value) {
      onChange(seconds);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Auto-format on blur
    const seconds = parseTime(displayValue);
    const formatted = formatTime(seconds);
    setDisplayValue(formatted);
    
    if (onChange && seconds !== value) {
      onChange(seconds);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    // Select all text on focus for easy replacement
    e.target.select();
  };

  const handleKeyPress = (e) => {
    // Allow navigation keys, backspace, delete
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return;
    }
    
    // Allow digits and colon
    if (!/[\d:]/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Determine input style based on state
  const getInputStyle = () => {
    let style = { ...TimeInputStyles.Input };
    
    if (!isValid) {
      style = { ...style, ...TimeInputStyles.InputInvalid };
    } else if (isFocused) {
      style = { ...style, ...TimeInputStyles.InputFocused };
    }
    
    if (disabled) {
      style.opacity = 0.6;
      style.cursor = 'not-allowed';
    }
    
    return style;
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyPress}
      placeholder={placeholder}
      className={`time-input ${className} ${!isValid ? 'invalid' : ''}`}
      style={getInputStyle()}
      disabled={disabled}
      {...props}
    />
  );
};

export default TimeInput;