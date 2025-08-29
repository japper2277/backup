/**
 * Repository Pattern Implementation
 * Clean data access layer with proper error handling
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  WriteBatch,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { BaseEntity, APIResponse, APIError } from '../types';

/**
 * Base Repository Class
 * Provides common CRUD operations with type safety
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get collection reference
   */
  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Transform Firestore document to app entity
   */
  protected abstract transformFromFirestore(doc: any): T;

  /**
   * Transform app entity to Firestore document
   */
  protected abstract transformToFirestore(entity: Partial<T>): any;

  /**
   * Handle repository errors consistently
   */
  protected handleError(error: any, operation: string): APIError {
    console.error(`${this.collectionName} ${operation} error:`, error);
    
    return {
      code: error.code || 'unknown',
      message: error.message || `Failed to ${operation}`,
      details: error,
      timestamp: new Date()
    };
  }

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<T>> {
    try {
      const now = Timestamp.now();
      const docData = this.transformToFirestore({
        ...data,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      } as Partial<T>);

      const docRef = await addDoc(this.getCollectionRef(), docData);
      const newDoc = await getDoc(docRef);
      
      if (!newDoc.exists()) {
        throw new Error('Document was not created');
      }

      const entity = this.transformFromFirestore({ id: newDoc.id, ...newDoc.data() });
      
      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'create')
      };
    }
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<APIResponse<T>> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: {
            code: 'not-found',
            message: `${this.collectionName} not found`,
            timestamp: new Date()
          }
        };
      }

      const entity = this.transformFromFirestore({ 
        id: docSnap.id, 
        ...docSnap.data() 
      });
      
      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'getById')
      };
    }
  }

  /**
   * Update entity
   */
  async update(id: string, updates: Partial<T>): Promise<APIResponse<T>> {
    try {
      const docRef = this.getDocRef(id);
      const updateData = this.transformToFirestore({
        ...updates,
        updatedAt: Timestamp.now().toDate()
      });

      await updateDoc(docRef, updateData);
      
      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Document not found after update');
      }

      const entity = this.transformFromFirestore({ 
        id: updatedDoc.id, 
        ...updatedDoc.data() 
      });
      
      return {
        success: true,
        data: entity
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'update')
      };
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<APIResponse<void>> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'delete')
      };
    }
  }

  /**
   * Get all entities with optional filtering
   */
  async getAll(options: QueryOptions = {}): Promise<APIResponse<T[]>> {
    try {
      let q = query(this.getCollectionRef());

      // Apply filters
      if (options.where) {
        options.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      // Apply ordering
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          q = query(q, orderBy(order.field, order.direction));
        });
      }

      // Apply pagination
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      if (options.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const querySnap = await getDocs(q);
      const entities = querySnap.docs.map(doc => 
        this.transformFromFirestore({ id: doc.id, ...doc.data() })
      );
      
      return {
        success: true,
        data: entities,
        metadata: {
          total: entities.length,
          hasNext: querySnap.docs.length === (options.limit || 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'getAll')
      };
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    callback: (entities: T[]) => void,
    errorCallback: (error: APIError) => void,
    options: QueryOptions = {}
  ): () => void {
    try {
      let q = query(this.getCollectionRef());

      // Apply filters (same as getAll)
      if (options.where) {
        options.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      if (options.orderBy) {
        options.orderBy.forEach(order => {
          q = query(q, orderBy(order.field, order.direction));
        });
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      return onSnapshot(q, 
        (querySnap) => {
          const entities = querySnap.docs.map(doc => 
            this.transformFromFirestore({ id: doc.id, ...doc.data() })
          );
          callback(entities);
        },
        (error) => {
          errorCallback(this.handleError(error, 'subscribe'));
        }
      );
    } catch (error) {
      errorCallback(this.handleError(error, 'subscribe'));
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Batch operations
   */
  async batchUpdate(operations: BatchOperation<T>[]): Promise<APIResponse<void>> {
    try {
      const batch = writeBatch(db);

      operations.forEach(op => {
        const docRef = this.getDocRef(op.id);
        
        switch (op.type) {
          case 'create':
            const createData = this.transformToFirestore({
              ...op.data,
              createdAt: Timestamp.now().toDate(),
              updatedAt: Timestamp.now().toDate()
            });
            batch.set(docRef, createData);
            break;
            
          case 'update':
            const updateData = this.transformToFirestore({
              ...op.data,
              updatedAt: Timestamp.now().toDate()
            });
            batch.update(docRef, updateData);
            break;
            
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error, 'batchUpdate')
      };
    }
  }
}

// Query types
export interface QueryOptions {
  where?: WhereCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  startAfter?: any;
}

export interface WhereCondition {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in';
  value: any;
}

export interface OrderByCondition {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  id: string;
  data?: Partial<T>;
}

// Repository factory
export class RepositoryFactory {
  private static repositories = new Map<string, any>();

  static getRepository<T extends BaseEntity>(
    type: new (collectionName: string) => BaseRepository<T>,
    collectionName: string
  ): BaseRepository<T> {
    const key = `${type.name}-${collectionName}`;
    
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new type(collectionName));
    }
    
    return this.repositories.get(key);
  }
}