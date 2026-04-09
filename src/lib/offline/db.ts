// src/lib/offline/db.ts

/**
 * Base IndexedDB locale : cours, exercices, queue de sync.
 *
 * Utilise la bibliothèque `idb` pour un accès typé à IndexedDB.
 * Stocke les 20 derniers cours consultés, les exercices en cours,
 * et la file d'attente de synchronisation pour le mode offline.
 */

import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

/** Schéma de la base IndexedDB locale */
export interface DjeliDBSchema extends DBSchema {
  /** Cours téléchargés pour consultation offline */
  courses: {
    key: string;
    value: {
      id: string;
      subject: string;
      topic: string;
      title: string;
      content: string;
      level: string;
      cachedAt: number;
    };
    indexes: {
      'by-subject': string;
      'by-cached-at': number;
    };
  };
  /** Exercices en cours ou récents */
  exercises: {
    key: string;
    value: {
      id: string;
      contentId: string;
      type: string;
      data: Record<string, unknown>;
      cachedAt: number;
    };
    indexes: {
      'by-content-id': string;
    };
  };
  /** File d'attente de synchronisation des réponses offline */
  syncQueue: {
    key: number;
    value: {
      id?: number;
      endpoint: string;
      method: string;
      body: string;
      createdAt: number;
      retries: number;
    };
    indexes: {
      'by-created-at': number;
    };
  };
}

const DB_NAME = 'djeli-offline';
const DB_VERSION = 1;

/**
 * Ouvre (ou crée) la base IndexedDB locale.
 */
export async function getDB(): Promise<IDBPDatabase<DjeliDBSchema>> {
  return openDB<DjeliDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store des cours offline
      const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
      courseStore.createIndex('by-subject', 'subject');
      courseStore.createIndex('by-cached-at', 'cachedAt');

      // Store des exercices
      const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
      exerciseStore.createIndex('by-content-id', 'contentId');

      // File de synchronisation
      const syncStore = db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      syncStore.createIndex('by-created-at', 'createdAt');
    },
  });
}
