/**
 * @file hooks/useSessionManagement.ts
 * @description This hook encapsulates all logic related to managing the application session,
 * primarily the restart functionality. This feature allows users to start a "fresh" session
 * by clearing most of their data, while intelligently preserving essential items like their
 * credits and character library.
 */

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { DB_NAME, SESSION_STORAGE_KEY } from '../constants';

/**
 * @hook useSessionManagement
 * @description Provides memoized functions to manage the application session.
 * @returns {object} An object containing session management functions, currently just `restartSession`.
 */
export const useSessionManagement = () => {
    const { state } = useAppContext();

    /**
     * @function restartSession
     * @description Handles the entire restart session workflow. It first confirms the action with the user.
     * Then, it serializes and preserves essential parts of the state (like credits, characters, and onboarding status)
     * into `sessionStorage`. Finally, it deletes the main IndexedDB database (which stores the full app state)
     * and reloads the page. On reload, the `getInitialPresentState` function will detect and apply the
     * preserved state from `sessionStorage`, creating a clean session that retains key user data.
     */
    const restartSession = useCallback(() => {
        if (confirm('Are you sure you want to restart? This will clear all settings, results, and calibration data. Your character library and credits will be preserved.')) {
            // 1. Identify and package the essential state that should survive a reset.
            const stateToPreserve = {
                onboardingCompleted: state.onboardingCompleted,
                credits: state.credits,
                characterLibrary: state.characterLibrary,
                devLog: state.devLog, // Preserving dev log for continuity.
            };
            // 2. Store this preserved state in sessionStorage, which survives a page reload but not closing the tab.
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToPreserve));

            // 3. Clear the main persistent storage (the full application state) by deleting the IndexedDB database.
            indexedDB.deleteDatabase(DB_NAME);
            
            // NOTE: We do not clear the 'aiStickerImageCache' database. The character library relies on
            // image IDs stored in this cache. Resetting the main state will remove references to any other
            // images (like uploads or results), effectively orphaning them. This is acceptable as they
            // are no longer needed and will be cleaned up by the cache's own expiry logic.

            // 4. Reload the page to force a clean start from the initial state logic, which will now find the preserved data.
            window.location.reload();
        }
    }, [state.onboardingCompleted, state.credits, state.characterLibrary, state.devLog]);

    return { restartSession };
};