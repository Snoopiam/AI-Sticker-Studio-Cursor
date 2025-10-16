/**
 * @file reducers/coreReducer.ts
 * @description A reducer that handles state changes for the core application logic,
 * such as application phase (landing/studio), mode (stickers/wallpapers), credits,
 * and the user-facing activity log. It also handles the initial state rehydration from storage.
 */

import { PresentAppState, Action, LogEntry, CreditTransaction } from '../types/types';
import { WALLPAPER_SIZES, BLENDING_MODES, LIGHTING_STYLES, QUALITY_LEVELS } from '../constants';

/** @description The maximum number of entries to keep in the user-facing activity log to prevent it from growing indefinitely. */
const MAX_LOG_ENTRIES = 100;

/**
 * Returns a partial state object to reset all loading flags.
 * This is used during state rehydration to ensure the app doesn't load into a stuck "loading" state.
 * @returns A partial state object with all loading flags set to false.
 */
const getResetLoadingState = () => ({
    isLoading: false,
    isCalibrating: false,
    isCreatingCharacter: false,
    isPreAnalyzing: false,
    loadingMessage: '',
});

/**
 * Manages the core slice of the application state.
 * @param {PresentAppState} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state.
 */
export const coreReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        case 'REHYDRATE_STATE':
            // Merges the saved state from storage, but resets any loading flags to prevent stuck states.
            return {
                ...state,
                ...action.payload,
                ...getResetLoadingState(),
                error: null, // Always clear errors on rehydration
            };

        case 'APPLY_SHARED_STATE':
            // Applies settings shared from another part of the app (e.g., from a loaded item).
            return {
                ...state,
                settings: { ...state.settings, ...action.payload.settings },
                wallpaperSettings: { ...state.wallpaperSettings, ...action.payload.wallpaperSettings },
            };

        case 'SET_APP_MODE':
            // Avoids unnecessary state changes if the mode is the same.
            if (state.appMode === action.payload) return state;
            // When switching modes, clear results and errors to provide a clean slate.
            return {
                ...state,
                appMode: action.payload,
                results: [],
                error: null,
            };

        case 'START_TRANSITION':
            return { ...state, appPhase: 'transitioning' };

        case 'FINISH_TRANSITION':
            return { ...state, appPhase: 'studio' };
        
        case 'CHANGE_CREDITS_BY': {
            const { amount, reason, metadata } = action.payload;
            const balanceBefore = state.credits;
            const balanceAfter = balanceBefore + amount;

            const newTransaction: CreditTransaction = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                type: amount < 0 ? 'deduction' : (reason.toLowerCase().includes('grant') ? 'grant' : 'refund'),
                amount,
                balanceBefore,
                balanceAfter,
                reason,
                metadata,
            };

            return {
                ...state,
                credits: balanceAfter,
                creditTransactions: [newTransaction, ...state.creditTransactions],
            };
        }

        case 'ADD_LOG_ENTRY': {
            const newEntry: LogEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                ...action.payload,
            };
            // Add the new entry to the top of the log and trim the log if it's too long.
            const newLog = [newEntry, ...state.activityLog];
            if (newLog.length > MAX_LOG_ENTRIES) {
                newLog.pop();
            }
            return { ...state, activityLog: newLog };
        }

        case 'CLEAR_LOG':
            return { ...state, activityLog: [] };
        
        case 'COMPLETE_ONBOARDING_FOR_MODE':
            return {
                ...state,
                onboardingCompleted: {
                    ...state.onboardingCompleted,
                    [action.payload]: true,
                },
            };
        
        case 'TOGGLE_SIMPLE_MODE':
            return { ...state, simpleMode: !state.simpleMode };

        default:
            return state;
    }
};