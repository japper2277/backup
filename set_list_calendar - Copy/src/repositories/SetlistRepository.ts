/**
 * SetlistRepository - Handles all setlist-related Firebase operations
 * 
 * Provides type-safe CRUD operations for setlists with collaboration features,
 * sharing permissions, and real-time updates.
 */

import { BaseRepository } from './BaseRepository';
import type { Setlist, SetlistPermission, SetlistShare } from '../types';

export class SetlistRepository extends BaseRepository<Setlist> {
  constructor() {
    super('setlists');
  }

  /**
   * Transform Firestore document to Setlist entity
   */
  protected transformFromFirestore(doc: any): Setlist {
    return {
      id: doc.id,
      title: doc.title || 'Untitled Setlist',
      description: doc.description || '',
      jokeIds: doc.jokeIds || [],
      ownerId: doc.ownerId,
      isPublic: doc.isPublic || false,
      shareCode: doc.shareCode || null,
      permissions: doc.permissions || {},
      collaborators: doc.collaborators || [],
      tags: doc.tags || [],
      venue: doc.venue || null,
      performanceDate: doc.performanceDate?.toDate?.() || doc.performanceDate || null,
      duration: doc.duration || 0,
      notes: doc.notes || '',
      status: doc.status || 'draft',
      version: doc.version || 1,
      createdAt: doc.createdAt?.toDate?.() || doc.createdAt || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt || new Date()
    };
  }

  /**
   * Transform Setlist entity to Firestore document
   */
  protected transformToFirestore(entity: Partial<Setlist>): any {
    const doc: any = { ...entity };
    
    // Remove ID from the document data
    delete doc.id;
    
    return doc;
  }

  /**
   * Get user's setlists (owned + shared)
   */
  async getUserSetlists(userId: string) {
    // Get owned setlists
    const ownedResult = await this.getAll({
      where: [{ field: 'ownerId', operator: '==', value: userId }],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    });

    // Get shared setlists (where user is a collaborator)
    const sharedResult = await this.getAll({
      where: [{ field: 'collaborators', operator: 'array-contains', value: userId }],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    });

    if (!ownedResult.success) return ownedResult;
    if (!sharedResult.success) return sharedResult;

    // Combine and deduplicate
    const allSetlists = [
      ...(ownedResult.data || []),
      ...(sharedResult.data || [])
    ];

    const uniqueSetlists = allSetlists.filter((setlist, index, array) => 
      array.findIndex(s => s.id === setlist.id) === index
    );

    return {
      success: true,
      data: uniqueSetlists.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    };
  }

  /**
   * Subscribe to user's setlists in real-time
   */
  subscribeToUserSetlists(
    userId: string,
    callback: (setlists: Setlist[]) => void,
    errorCallback: (error: any) => void
  ) {
    // Subscribe to owned setlists
    const unsubscribeOwned = this.subscribe(
      callback,
      errorCallback,
      {
        where: [{ field: 'ownerId', operator: '==', value: userId }],
        orderBy: [{ field: 'updatedAt', direction: 'desc' }]
      }
    );

    // Subscribe to shared setlists
    const unsubscribeShared = this.subscribe(
      callback,
      errorCallback,
      {
        where: [{ field: 'collaborators', operator: 'array-contains', value: userId }],
        orderBy: [{ field: 'updatedAt', direction: 'desc' }]
      }
    );

    // Return combined unsubscribe function
    return () => {
      unsubscribeOwned();
      unsubscribeShared();
    };
  }

  /**
   * Create a new setlist with initial jokes
   */
  async createSetlistWithJokes(data: {
    title: string;
    description?: string;
    jokeIds: string[];
    ownerId: string;
    tags?: string[];
  }) {
    const setlistData = {
      title: data.title,
      description: data.description || '',
      jokeIds: data.jokeIds,
      ownerId: data.ownerId,
      tags: data.tags || [],
      shareCode: this.generateShareCode(),
      permissions: {},
      collaborators: [],
      isPublic: false,
      status: 'draft' as const,
      version: 1
    };

    return this.create(setlistData);
  }

  /**
   * Share setlist with specific users
   */
  async shareSetlist(
    setlistId: string, 
    userEmails: string[], 
    permission: SetlistPermission = 'view'
  ) {
    const result = await this.getById(setlistId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const setlist = result.data;
    
    // Update permissions for each user
    const updatedPermissions = { ...setlist.permissions };
    userEmails.forEach(email => {
      updatedPermissions[email] = permission;
    });

    // Add collaborators if they have edit permission
    const updatedCollaborators = [...setlist.collaborators];
    if (permission === 'edit') {
      userEmails.forEach(email => {
        if (!updatedCollaborators.includes(email)) {
          updatedCollaborators.push(email);
        }
      });
    }

    return this.update(setlistId, {
      permissions: updatedPermissions,
      collaborators: updatedCollaborators
    });
  }

  /**
   * Update setlist jokes order
   */
  async updateJokeOrder(setlistId: string, jokeIds: string[]) {
    return this.update(setlistId, { 
      jokeIds,
      version: Date.now() // Simple version increment for conflict resolution
    });
  }

  /**
   * Add jokes to setlist
   */
  async addJokesToSetlist(setlistId: string, jokeIds: string[]) {
    const result = await this.getById(setlistId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const setlist = result.data;
    const updatedJokeIds = [
      ...setlist.jokeIds,
      ...jokeIds.filter(id => !setlist.jokeIds.includes(id))
    ];

    return this.update(setlistId, { 
      jokeIds: updatedJokeIds,
      version: Date.now()
    });
  }

  /**
   * Remove jokes from setlist
   */
  async removeJokesFromSetlist(setlistId: string, jokeIds: string[]) {
    const result = await this.getById(setlistId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const setlist = result.data;
    const updatedJokeIds = setlist.jokeIds.filter(id => !jokeIds.includes(id));

    return this.update(setlistId, { 
      jokeIds: updatedJokeIds,
      version: Date.now()
    });
  }

  /**
   * Get setlist by share code
   */
  async getSetlistByShareCode(shareCode: string) {
    return this.getAll({
      where: [{ field: 'shareCode', operator: '==', value: shareCode }],
      limit: 1
    });
  }

  /**
   * Generate a unique share code
   */
  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clone a setlist
   */
  async cloneSetlist(setlistId: string, newTitle: string, ownerId: string) {
    const result = await this.getById(setlistId);
    
    if (!result.success || !result.data) {
      return result;
    }

    const original = result.data;
    
    return this.create({
      title: newTitle,
      description: `Copy of: ${original.description}`,
      jokeIds: [...original.jokeIds],
      ownerId,
      tags: [...original.tags],
      shareCode: this.generateShareCode(),
      permissions: {},
      collaborators: [],
      isPublic: false,
      status: 'draft',
      version: 1
    });
  }

  /**
   * Mark setlist as performed
   */
  async markAsPerformed(setlistId: string, performanceData: {
    venue?: string;
    performanceDate?: Date;
    notes?: string;
    duration?: number;
  }) {
    return this.update(setlistId, {
      ...performanceData,
      status: 'performed',
      version: Date.now()
    });
  }

  /**
   * Get public setlists for discovery
   */
  async getPublicSetlists(limit: number = 20) {
    return this.getAll({
      where: [{ field: 'isPublic', operator: '==', value: true }],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
      limit
    });
  }
}

// Singleton instance
export const setlistRepository = new SetlistRepository();