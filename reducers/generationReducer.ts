/**
 * @file reducers/generationReducer.ts
 * @description A reducer that handles all state changes related to the status of asynchronous
 * generation tasks, including loading states, error handling, and storing results.
 */

import { PresentAppState, Action } from '../types/types';

/**
 * A pure helper function to format raw API error messages into more user-friendly strings.
 * @param {string} payload - The raw error message from a catch block.
 * @returns {string} The formatted, user-friendly error message.
 */
const formatErrorMessage = (payload: string): string => {
    let errorMessage = payload;
    if (errorMessage && errorMessage.includes('Internal error encountered.')) {
        errorMessage = 'The AI service reported a temporary internal error. Please wait a moment and try again. Your credits for this attempt have been refunded.';
    } else if (errorMessage && (errorMessage.includes('exceeded your current quota') || errorMessage.includes('RESOURCE_EXHAUSTED'))) {
        errorMessage = 'The service is currently experiencing high traffic (Quota Exceeded). Please try again in a few moments. Your credits for this attempt have been refunded.';
    }
    return errorMessage;
};

/**
 * Manages the generation-related state of the application.
 * @param {PresentAppState} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state.
 */
export const generationReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        case 'START_GENERATION':
            return { ...state, isLoading: true, loadingMessage: action.payload, error: null, results: [] };
        case 'START_CALIBRATION':
            return { ...state, isCalibrating: true, calibrationStep: action.payload.step, loadingMessage: action.payload.message, error: null, calibrationWarning: null };
        case 'START_CHARACTER_CREATION':
            return { ...state, isCreatingCharacter: true, error: null };
        case 'START_WALLPAPER_GENERATION':
            return { ...state, isLoading: true, loadingMessage: action.payload, error: null, results: [] };
        case 'START_PRE_ANALYSIS':
            return { ...state, isPreAnalyzing: true };

        case 'GENERATION_COMPLETE':
            return { ...state, isLoading: false, results: action.payload };
        case 'ADD_RESULT':
            return { ...state, results: [...state.results, action.payload] };
        case 'FINISH_GENERATION':
            return { ...state, isLoading: false };
        case 'FINISH_CHARACTER_CREATION':
            return { ...state, isCreatingCharacter: false };
        
        case 'SET_LOADING_MESSAGE':
            return { ...state, loadingMessage: action.payload };
        case 'CLEAR_RESULTS':
            return { ...state, results: [] };

        case 'GENERATION_ERROR': {
            return { 
                ...state, 
                isLoading: false, 
                isCalibrating: false, 
                isCreatingCharacter: false, 
                isPreAnalyzing: false, 
                isCropModalOpen: false, 
                error: formatErrorMessage(action.payload), 
                calibrationStep: 'idle' 
            };
        }
        case 'CLEAR_ERROR':
            return { ...state, error: null };
            
        default:
            return state;
    }
};