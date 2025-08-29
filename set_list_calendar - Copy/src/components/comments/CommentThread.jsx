/**
 * CommentThread Component
 * 
 * Displays a comment with its replies in a threaded structure.
 * Supports editing, deleting, and replying to comments.
 */

import React, { useState } from 'react';
import { useJokeComments } from '../../hooks/useJokeComments.js';
import { CommentInput } from './CommentInput.jsx';

const ThreadStyles = {
  Comment: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-surface-2)',
    borderRadius: '8px',
    border: '1px solid var(--border-color)'
  },
  CommentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  Avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'white',
    flexShrink: 0
  },
  AvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  AuthorInfo: {
    flex: 1
  },
  AuthorName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.1rem'
  },
  CommentTime: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  EditedIndicator: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic'
  },
  CommentContent: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    marginBottom: '0.75rem',
    wordBreak: 'break-word'
  },
  CommentActions: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.8rem'
  },
  ActionButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.25rem 0',
    fontSize: '0.8rem',
    transition: 'color 0.2s ease'
  },
  Replies: {
    marginTop: '1rem',
    paddingLeft: '1rem',
    borderLeft: '2px solid var(--border-color)'
  },
  ReplyInput: {
    marginTop: '0.75rem'
  },
  EditInput: {
    marginBottom: '0.75rem'
  },
  EditActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  EditButton: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.8rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  SaveButton: {
    backgroundColor: 'var(--accent-blue)',
    color: 'white'
  },
  CancelButton: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)'
  },
  MentionHighlight: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.1rem 0.3rem',
    borderRadius: '3px',
    fontSize: '0.85em',
    fontWeight: 500
  }
};

// Get user avatar color
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
  if (user.authorName && user.authorName !== 'Anonymous') {
    return user.authorName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.authorId.slice(0, 2).toUpperCase();
};

// Highlight @mentions in comment content
const highlightMentions = (content, collaborators = []) => {
  if (!content) return content;
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  return content.split(mentionRegex).map((part, index) => {
    if (index % 2 === 1) {
      // This is a mention
      const collaborator = collaborators.find(c => 
        c.displayName?.toLowerCase() === part.toLowerCase() ||
        c.userId === part
      );
      
      if (collaborator) {
        return (
          <span key={index} style={ThreadStyles.MentionHighlight}>
            @{collaborator.displayName || part}
          </span>
        );
      }
    }
    return part;
  });
};

export const CommentThread = ({ 
  comment, 
  setlistId, 
  jokeId, 
  collaborators = [],
  formatRelativeTime,
  level = 0 // Threading depth
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [imageError, setImageError] = useState(false);

  const { editComment, deleteComment, addComment } = useJokeComments(setlistId, jokeId);

  const handleReply = async (content, mentions = []) => {
    try {
      await addComment(content, mentions, comment.id);
      setShowReplyInput(false);
    } catch (err) {
      console.error('Failed to add reply:', err);
    }
  };

  const handleEdit = async () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      // Extract mentions from content
      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(editContent)) !== null) {
        const collaborator = collaborators.find(c => 
          c.displayName?.toLowerCase() === match[1].toLowerCase()
        );
        if (collaborator) {
          mentions.push(collaborator.userId);
        }
      }

      await editComment(comment.id, editContent.trim(), mentions);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit comment:', err);
      setEditContent(comment.content); // Reset on error
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(comment.id);
      } catch (err) {
        console.error('Failed to delete comment:', err);
      }
    }
  };

  const canEdit = comment.authorId === window.auth?.currentUser?.uid;
  const canDelete = canEdit;

  const maxLevel = 3; // Maximum nesting depth
  const shouldNest = level < maxLevel;

  return (
    <div style={ThreadStyles.Comment}>
      {/* Comment Header */}
      <div style={ThreadStyles.CommentHeader}>
        <div 
          style={{
            ...ThreadStyles.Avatar,
            backgroundColor: getAvatarColor(comment.authorId)
          }}
        >
          {comment.authorAvatar && !imageError ? (
            <img 
              src={comment.authorAvatar}
              alt={comment.authorName}
              style={ThreadStyles.AvatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            getUserInitials(comment)
          )}
        </div>

        <div style={ThreadStyles.AuthorInfo}>
          <div style={ThreadStyles.AuthorName}>
            {comment.authorName}
          </div>
          <div style={ThreadStyles.CommentTime}>
            {formatRelativeTime(comment.createdAt)}
            {comment.isEdited && (
              <span style={ThreadStyles.EditedIndicator}> • edited</span>
            )}
          </div>
        </div>
      </div>

      {/* Comment Content */}
      {isEditing ? (
        <div style={ThreadStyles.EditInput}>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            placeholder="Edit your comment..."
            autoFocus
          />
          <div style={ThreadStyles.EditActions}>
            <button
              style={{
                ...ThreadStyles.EditButton,
                ...ThreadStyles.SaveButton
              }}
              onClick={handleEdit}
            >
              Save
            </button>
            <button
              style={{
                ...ThreadStyles.EditButton,
                ...ThreadStyles.CancelButton
              }}
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={ThreadStyles.CommentContent}>
          {highlightMentions(comment.content, collaborators)}
        </div>
      )}

      {/* Comment Actions */}
      {!isEditing && (
        <div style={ThreadStyles.CommentActions}>
          {shouldNest && (
            <button
              style={ThreadStyles.ActionButton}
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              💬 Reply
            </button>
          )}

          {canEdit && (
            <button
              style={ThreadStyles.ActionButton}
              onClick={() => setIsEditing(true)}
            >
              ✏️ Edit
            </button>
          )}

          {canDelete && (
            <button
              style={ThreadStyles.ActionButton}
              onClick={handleDelete}
            >
              🗑️ Delete
            </button>
          )}

          {comment.replies?.length > 0 && (
            <span style={{ color: 'var(--text-secondary)' }}>
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      )}

      {/* Reply Input */}
      {showReplyInput && (
        <div style={ThreadStyles.ReplyInput}>
          <CommentInput
            onSubmit={handleReply}
            collaborators={collaborators}
            placeholder={`Reply to ${comment.authorName}...`}
            onCancel={() => setShowReplyInput(false)}
            compact
          />
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && shouldNest && (
        <div style={ThreadStyles.Replies}>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              setlistId={setlistId}
              jokeId={jokeId}
              collaborators={collaborators}
              formatRelativeTime={formatRelativeTime}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;