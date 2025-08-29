/**
 * useJokeComments Hook
 * 
 * Manages real-time comments for a specific joke in collaborative setlists.
 * Provides comment CRUD operations with optimistic updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  addComment, 
  subscribeToJokeComments, 
  updateComment, 
  deleteComment 
} from '../api/collaborationService.ts';

/**
 * Hook for managing joke comments
 * @param {string} setlistId - The ID of the setlist
 * @param {string} jokeId - The ID of the joke
 * @returns {Object} Comment state and actions
 */
export const useJokeComments = (setlistId, jokeId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to real-time comments
  useEffect(() => {
    if (!setlistId || !jokeId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToJokeComments(
      setlistId,
      jokeId,
      (newComments) => {
        setComments(newComments);
        setLoading(false);
      },
      (err) => {
        console.error('Comments subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [setlistId, jokeId]);

  // Add new comment
  const addNewComment = useCallback(async (content, mentions = [], parentId = null) => {
    if (!content.trim()) return null;

    setSubmitting(true);
    try {
      const newComment = await addComment(setlistId, jokeId, content.trim(), mentions, parentId);
      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [setlistId, jokeId]);

  // Edit existing comment
  const editComment = useCallback(async (commentId, content, mentions = []) => {
    if (!content.trim()) return;

    try {
      await updateComment(setlistId, commentId, content.trim(), mentions);
    } catch (err) {
      console.error('Error updating comment:', err);
      setError(err);
      throw err;
    }
  }, [setlistId]);

  // Remove comment
  const removeComment = useCallback(async (commentId) => {
    try {
      await deleteComment(setlistId, commentId, jokeId);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err);
      throw err;
    }
  }, [setlistId, jokeId]);

  // Parse comments into threaded structure
  const threadedComments = useMemo(() => {
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create comment map
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build thread structure
    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return rootComments;
  }, [comments]);

  // Get comment count
  const commentCount = comments.length;

  // Get reply count for a specific comment
  const getReplyCount = useCallback((commentId) => {
    return comments.filter(comment => comment.parentId === commentId).length;
  }, [comments]);

  // Extract mentions from content
  const extractMentions = useCallback((content) => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }, []);

  // Format relative time
  const formatRelativeTime = useCallback((dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  return {
    // Comment data
    comments: threadedComments,
    rawComments: comments,
    commentCount,
    
    // State flags  
    loading,
    error,
    submitting,
    
    // Actions
    addComment: addNewComment,
    editComment,
    deleteComment: removeComment,
    
    // Utilities
    getReplyCount,
    extractMentions,
    formatRelativeTime,
    
    // Clear error
    clearError: () => setError(null)
  };
};

export default useJokeComments;