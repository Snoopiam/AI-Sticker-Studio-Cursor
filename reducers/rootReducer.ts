/**
 * @file reducers/rootReducer.ts
 * @description The main root reducer for the application. It composes all the individual
 * state slice reducers into a single reducer function.
 */

import { PresentAppState, Action } from '../types/types';
import { coreReducer } from './coreReducer';
import { settingsReducer } from './settingsReducer';
import { generationReducer } from './generationReducer';
import { calibrationReducer } from './calibrationReducer';
import { characterReducer } from './characterReducer';
import { uiReducer } from './uiReducer';
import { devLogReducer } from './devLogReducer';

/**
 * The root reducer function that orchestrates all other reducers.
 * For any given action, it passes the state and action through each individual reducer in sequence.
 * This pattern allows for a separation of concerns, where each reducer is responsible for managing
 * a specific slice of the application's state.
 * @param {PresentAppState} state - The current state of the application (without history).
 * @param {Action} action - The action being dispatched.
 * @returns {PresentAppState} The new state after applying the action.
 */
export const rootReducer = (state: PresentAppState, action: Action): PresentAppState => {
    // Chain reducers together. Each reducer receives the state from the previous one.
    // This allows for a clean separation of concerns while maintaining a flat state structure.
    let newState = state;
    newState = coreReducer(newState, action);
    newState = settingsReducer(newState, action);
    newState = generationReducer(newState, action);
    newState = calibrationReducer(newState, action);
    newState = characterReducer(newState, action);
    newState = uiReducer(newState, action);
    newState = devLogReducer(newState, action);
    return newState;
};