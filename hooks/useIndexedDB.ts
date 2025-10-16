/**
 * @file hooks/useIndexedDB.ts
 * @description A custom hook that provides a simplified, promise-based interface for interacting
 * with IndexedDB. It abstracts the complexity of IndexedDB's event-based API and is used to
 * persist the main application state across browser sessions.
 */

import { useCallback, useEffect, useState } from 'react';
import { DB_NAME } from '../constants';

const DB_VERSION = 1;
const STORE_NAME = 'appState';

/**
 * @hook useIndexedDB
 * @description Manages the connection to the IndexedDB database and provides memoized methods
 * for saving and loading the application state. It ensures the database is opened only once
 * and provides a readiness flag for consumers.
 * @returns {{ saveState: (state: any) => Promise<void>, loadState: () => Promise<any>, isReady: boolean }} An object containing:
 * - `saveState`: An async function to save the application state.
 * - `loadState`: An async function to load the application state.
 * - `isReady`: A boolean indicating if the database connection is successfully established.
 */
export const useIndexedDB = () => {
  const [db, setDB] = useState<IDBDatabase | null>(null);

  // Effect to open and initialize the IndexedDB connection on component mount.
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // This event is triggered only on first creation or when the DB_VERSION changes.
    // It's the only place where the database schema can be modified.
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        // Create the object store if it doesn't exist.
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    
    // On successful connection, store the database instance in state.
    request.onsuccess = (event) => {
      setDB((event.target as IDBOpenDBRequest).result);
    };
    
    // Log any connection errors.
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
  }, []); // Empty dependency array ensures this effect runs only once.

  /**
   * @function saveState
   * @description Saves the entire application state object to IndexedDB under a single, known key.
   * This function is wrapped in `useCallback` to ensure its reference is stable across re-renders.
   * @param {any} state - The application state object to save.
   * @returns {Promise<void>} A promise that resolves when the save operation is complete.
   */
  const saveState = useCallback(async (state: any) => {
    if (!db) return;
    
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      // IndexedDB requests are asynchronous. We wrap the `put` request in a promise to handle success/error cleanly.
      await new Promise<void>((resolve, reject) => {
        // We store the entire state object under a single key ('appState') for simplicity.
        const request = store.put({ key: 'appState', data: state });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to save to IndexedDB:', error);
    }
  }, [db]);

  /**
   * @function loadState
   * @description Loads the application state object from IndexedDB.
   * This function is wrapped in `useCallback` for reference stability.
   * @returns {Promise<any>} A promise that resolves with the saved state object, or `null` if no saved state is found.
   */
  const loadState = useCallback(async (): Promise<any> => {
    if (!db) return null;
    
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('appState');
      
      // Wrap the `get` request in a promise.
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => {
          console.error('Failed to load state from IndexedDB:', request.error);
          reject(request.error)
        };
      });
    } catch (error) {
      console.warn('Failed to load from IndexedDB:', error);
      return null;
    }
  }, [db]);

  // The hook returns the memoized functions and a boolean indicating if the DB is ready to be used.
  return { saveState, loadState, isReady: !!db };
};