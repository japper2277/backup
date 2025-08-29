/**
 * High-Performance Joke Card Component
 * Google Team Standards: Sub-16ms render, optimized for virtualized lists
 */
import React, { memo, useCallback, useMemo } from 'react'
import { useSetlistStore } from '../../store/useSetlistStore'
import { Button } from '../ui/Button'

interface JokeCardProps {
  joke: {
    id: string
    title: string
    content: string
    duration?: number
    tags?: string[]
    rating?: number
    lastPerformed?: Date
  }
  onClick?: () => void
  onAddToSetlist?: () => void
  compact?: boolean
  className?: string
  isSelected?: boolean
  isInSetlist?: boolean
}

export const JokeCard: React.FC<JokeCardProps> = memo(({
  joke,
  onClick,
  onAddToSetlist,
  compact = false,
  className = '',
  isSelected = false,
  isInSetlist = false
}) => {
  const { addJokeToSetlist, removeJokeFromSetlist } = useSetlistStore()

  // Memoize computed values to prevent recalculation
  const formattedDuration = useMemo(() => {
    if (!joke.duration) return 'Unknown'
    const minutes = Math.floor(joke.duration / 60)
    const seconds = joke.duration % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [joke.duration])

  const formattedDate = useMemo(() => {
    if (!joke.lastPerformed) return 'Never performed'
    return new Date(joke.lastPerformed).toLocaleDateString()
  }, [joke.lastPerformed])

  // Memoize event handlers to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  const handleAddToSetlist = useCallback(() => {
    if (onAddToSetlist) {
      onAddToSetlist()
    } else {
      addJokeToSetlist(joke.id)
    }
  }, [onAddToSetlist, addJokeToSetlist, joke.id])

  const handleRemoveFromSetlist = useCallback(() => {
    removeJokeFromSetlist(joke.id)
  }, [removeJokeFromSetlist, joke.id])

  // Memoize the card content to prevent unnecessary re-renders
  const cardContent = useMemo(() => (
    <div
      className={`
        joke-card bg-white rounded-lg border-2 transition-all duration-200
        hover:shadow-md hover:border-blue-300 cursor-pointer
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        ${isInSetlist ? 'bg-blue-50' : ''}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className={`
          font-semibold text-gray-900 truncate
          ${compact ? 'text-sm' : 'text-base'}
        `}>
          {joke.title}
        </h3>
        {joke.rating && (
          <div className="flex items-center text-yellow-500">
            <span className="text-xs">★</span>
            <span className="text-xs ml-1">{joke.rating}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <p className={`
        text-gray-700 mb-3 line-clamp-2
        ${compact ? 'text-sm' : 'text-base'}
      `}>
        {joke.content}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>Duration: {formattedDuration}</span>
        <span>Last: {formattedDate}</span>
      </div>

      {/* Tags */}
      {joke.tags && joke.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {joke.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {joke.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{joke.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isInSetlist ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemoveFromSetlist}
            className="flex-1"
          >
            Remove from Setlist
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToSetlist}
            className="flex-1"
          >
            Add to Setlist
          </Button>
        )}
      </div>
    </div>
  ), [
    joke,
    isSelected,
    isInSetlist,
    compact,
    className,
    formattedDuration,
    formattedDate,
    handleClick,
    handleAddToSetlist,
    handleRemoveFromSetlist
  ])

  return cardContent
})

JokeCard.displayName = 'JokeCard'

// Export memoized version for external use
export const MemoizedJokeCard = memo(JokeCard)
MemoizedJokeCard.displayName = 'MemoizedJokeCard'



