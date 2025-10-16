/**
 * @file reducers/devLogReducer.ts
 * @description A reducer that handles all state changes related to the development log panel.
 */

import { PresentAppState, Action } from '../types/types';

/**
 * Manages the state for the development log feature.
 * @param {PresentAppState} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state.
 */
export const devLogReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        // Loads the static development log data into the application state.
        case 'LOAD_DEV_LOG':
            return { ...state, devLog: action.payload };
        
        // Opens the development log panel.
        case 'OPEN_DEV_LOG':
            return { ...state, isDevLogOpen: true };
        
        // Closes the development log panel.
        case 'CLOSE_DEV_LOG':
            return { ...state, isDevLogOpen: false };

        // Deletes a specific log entry from the state.
        case 'DELETE_DEV_LOG_ENTRY':
            return {
                ...state,
                devLog: state.devLog.filter(entry => entry.id !== action.payload),
            };
            
        default:
            return state;
    }
};