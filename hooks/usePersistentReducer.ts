/**
 * @file hooks/usePersistentReducer.ts
 * @description A custom hook that combines React's `useReducer` with an IndexedDB persistence layer.
 * It automatically saves the application state to IndexedDB on every state change and "rehydrates"
 * the state from storage when the application first loads, providing seamless session persistence.
 */

import { useReducer, useEffect, Reducer, Dispatch } from 'react';
import { useIndexedDB } from './useIndexedDB';
import { Action, AppState } from '../types/types';

/**
 * @hook usePersistentReducer
 * @description Creates a state management system with `useReducer` that persists its state to IndexedDB.
 * This hook is a drop-in replacement for `React.useReducer` but with added persistence capabilities.
 * @param {Reducer<AppState, Action>} reducer - The reducer function to manage state transitions.
 * @param {AppState} initialState - The initial state of the application, used only if no saved state is found in IndexedDB.
 * @returns {[AppState, Dispatch<Action>]} A tuple containing the current state and the dispatch function, identical to the return value of `useReducer`.
 */
export const usePersistentReducer = (
  reducer: Reducer<AppState, Action>,
  initialState: AppState
): [AppState, Dispatch<Action>] => {
  // Initialize the standard React reducer.
  const [state, dispatch] = useReducer(reducer, initialState);
  // Get the save/load functions and readiness state from the IndexedDB hook.
  const { saveState, loadState, isReady } = useIndexedDB();

  // Effect to load (rehydrate) state from IndexedDB. This runs only once when the database connection is ready.
  useEffect(() => {
    if (!isReady) return;
    
    const loadInitialState = async () => {
      try {
        const savedState = await loadState();
        if (savedState) {
          // If a saved state exists in IndexedDB, dispatch a special 'REHYDRATE_STATE' action
          // to merge it into the current application state.
          dispatch({ type: 'REHYDRATE_STATE', payload: savedState });
        }
      } catch (error) {
        console.error("Error loading state from IndexedDB", error);
      }
    };
    
    loadInitialState();
  }, [isReady]); // Dependency array ensures this effect runs only when `isReady` becomes true.

  // Effect to save the state to IndexedDB whenever the state object changes.
  useEffect(() => {
    if (!isReady) return;
    // An important guard: don't save the initial default state until it's been hydrated or changed by the user.
    // This prevents a race condition where the default initial state could overwrite a valid saved state on app load.
    if (state === initialState) return;
    
    // Call the saveState function from the useIndexedDB hook.
    saveState(state);
  }, [state, saveState, isReady, initialState]); // This effect runs whenever the state or other dependencies change.

  return [state, dispatch];
};