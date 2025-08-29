/**
 * JokeCommentModal Component
 * 
 * Modal interface for viewing and adding comments to a specific joke.
 * Features real-time comments, threading, @mentions, and rich interactions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useJokeComments } from '../../hooks/useJokeComments.js';
import { CommentThread } from './CommentThread.jsx';
import { CommentInput } from './CommentInput.jsx';

const ModalStyles = {
  Overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  Modal: {
    background: 'var(--bg-surface)',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)'
  },
  Header: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem'
  },
  Title: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
    flex: 1
  },
  JokePreview: {
    backgroundColor: 'var(--bg-surface-2)',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    fontStyle: 'italic',
    marginTop: '0.5rem',
    border: '1px solid var(--border-color)'
  },
  CloseButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  Body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },
  CommentsContainer: {
    flex: 1,
    padding: '1rem 1.5rem',
    overflowY: 'auto',
    minHeight: 0
  },
  InputContainer: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid var(--border-color)'
  },
  EmptyState: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '2rem',
    fontStyle: 'italic'
  },
  LoadingState: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  ErrorState: {
    textAlign: 'center',
    color: '#ef4444',
    padding: '1.5rem',
    fontSize: '0.9rem'
  },
  CommentCounter: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: 500
  }
};

// Hover effect for close button
const closeButtonHoverStyle = {
  backgroundColor: 'var(--bg-surface-2)',
  color: 'var(--text-primary)'
};

export const JokeCommentModal = ({ 
  joke, 
  setlistId, 
  isOpen, 
  onClose,
  collaborators = [] // List of collaborators for @mentions
}) => {
  const [closeButtonHovered, setCloseButtonHovered] = useState(false);
  const modalRef = useRef(null);
  
  const {
    comments,
    commentCount,
    loading,
    error,
    submitting,
    addComment,
    clearError,
    formatRelativeTime
  } = useJokeComments(setlistId, joke?.id);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !joke) return null;

  const handleAddComment = async (content, mentions = []) => {
    try {
      await addComment(content, mentions);
    } catch (err) {
      console.error('Failed to add comment:', err);
      // Error is handled by the hook
    }
  };

  const truncateJoke = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div style={ModalStyles.Overlay}>
      <div ref={modalRef} style={ModalStyles.Modal}>
        {/* Header */}
        <div style={ModalStyles.Header}>
          <div style={{ flex: 1 }}>
            <h3 style={ModalStyles.Title}>💬 Joke Discussion</h3>
            <div style={ModalStyles.CommentCounter}>
              {commentCount === 0 ? 'No comments yet' : 
               commentCount === 1 ? '1 comment' : 
               `${commentCount} comments`}
            </div>
            <div style={ModalStyles.JokePreview}>
              {truncateJoke(joke.text)}
            </div>
          </div>
          <button
            style={{
              ...ModalStyles.CloseButton,
              ...(closeButtonHovered ? closeButtonHoverStyle : {})
            }}
            onClick={onClose}
            onMouseEnter={() => setCloseButtonHovered(true)}
            onMouseLeave={() => setCloseButtonHovered(false)}
            aria-label="Close comments"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={ModalStyles.Body}>
          {/* Comments Container */}
          <div style={ModalStyles.CommentsContainer}>
            {error && (
              <div style={ModalStyles.ErrorState}>
                <div>Error loading comments: {error.message}</div>
                <button 
                  onClick={clearError}
                  style={{
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {loading && (
              <div style={ModalStyles.LoadingState}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--border-color)',
                  borderTop: '2px solid var(--accent-blue)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}>
                </div>
                Loading comments...
              </div>
            )}

            {!loading && !error && comments.length === 0 && (
              <div style={ModalStyles.EmptyState}>
                Be the first to comment on this joke! 💭
              </div>
            )}

            {!loading && !error && comments.length > 0 && (
              <div>
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    setlistId={setlistId}
                    jokeId={joke.id}
                    collaborators={collaborators}
                    formatRelativeTime={formatRelativeTime}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          <div style={ModalStyles.InputContainer}>
            <CommentInput
              onSubmit={handleAddComment}
              collaborators={collaborators}
              disabled={submitting || loading}
              placeholder="Add a comment..."
            />
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default JokeCommentModal;