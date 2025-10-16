/**
 * @file services/imageCache.ts
 * @description A simple client-side caching service using IndexedDB to store and retrieve
 * base64 image data. This is used for persisting uploaded images, calibration results,
 * and character portraits across sessions.
 */
import { compressImage } from '../imageCompression';

const DB_NAME = 'aiStickerImageCache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB total
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
    id: string;
    data: string;
    size: number;
    timestamp: number;
}

/** A singleton instance of the IndexedDB database connection. */
let db: IDBDatabase | null = null;

/**
 * Opens and initializes the IndexedDB database.
 * This function ensures that only one database connection is opened and reused.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // If the connection is already open, resolve immediately.
    if (db) {
      return resolve(db);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    // This event is triggered only on first creation or version change.
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject('IndexedDB error');
    };
  });
};

/**
 * @namespace imageCache
 * @description An object containing methods to interact with the image cache.
 */
export const imageCache = {
  /**
   * Stores an image in the IndexedDB cache.
   * @param {string} id - A unique ID to use as the key for the image.
   * @param {string} dataUrl - The base64 data URL of the image to store.
   * @param {boolean} [shouldCompress=false] - Whether to compress the image before storing.
   * @returns {Promise<void>} A promise that resolves when the image is successfully stored.
   */
  store: async (id: string, dataUrl: string, shouldCompress: boolean = false): Promise<void> => {
    const db = await openDB();
    
    // Calculate image size
    const size = Math.ceil((dataUrl.length * 3) / 4);
    
    // Check size limit
    if (size > MAX_IMAGE_SIZE) {
        console.warn(`Image ${id} exceeds size limit (${(size / 1024 / 1024).toFixed(2)}MB), forcing compression`);
        shouldCompress = true;
    }
    
    let finalDataUrl = dataUrl;
    if (shouldCompress) {
        try {
            finalDataUrl = await compressImage(dataUrl, 1024, 0.85);
        } catch (error) {
            console.warn('Image compression failed, storing original:', error);
            finalDataUrl = dataUrl;
        }
    }
    
    // Clean up old entries
    await imageCache.cleanup();
    
    const entry: CacheEntry = {
        id,
        data: finalDataUrl,
        size: Math.ceil((finalDataUrl.length * 3) / 4),
        timestamp: Date.now()
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = (e) => {
            console.error('Failed to store image in cache:', e);
            reject(request.error);
        };
    });
  },

  /**
   * Retrieves an image from the IndexedDB cache.
   * @param {string | null} id - The ID of the image to retrieve.
   * @returns {Promise<string | null>} A promise that resolves with the base64 data URL of the image, or null if not found.
   */
  retrieve: async (id: string | null): Promise<string | null> => {
    if (!id) return null;
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = (e) => {
        console.error('Failed to retrieve image from cache:', e);
        reject(request.error);
      }
    });
  },

  cleanup: async (): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const allEntries = await new Promise<CacheEntry[]>((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
    });
    
    const now = Date.now();
    let totalSize = 0;
    const sortedEntries = allEntries
        .filter(entry => entry.timestamp) // Ensure timestamp exists
        .sort((a, b) => b.timestamp - a.timestamp);
    
    for (const entry of sortedEntries) {
        // Remove expired entries
        if (now - entry.timestamp > CACHE_EXPIRY_MS) {
            await new Promise((resolve) => {
                const request = store.delete(entry.id);
                request.onsuccess = () => resolve(undefined);
            });
            continue;
        }
        
        totalSize += entry.size || 0;
        
        // Remove oldest entries if cache is too large
        if (totalSize > MAX_CACHE_SIZE) {
            await new Promise((resolve) => {
                const request = store.delete(entry.id);
                request.onsuccess = () => resolve(undefined);
            });
        }
    }
  },
};