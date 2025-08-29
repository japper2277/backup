/**
 * CommentInput Component
 * 
 * Rich text input for writing comments with @mention autocomplete support.
 * Features mention suggestions, character counter, and keyboard shortcuts.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';

const InputStyles = {
  Container: {
    position: 'relative'
  },
  Input: {
    width: '100%',
    minHeight: '60px',
    padding: '0.75rem',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.4,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  InputFocused: {
    borderColor: 'var(--accent-blue)',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.1)'
  },
  InputCompact: {
    minHeight: '40px',
    fontSize: '0.85rem'
  },
  Actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '0.5rem',
    gap: '0.5rem'
  },
  LeftActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1
  },
  RightActions: {
    display: 'flex',
    gap: '0.5rem'
  },
  CharCounter: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  CharCounterWarning: {
    color: '#f59e0b'
  },
  CharCounterError: {
    color: '#ef4444'
  },
  MentionHint: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic'
  },
  Button: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.2s ease'
  },
  SubmitButton: {
    backgroundColor: 'var(--accent-blue)',
    color: 'white'
  },
  SubmitButtonDisabled: {
    backgroundColor: 'var(--text-secondary)',
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  CancelButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)'
  },
  MentionDropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    marginBottom: '0.25rem',
    maxHeight: '150px',
    overflowY: 'auto',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    zIndex: 100
  },
  MentionItem: {
    padding: '0.5rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'background-color 0.15s ease'
  },
  MentionItemActive: {
    backgroundColor: 'var(--accent-blue)',
    color: 'white'
  },
  MentionAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'white',
    flexShrink: 0
  },
  MentionName: {
    fontWeight: 500
  },
  MentionUsername: {
    opacity: 0.7,
    fontSize: '0.8em'
  }
};

// Get avatar color for user
const getAvatarColor = (userId) => {
  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316'
  ];
  
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

// Get user initials
const getUserInitials = (user) => {
  if (user.displayName && user.displayName !== 'Anonymous') {
    return user.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return (user.userId || user.id || 'U').slice(0, 2).toUpperCase();
};

export const CommentInput = ({ 
  onSubmit, 
  onCancel,
  collaborators = [],
  placeholder = "Write a comment...",
  disabled = false,
  compact = false,
  maxLength = 1000
}) => {
  const [content, setContent] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // @mention functionality
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  
  const inputRef = useRef(null);

  // Filter collaborators for mentions
  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return collaborators.slice(0, 5);
    
    return collaborators
      .filter(user => 
        user.displayName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.userId?.toLowerCase().includes(mentionQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [collaborators, mentionQuery]);

  // Handle input changes and mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(value);

    // Check for @mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      setMentionStartPos(cursorPos - mentionMatch[0].length);
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
      setMentionStartPos(-1);
    }
  };

  // Handle key presses
  const handleKeyDown = (e) => {
    // Handle mention navigation
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev < filteredMentions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => 
          prev > 0 ? prev - 1 : filteredMentions.length - 1
        );
        return;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentions[selectedMentionIndex]);
        return;
      }

      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    // Handle submit shortcuts
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Insert mention into text
  const insertMention = (user) => {
    const beforeMention = content.substring(0, mentionStartPos);
    const afterMention = content.substring(mentionStartPos + mentionQuery.length + 1);
    const newContent = beforeMention + `@${user.displayName || user.userId} ` + afterMention;

    setContent(newContent);
    setShowMentions(false);
    setMentionQuery('');
    setMentionStartPos(-1);

    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = beforeMention.length + (user.displayName || user.userId).length + 2;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    }, 0);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim() || submitting || disabled) return;

    setSubmitting(true);
    try {
      // Extract mentions
      const mentionRegex = /@([a-zA-Z0-9_\s]+?)(?=\s|$)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionText = match[1].trim();
        const collaborator = collaborators.find(c => 
          c.displayName?.toLowerCase() === mentionText.toLowerCase() ||
          c.userId?.toLowerCase() === mentionText.toLowerCase()
        );
        if (collaborator && !mentions.includes(collaborator.userId)) {
          mentions.push(collaborator.userId);
        }
      }

      await onSubmit(content.trim(), mentions);
      setContent('');
      setFocused(false);
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setContent('');
    setFocused(false);
    setShowMentions(false);
    onCancel?.();
  };

  // Character count styling
  const getCharCountStyle = () => {
    const remaining = maxLength - content.length;
    if (remaining < 0) return InputStyles.CharCounterError;
    if (remaining < 50) return InputStyles.CharCounterWarning;
    return InputStyles.CharCounter;
  };

  const canSubmit = content.trim().length > 0 && content.length <= maxLength && !submitting && !disabled;

  return (
    <div style={InputStyles.Container}>
      {/* Mention Dropdown */}
      {showMentions && filteredMentions.length > 0 && (
        <div style={InputStyles.MentionDropdown}>
          {filteredMentions.map((user, index) => (
            <div
              key={user.userId}
              style={{
                ...InputStyles.MentionItem,
                ...(index === selectedMentionIndex ? InputStyles.MentionItemActive : {})
              }}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div 
                style={{
                  ...InputStyles.MentionAvatar,
                  backgroundColor: getAvatarColor(user.userId)
                }}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.displayName}
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  getUserInitials(user)
                )}
              </div>
              <div>
                <div style={InputStyles.MentionName}>
                  {user.displayName || 'Anonymous'}
                </div>
                {user.userId && (
                  <div style={InputStyles.MentionUsername}>
                    @{user.userId}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Text Input */}
      <textarea
        ref={inputRef}
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 100)} // Delay to allow mention clicks
        placeholder={placeholder}
        disabled={disabled || submitting}
        style={{
          ...InputStyles.Input,
          ...(compact ? InputStyles.InputCompact : {}),
          ...(focused ? InputStyles.InputFocused : {})
        }}
      />

      {/* Actions */}
      {(focused || content.trim().length > 0) && (
        <div style={InputStyles.Actions}>
          <div style={InputStyles.LeftActions}>
            <div style={InputStyles.MentionHint}>
              💡 Type @ to mention collaborators
            </div>
            <div style={getCharCountStyle()}>
              {maxLength - content.length} characters remaining
            </div>
          </div>

          <div style={InputStyles.RightActions}>
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  ...InputStyles.Button,
                  ...InputStyles.CancelButton
                }}
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                ...InputStyles.Button,
                ...InputStyles.SubmitButton,
                ...(!canSubmit ? InputStyles.SubmitButtonDisabled : {})
              }}
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentInput;