/**
 * JokeRepository - Handles all joke-related Firebase operations
 * 
 * Provides type-safe CRUD operations for jokes with proper error handling
 * and performance optimizations.
 */

import { BaseRepository } from './BaseRepository';
import type { Joke, JokeFilters } from '../types';

export class JokeRepository extends BaseRepository<Joke> {
  constructor() {
    super('jokes');
  }

  /**
   * Transform Firestore document to Joke entity
   */
  protected transformFromFirestore(doc: any): Joke {
    return {
      id: doc.id,
      title: doc.title || '',
      text: doc.text || '',
      readinessStatus: doc.readinessStatus || 'Idea',
      jokeType: doc.jokeType || 'Observational',
      isClean: doc.isClean || false,
      estimated_duration: doc.estimated_duration || 60,
      tags: doc.tags || [],
      notes: doc.notes || '',
      performanceHistory: doc.performanceHistory || [],
      archived: doc.archived || false,
      userId: doc.userId,
      createdAt: doc.createdAt?.toDate?.() || doc.createdAt || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt || new Date()
    };
  }

  /**
   * Transform Joke entity to Firestore document
   */
  protected transformToFirestore(entity: Partial<Joke>): any {
    const doc: any = { ...entity };
    
    // Remove ID from the document data
    delete doc.id;
    
    return doc;
  }

  /**
   * Get user's jokes with optional filtering
   */
  async getUserJokes(userId: string, filters?: JokeFilters) {
    const options: any = {
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    };

    // Apply additional filters
    if (filters?.jokeType && filters.jokeType !== 'all') {
      options.where.push({ field: 'jokeType', operator: '==', value: filters.jokeType });
    }

    if (filters?.readinessStatus && filters.readinessStatus !== 'all') {
      options.where.push({ field: 'readinessStatus', operator: '==', value: filters.readinessStatus });
    }

    if (filters?.isClean !== undefined) {
      options.where.push({ field: 'isClean', operator: '==', value: filters.isClean });
    }

    // Exclude archived jokes by default
    if (!filters?.includeArchived) {
      options.where.push({ field: 'archived', operator: '==', value: false });
    }

    return this.getAll(options);
  }

  /**
   * Subscribe to user's jokes in real-time
   */
  subscribeToUserJokes(
    userId: string,
    callback: (jokes: Joke[]) => void,
    errorCallback: (error: any) => void,
    filters?: JokeFilters
  ) {
    const options: any = {
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'archived', operator: '==', value: false }
      ],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    };

    // Apply filters if provided
    if (filters?.jokeType && filters.jokeType !== 'all') {
      options.where.push({ field: 'jokeType', operator: '==', value: filters.jokeType });
    }

    return this.subscribe(callback, errorCallback, options);
  }

  /**
   * Archive a joke (soft delete)
   */
  async archiveJoke(id: string) {
    return this.update(id, { archived: true });
  }

  /**
   * Restore an archived joke
   */
  async restoreJoke(id: string) {
    return this.update(id, { archived: false });
  }

  /**
   * Search jokes by text content
   */
  async searchJokes(userId: string, searchTerm: string) {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia or similar for production
    const result = await this.getUserJokes(userId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const filteredJokes = result.data.filter(joke => 
      joke.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      joke.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      joke.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return {
      ...result,
      data: filteredJokes
    };
  }

  /**
   * Update joke performance history
   */
  async addPerformanceEntry(jokeId: string, performanceData: any) {
    const result = await this.getById(jokeId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const joke = result.data;
    const updatedHistory = [
      ...joke.performanceHistory,
      {
        ...performanceData,
        timestamp: new Date(),
        id: crypto.randomUUID()
      }
    ];

    return this.update(jokeId, { performanceHistory: updatedHistory });
  }

  /**
   * Get jokes by readiness status
   */
  async getJokesByReadiness(userId: string, readinessStatus: string) {
    return this.getUserJokes(userId, { readinessStatus });
  }

  /**
   * Bulk update joke statuses
   */
  async bulkUpdateReadiness(jokeIds: string[], readinessStatus: string) {
    const operations = jokeIds.map(id => ({
      type: 'update' as const,
      id,
      data: { readinessStatus }
    }));

    return this.batchUpdate(operations);
  }
}

// Singleton instance
export const jokeRepository = new JokeRepository();