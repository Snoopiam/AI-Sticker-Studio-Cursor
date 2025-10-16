/**
 * @file reducers/uiReducer.ts
 * @description A reducer that handles all state changes for UI-specific concerns, such as
 * modal visibility, layout modes, the feedback bin, and the photo remix workflow state.
 */

import { PresentAppState, Action, RemixState } from '../types/types';

/**
 * A constant representing the initial state for the Photo Remix feature.
 * This is used both for initializing the app and for resetting the feature's state.
 */
export const initialRemixState: RemixState = {
    originalImage: null,
    cutoutImage: null,
    remixedCutoutImage: null,
    generatedBackground: null,
    finalImage: null,
    sceneSuggestions: null,
    backgroundPrompt: '',
    foregroundPrompt: '',
    isGroupPhoto: false,
    detectedSubjects: null,
};


/**
 * Manages the UI-related state of the application.
 * @param {PresentAppState} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state.
 */
export const uiReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        case 'SET_LAYOUT_MODE':
            return { ...state, layoutMode: action.payload };
        case 'ADD_RESULTS_TO_COLLECTION':
            // Prepend new results to the feedbackBin, making it a reverse-chronological log.
            // Filter out any potential duplicates just in case.
            const newItems = action.payload.filter(
                newItem => !state.feedbackBin.some(existingItem => existingItem.id === newItem.id)
            );
            return { ...state, feedbackBin: [...newItems, ...state.feedbackBin] };
        case 'REMOVE_FROM_FEEDBACK_BIN':
            return { ...state, feedbackBin: state.feedbackBin.filter(item => item.id !== action.payload) };
        case 'CLEAR_FEEDBACK_BIN':
            return { ...state, feedbackBin: [] };
        case 'OPEN_COLLECTION_MODAL':
            return { ...state, isCollectionOpen: true };
        case 'CLOSE_COLLECTION_MODAL':
            return { ...state, isCollectionOpen: false };
        case 'OPEN_EDITING_MODAL':
            return { ...state, isEditingModalOpen: true, editingResult: action.payload };
        case 'CLOSE_EDITING_MODAL':
            return { ...state, isEditingModalOpen: false, editingResult: null };
        case 'UPDATE_EDITING_RESULT': {
            if (!state.editingResult) return state;
            const newResults = state.results.map(r => r.id === state.editingResult!.id ? action.payload : r);
            const newFeedbackBin = state.feedbackBin.map(r => r.id === state.editingResult!.id ? action.payload : r);
            return { ...state, results: newResults, feedbackBin: newFeedbackBin, editingResult: action.payload };
        }
        case 'OPEN_CROP_MODAL':
            return { ...state, isPreAnalyzing: false, isCropModalOpen: true, imageToCrop: action.payload };
        case 'CLOSE_CROP_MODAL':
            return { ...state, isCropModalOpen: false, imageToCrop: null, isPreAnalyzing: false };
        case 'REQUEST_CONFIRMATION':
            return { ...state, confirmationRequest: action.payload };
        case 'CANCEL_CONFIRMATION':
            return { ...state, confirmationRequest: null };
        case 'OPEN_CREDITS_MODAL':
            return { ...state, isCreditsModalOpen: true };
        case 'CLOSE_CREDITS_MODAL':
            return { ...state, isCreditsModalOpen: false };
        case 'SHOW_GROUP_PHOTO_SUCCESS':
            return { ...state, groupPhotoSuccessInfo: action.payload };
        case 'HIDE_GROUP_PHOTO_SUCCESS':
            return { ...state, groupPhotoSuccessInfo: null };
        case 'OPEN_TEXT_INPUT_MODAL':
            return { ...state, isTextInputModalOpen: true, textInputRequest: action.payload };
        case 'CLOSE_TEXT_INPUT_MODAL':
            return { ...state, isTextInputModalOpen: false, textInputRequest: null };
        case 'OPEN_VIEWER':
            return { ...state, isViewerOpen: true, viewerImages: action.payload.images, viewerStartIndex: action.payload.startIndex };
        case 'CLOSE_VIEWER':
            return { ...state, isViewerOpen: false, viewerImages: [], viewerStartIndex: 0 };
        case 'SET_REMIX_STATE':
            return { ...state, remixState: { ...state.remixState, ...action.payload } };
        case 'CLEAR_REMIX_STATE':
            return {
                ...state,
                remixState: initialRemixState,
                results: state.appMode === 'remix' ? [] : state.results, // Clear results only if in remix mode
            };
        case 'TRANSFER_CHARACTER_TO_WALLPAPER':
            return { ...state, transferredCharacter: action.payload, appMode: 'wallpapers' };
        case 'CLEAR_TRANSFERRED_CHARACTER':
            return { ...state, transferredCharacter: null };
        case 'ADD_TO_RECENT_GENERATIONS': {
            // Prevent duplicates by removing the item if it already exists, then add it to the front.
            const newHistory = [action.payload, ...state.recentGenerations.filter(item => item.id !== action.payload.id)];
            return {
                ...state,
                recentGenerations: newHistory.slice(0, 10)
            };
        }
        default:
            return state;
    }
};