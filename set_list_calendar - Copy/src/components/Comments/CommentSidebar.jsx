import React, { useState, useRef, useEffect } from 'react';
import { useJokeComments } from '../../hooks/useJokeComments.js';
import { useAuth } from '../../contexts/AuthContext';

const CommentStyles = {
  Overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 1000
  },
  Sidebar: {
    width: '400px',
    maxWidth: '90vw',
    height: '100%',
    background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease'
  },
  Header: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-surface-2)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  Title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0
  },
  CloseButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.5rem',
    fontSize: '1.2rem'
  },
  JokeInfo: {
    padding: '1rem',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-surface-2)'
  },
  JokeTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem'
  },
  JokeText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4
  },
  CommentsContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  Comment: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.75rem'
  },
  Avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 600,
    flexShrink: 0
  },
  CommentContent: {
    flex: 1,
    background: 'var(--bg-surface-2)',
    borderRadius: '8px',
    padding: '0.75rem'
  },
  CommentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  AuthorName: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  Timestamp: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)'
  },
  CommentText: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    whiteSpace: 'pre-wrap'
  },
  InputContainer: {
    padding: '1rem',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-surface-2)'
  },
  InputWrapper: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end'
  },
  TextArea: {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '0.75rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    resize: 'none',
    minHeight: '40px',
    maxHeight: '120px',
    fontFamily: 'inherit'
  },
  SendButton: {
    background: 'var(--accent-green)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '40px'
  },
  EmptyState: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    padding: '2rem',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  Loading: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '2rem'
  },
  Error: {
    color: 'var(--accent-red)',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '1rem'
  }
};

export function CommentSidebar({ setlistId, joke, onClose }) {
  const { currentUser } = useAuth();
  const { 
    comments, 
    commentCount,
    loading, 
    error, 
    addComment: addNewComment,
    formatRelativeTime 
  } = useJokeComments(setlistId, joke?.id);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textAreaRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Auto-focus textarea
  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addNewComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Using formatRelativeTime from the hook instead of local implementation

  const getUserInitials = (authorName) => {
    if (!authorName) return '?';
    return authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={CommentStyles.Overlay} onClick={onClose}>
      <div style={CommentStyles.Sidebar} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={CommentStyles.Header}>
          <h3 style={CommentStyles.Title}>Comments</h3>
          <button style={CommentStyles.CloseButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Joke Info */}
        <div style={CommentStyles.JokeInfo}>
          <div style={CommentStyles.JokeTitle}>{joke?.title}</div>
          {joke?.text && (
            <div style={CommentStyles.JokeText}>
              {joke.text.length > 100 ? `${joke.text.slice(0, 100)}...` : joke.text}
            </div>
          )}
        </div>

        {/* Comments List */}
        <div style={CommentStyles.CommentsContainer}>
          {loading && <div style={CommentStyles.Loading}>Loading comments...</div>}
          
          {error && <div style={CommentStyles.Error}>Error loading comments: {error.message}</div>}
          
          {!loading && !error && comments.length === 0 && (
            <div style={CommentStyles.EmptyState}>
              <i className="fas fa-comment" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <div>No comments yet</div>
              <div style={{ fontSize: '0.8rem' }}>Be the first to share your thoughts!</div>
            </div>
          )}

          {comments.map(comment => (
            <div key={comment.id} style={CommentStyles.Comment}>
              <div style={CommentStyles.Avatar}>
                {comment.authorAvatar ? (
                  <img 
                    src={comment.authorAvatar} 
                    alt="" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  />
                ) : (
                  getUserInitials(comment.authorName)
                )}
              </div>
              <div style={CommentStyles.CommentContent}>
                <div style={CommentStyles.CommentHeader}>
                  <span style={CommentStyles.AuthorName}>
                    {comment.authorName || 'Anonymous'}
                  </span>
                  <span style={CommentStyles.Timestamp}>
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <div style={CommentStyles.CommentText}>
                  {comment.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Input */}
        <div style={CommentStyles.InputContainer}>
          <form onSubmit={handleSubmit}>
            <div style={CommentStyles.InputWrapper}>
              <textarea
                ref={textAreaRef}
                style={CommentStyles.TextArea}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a comment..."
                disabled={isSubmitting}
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                type="submit"
                style={{
                  ...CommentStyles.SendButton,
                  opacity: (!newComment.trim() || isSubmitting) ? 0.5 : 1,
                  cursor: (!newComment.trim() || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}