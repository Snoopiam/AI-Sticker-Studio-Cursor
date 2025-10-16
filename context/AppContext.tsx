/**
 * @file context/AppContext.tsx
 * @description This file sets up the main React Context for the application.
 * It defines the `AppContext` itself, a custom hook `useAppContext` for easy consumption,
 * and additional custom hooks for asynchronously retrieving images from the IndexedDB cache.
 * This centralization of context and related hooks simplifies state management across the app.
 */

import React, { createContext, useContext, Dispatch, useState, useEffect } from 'react';
import { AppState, Action } from '../types/types';
import { imageCache } from '../utils/services/imageCache';

// --- CONTEXT & HOOKS ---

/**
 * @const AppContext
 * @description The main React Context for the application. It provides the entire
 * application state (`state`) and the `dispatch` function to all consuming components.
 * This follows the standard `useReducer` with Context pattern for global state management.
 */
export const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

/**
 * @hook useAppContext
 * @description A custom hook that provides a convenient and safe way for components to access
 * the application state and dispatch function. It abstracts the `useContext` call and includes
 * a runtime check to ensure it's used within an `AppContext.Provider`, preventing common errors.
 * @returns {{ state: AppState; dispatch: Dispatch<Action> }} The global application state and dispatch function.
 * @throws Will throw an error if used outside of a component wrapped in `AppContext.Provider`.
 */
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

/**
 * @hook useCachedImage
 * @description A custom hook that asynchronously retrieves a single base64 image string from the
 * IndexedDB cache based on its ID. It manages its own loading state internally and returns the
 * data URL once it's available, simplifying image display in components.
 * @param {string | null} imageId - The ID of the image to retrieve from the cache. Can be `null`.
 * @returns {string | null} The base64 data URL of the image, or `null` if the ID is null, the image is not found, or it is still loading.
 */
export const useCachedImage = (imageId: string | null): string | null => {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (imageId) {
            // Asynchronously retrieve the image data from the cache service.
            imageCache.retrieve(imageId).then(dataUrl => {
                // Only update state if the component is still mounted to prevent memory leaks.
                if (isMounted && dataUrl) {
                    setSrc(dataUrl);
                }
            });
        } else {
            // If imageId is null, ensure the src is also null.
            setSrc(null);
        }
        // Cleanup function to prevent state updates on unmounted components.
        return () => { isMounted = false; };
    }, [imageId]);

    return src;
};

/**
 * @hook useBulkCachedImages
 * @description A performance-oriented hook that fetches multiple images from the IndexedDB cache
 * in parallel. This is crucial for rendering image grids (like the character library) efficiently,
 * as it avoids the "waterfall" effect of sequential `useCachedImage` calls.
 * @param {string[]} imageIds - An array of image IDs to retrieve.
 * @returns {{ images: Map<string, string | null>; isLoading: boolean; errors: Map<string, Error> }} An object containing:
 * - `images`: A map of image IDs to their data URLs.
 * - `isLoading`: A boolean indicating if the fetch operation is in progress.
 * - `errors`: A map of any errors that occurred during fetching for specific IDs.
 */
export const useBulkCachedImages = (imageIds: string[]): {
    images: Map<string, string | null>;
    isLoading: boolean;
    errors: Map<string, Error>;
  } => {
    const [images, setImages] = useState<Map<string, string | null>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Map<string, Error>>(new Map());
    
    // Use JSON.stringify to create a stable dependency for the useEffect hook.
    // This ensures the effect only re-runs when the content of the imageIds array changes,
    // not just its reference, which is important for performance.
    const idsDependency = JSON.stringify(imageIds);

    useEffect(() => {
      const uniqueImageIds = [...new Set(imageIds.filter(Boolean))];

      if (uniqueImageIds.length === 0) {
        setImages(new Map());
        setIsLoading(false);
        return;
      }

      let isMounted = true;
      const loadImages = async () => {
        setIsLoading(true);
        const newImages = new Map<string, string | null>();
        const newErrors = new Map<string, Error>();
        
        // Fetch all images in parallel using Promise.all for maximum performance.
        await Promise.all(
          uniqueImageIds.map(async (id) => {
            try {
              const dataUrl = await imageCache.retrieve(id);
              newImages.set(id, dataUrl);
            } catch (error) {
              newErrors.set(id, error as Error);
              newImages.set(id, null);
            }
          })
        );
        
        if (isMounted) {
            setImages(newImages);
            setErrors(newErrors);
            setIsLoading(false);
        }
      };

      loadImages();

      // Cleanup function to prevent state updates if the component unmounts during the async operation.
      return () => { isMounted = false; };
    }, [idsDependency]); // The effect depends on the stringified array content.

    return { images, isLoading, errors };
  };