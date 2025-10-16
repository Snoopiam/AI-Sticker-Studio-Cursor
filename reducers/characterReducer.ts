/**
 * @file reducers/characterReducer.ts
 * @description A reducer that handles all state changes for the user's character library,
 * including adding, updating, and removing characters. This keeps the character-related logic
 * isolated and easy to manage.
 */

import { PresentAppState, Action } from '../types/types';

/**
 * @function characterReducer
 * @description Manages the `characterLibrary` slice of the application state. It responds to actions
 * for adding, updating, and removing characters.
 * @param {PresentAppState} state - The current state before the action.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state after applying the action.
 */
export const characterReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        // Adds a new character to the beginning of the library array.
        case 'ADD_CHARACTER':
            // A simple guard to prevent adding a duplicate character if an entry with the same source image ID already exists.
            if (state.characterLibrary.some(c => c.imageId === action.payload.imageId)) {
                return state;
            }
            return { ...state, characterLibrary: [action.payload, ...state.characterLibrary] };

        // Updates an existing character in the library by mapping over the array and replacing the matching character.
        case 'UPDATE_CHARACTER':
            return { 
                ...state, 
                characterLibrary: state.characterLibrary.map(c => 
                    c.id === action.payload.id ? action.payload : c
                ) 
            };

        // Removes a character from the library by filtering the array.
        case 'REMOVE_CHARACTER':
            return { 
                ...state, 
                characterLibrary: state.characterLibrary.filter(c => c.id !== action.payload) 
            };
            
        default:
            // For any other action, return the state unchanged.
            return state;
    }
};