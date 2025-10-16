/**
 * @file App.tsx
 * @description The root component of the AI Sticker Studio application.
 * It sets up the main state management using a persistent reducer with undo/redo capabilities,
 * provides the application state and dispatch function through context, and renders the main UI.
 */

import React, { Dispatch, Reducer, useEffect, useState, useCallback } from 'react';
import { AppState, PresentAppState, Action, LayoutMode, StickerAnalysis, AppMode, CalibrationStep } from './types/types';
import { rootReducer } from './reducers/rootReducer';
import { initialRemixState } from './reducers/uiReducer';
import { usePersistentReducer } from './hooks/usePersistentReducer';
import { addToHistory } from './utils/stateManager';
import { WALLPAPER_SIZES, BLENDING_MODES, LIGHTING_STYLES, QUALITY_LEVELS, CREDIT_COSTS, AUTO_CALIBRATION_DEBOUNCE_MS, DB_NAME, SESSION_STORAGE_KEY } from './constants';
import { DEV_LOG } from './utils/services/devLogger';
import { useGeneration } from './hooks/useGeneration';
import { useCalibration } from './hooks/useCalibration';
import { useImageUpload } from './hooks/useImageUpload';
import { useCharacterCreation } from './hooks/useCharacterCreation';
import { useRemix } from './hooks/useRemix';
import { useSessionManagement } from './hooks/useSessionManagement';
import { AppContext, useAppContext } from './context/AppContext';

// Import all UI components
import { Header } from './compliance/components/Header';
import { ControlPanel } from './compliance/components/ControlPanel';
import { StickerPreview } from './compliance/components/StickerPreview';
import { LandingPage } from './constants/LandingPage';
import { FeedbackBin } from './compliance/components/FeedbackBin';
import { CollectionModal } from './compliance/components/CollectionModal';
import { PostProcessingModal } from './compliance/components/PostProcessingModal';
import { ImageCropModal } from './compliance/components/ImageCropModal';
import { ImageViewerModal } from './compliance/components/ImageViewerModal';
import { ConfirmationDialog } from './compliance/components/ConfirmationDialog';
import { OnboardingTooltips } from './compliance/components/OnboardingTooltips';
import { CreditsModal } from './compliance/components/CreditsModal';
import { GroupPhotoSuccessDialog } from './compliance/components/GroupPhotoSuccessDialog';
import { TextInputModal } from './compliance/components/TextInputModal';
import { DevLogPanel } from './compliance/components/DevLogPanel';
import { ErrorBoundary } from './compliance/components/ErrorBoundary';
import { KillSwitchIndicator } from './compliance/components/KillSwitchIndicator';


// --- INITIAL STATE & REDUCER ---

/**
 * @function getInitialPresentState
 * @description Generates the initial present state of the application.
 * It starts with default values and attempts to load a "preserved state"
 * from sessionStorage, which is used to carry over essential data (like credits and character library)
 * after a user-initiated session restart.
 * @returns {PresentAppState} The initial state for the application logic.
 */
const getInitialPresentState = (): PresentAppState => {
    // Define the default state structure for a new session.
    const defaults: PresentAppState = {
        appPhase: 'landing',
        appMode: 'stickers',
        settings: {
            mode: 'image-to-image',
            outputFormat: 'static',
            subject: '',
            keyCharacteristics: '',
            clothing: '',
            negativePrompt: '',
            uploadedImageId: null,
            imageInputType: 'photograph',
            isGroupSticker: false,
            identityAnchorImageId: null,
            poseDescription: '',
            identityTemplate: undefined,
            style: 'Cartoon Vector',
            palette: 'Vibrant',
            lineStyle: 'Bold',
            shadingStyle: 'Cel-shading',
            resolution: 768,
            composition: 'Half-Body',
            addDieCutBorder: false,
            addSolidBackground: false,
            backgroundColor: '#ffffff',
            selectedExpressions: ['(Pose from image)'],
            speechBubbles: {},
            animationStyle: 'Subtle Movement',
            customAnimationPrompt: '',
            packSize: 4,
            animationSpeed: '1x',
            animationLoopStyle: 'infinite',
            animationEasing: 'linear',
        },
        isLoading: false,
        isCalibrating: false,
        isCreatingCharacter: false,
        loadingMessage: '',
        results: [],
        error: null,
        calibrationWarning: null,
        layoutMode: 'auto',
        feedbackBin: [],
        isCollectionOpen: false,
        editingResult: null,
        isEditingModalOpen: false,
        calibrationStep: 'idle',
        detectedSubjects: null,
        selectedSubjectId: null,
        validatedIdentityAnchorImageId: null,
        validatedIdentityTemplate: null,
        verificationImageId: null,
        credits: 1000,
        activityLog: [],
        creditTransactions: [],
        characterLibrary: [],
        wallpaperSettings: {
            selectedCharacterIds: [],
            customPrompt: '',
            selectedPresetId: null,
            size: WALLPAPER_SIZES[0],
            characterPosition: 'Center',
            characterSize: 50,
            backgroundIntensity: 80,
            blendingMode: BLENDING_MODES[0],
            lightingStyle: LIGHTING_STYLES[0],
            qualityLevel: QUALITY_LEVELS[0],
            useSmartContextAdaptation: false,
        },
        isCropModalOpen: false,
        imageToCrop: null,
        isPreAnalyzing: false,
        confirmationRequest: null,
        simpleMode: false,
        onboardingCompleted: { stickers: false, wallpapers: false, remix: false },
        isCreditsModalOpen: false,
        groupPhotoSuccessInfo: null,
        isDevLogOpen: false,
        devLog: [],
        isViewerOpen: false,
        viewerImages: [],
        viewerStartIndex: 0,
        remixState: initialRemixState,
        isTextInputModalOpen: false,
        textInputRequest: null,
        transferredCharacter: null,
        recentGenerations: [],
    };
    
    // Check for a preserved state in sessionStorage, used after a manual app restart.
    const preservedStateJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (preservedStateJSON) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY); // Clean up after use to prevent re-loading on refresh.
        try {
            const preservedState = JSON.parse(preservedStateJSON);
            // Handle migration from old boolean onboarding state to new object format
            if (typeof preservedState.onboardingCompleted === 'boolean') {
                preservedState.onboardingCompleted = { stickers: preservedState.onboardingCompleted, wallpapers: false, remix: false };
            }
            // On a restart, merge preserved state and go straight to the studio.
            return { ...defaults, ...preservedState, appPhase: 'studio' };
        } catch (e) {
            console.error("Failed to parse preserved state", e);
        }
    }
    return defaults;
};


// The complete initial state, including placeholder for undo/redo history.
const initialState: AppState = {
    ...getInitialPresentState(),
    past: [],
    future: [],
};

/**
 * @function persistentReducer
 * @description A higher-order reducer that wraps the main rootReducer to provide undo/redo functionality.
 * It intercepts 'UNDO' and 'REDO' actions to manage the history state. For all other actions,
 * it passes them to the rootReducer and records the state change in the history.
 * @param {AppState} state - The current full state, including past and future.
 * @param {Action} action - The dispatched action.
 * @returns {AppState} The new state after applying the action and updating history.
 */
const persistentReducer: Reducer<AppState, Action> = (state, action) => {
    // Destructure state into the "present" and the history arrays.
    const { past, future, ...present } = state;

    // Handle Undo action
    if (action.type === 'UNDO') {
        if (past.length === 0) return state; // Nothing to undo
        const previous = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);
        return { ...previous, past: newPast, future: [present, ...future] };
    }
    
    // Handle Redo action
    if (action.type === 'REDO') {
        if (future.length === 0) return state; // Nothing to redo
        const next = future[0];
        const newFuture = future.slice(1);
        return { ...next, past: [...past, present], future: newFuture };
    }

    // For any other action, pass it to the main rootReducer.
    const newPresent = rootReducer(present, action);

    // If the state hasn't changed, do nothing to avoid polluting history.
    if (present === newPresent) {
        return state;
    }
    
    // Define actions that should not create a new history entry (e.g., UI-only changes like opening modals).
    const nonHistoryActions = new Set(['SET_LOADING_MESSAGE', 'START_TRANSITION', 'FINISH_TRANSITION', 'OPEN_EDITING_MODAL', 'CLOSE_EDITING_MODAL', 'OPEN_CROP_MODAL', 'CLOSE_CROP_MODAL', 'REQUEST_CONFIRMATION', 'CANCEL_CONFIRMATION', 'OPEN_VIEWER', 'CLOSE_VIEWER', 'SET_REMIX_STATE', 'OPEN_TEXT_INPUT_MODAL', 'CLOSE_TEXT_INPUT_MODAL', 'CLEAR_TRANSFERRED_CHARACTER', 'OPEN_COLLECTION_MODAL', 'CLOSE_COLLECTION_MODAL']);
    if (nonHistoryActions.has(action.type)) {
        // For these actions, we update the present state but don't add the change to the undo history.
        return { ...state, ...newPresent };
    }

    // Add the previous state to the history and clear the future stack (since a new timeline has been created).
    const newPast = addToHistory(past, present);
    return { ...newPresent, past: newPast, future: [] };
};


/**
 * @component AppContent
 * @description This component renders the main application UI based on the current state.
 * It's designed to be a child of the AppContext.Provider, so it can safely consume all app-related hooks
 * and state. This component orchestrates the display of the landing page, the main studio layout, and all modals.
 * Separating it from the `App` component allows `App` to focus solely on context setup.
 */
const AppContent: React.FC = () => {
    // Consume state and dispatch from the context.
    const { state, dispatch } = useAppContext();
    const { past, future, ...present } = state; // Destructure present state for easier access in the component.
    const { appPhase, appMode, layoutMode, results, isLoading, loadingMessage, error, isEditingModalOpen, editingResult, isCropModalOpen, imageToCrop, confirmationRequest, onboardingCompleted, isCreditsModalOpen, groupPhotoSuccessInfo, isDevLogOpen, isViewerOpen, viewerImages, viewerStartIndex, isTextInputModalOpen, textInputRequest, isCollectionOpen } = present;

    // Initialize all custom hooks that provide core application logic.
    // These hooks encapsulate complex logic (like API calls and state transitions) and return a set of
    // memoized callbacks. This pattern keeps the UI components clean and focused on rendering.
    const generation = useGeneration();
    const calibration = useCalibration();
    const imageUpload = useImageUpload();
    const characterCreation = useCharacterCreation();
    const remix = useRemix();
    const sessionManagement = useSessionManagement();
    
    // This effect triggers the automatic calibration process. It's debounced to prevent race conditions
    // and multiple triggers from rapid state changes (e.g., after a quick crop and save).
    useEffect(() => {
        let mounted = true;
        let calibrationTimeout: ReturnType<typeof setTimeout> | null = null;
        
        // Only run if the state has explicitly triggered auto-calibration.
        if (state.calibrationStep === 'auto-calibrating' && calibration.autoCalibrate) {
            // Debounce the call to ensure it only runs once per user action burst.
            if (calibrationTimeout) {
                clearTimeout(calibrationTimeout);
            }
            
            calibrationTimeout = setTimeout(() => {
                if (mounted) {
                    calibration.autoCalibrate();
                    // Immediately transition state to prevent re-triggering from the same event.
                    dispatch({ type: 'SET_CALIBRATION_STEP', payload: 'calibrating' });
                }
            }, AUTO_CALIBRATION_DEBOUNCE_MS);
        }
        
        // Cleanup function to prevent memory leaks and state updates on unmounted components.
        return () => {
            mounted = false;
            if (calibrationTimeout) {
                clearTimeout(calibrationTimeout);
            }
        };
    }, [state.calibrationStep, calibration.autoCalibrate, dispatch]);


    /**
     * @callback handleConfirm
     * @description Handles the confirmation action from a dialog. It checks the action type
     * from the `confirmationRequest` state and calls the corresponding "execute" function
     * from the appropriate hook. This acts as a router for all confirmed, credit-consuming actions.
     */
    const handleConfirm = useCallback(() => {
        if (!confirmationRequest) return;
        
        const { actionType, context } = confirmationRequest;
        switch(actionType) {
            case 'generate-stickers': generation.executeStickerGeneration(); break;
            case 'generate-wallpaper': generation.executeWallpaperGeneration(); break;
            case 'calibrate': calibration.executeCalibration(); break;
            case 'create-character': characterCreation.executeCharacterCreation(context.base64Image, context.namePrefix); break;
            case 'generate-remix-single': remix.executeSingleSubjectRemix(); break;
            case 'generate-remix-group': remix.executeGroupPhotoRemix(context.subjects, context.cost); break;
            case 'delete-dev-log-entry':
                if (context?.id) {
                    dispatch({ type: 'DELETE_DEV_LOG_ENTRY', payload: context.id });
                }
                break;
        }
        // Always close the dialog after the action is initiated.
        dispatch({ type: 'CANCEL_CONFIRMATION' });
    }, [confirmationRequest, generation, calibration, characterCreation, remix, dispatch]);

    /**
     * @callback handleConfirmTextInput
     * @description Handles the confirmation of the generic text input modal. It routes the
     * user's input to the correct handler based on the `actionType` in the request.
     * @param {string} value - The text entered by the user.
     */
    const handleConfirmTextInput = useCallback((value: string) => {
        if (!textInputRequest) return;
        const { actionType, context } = textInputRequest;
        
        switch(actionType) {
            case 'name-character':
                characterCreation.finalizeCharacter(value, context.analysis, context.imageId);
                break;
            case 'name-sticker-character':
                characterCreation.finalizeStickerCharacter(value, context.analysis as StickerAnalysis, context.imageId);
                break;
            case 'add-speech-bubble': {
                const newBubbles = { ...state.settings.speechBubbles };
                if (value.trim() === '') delete newBubbles[context.expName];
                else newBubbles[context.expName] = value.trim();
                dispatch({ type: 'SET_SETTING', payload: { speechBubbles: newBubbles } });
                break;
            }
            case 'name-group-photo':
                characterCreation.confirmSaveGroupPhoto(value);
                break;
        }

        dispatch({ type: 'CLOSE_TEXT_INPUT_MODAL' });
    }, [textInputRequest, characterCreation, state.settings.speechBubbles, dispatch]);

    /**
     * @callback handleCancelTextInput
     * @description Handles the cancellation of the text input modal. It includes crucial logic
     * to ensure that any in-progress operations (like character creation) are properly terminated
     * and any charged credits are refunded, preventing the app from getting stuck in a loading state.
     */
    const handleCancelTextInput = useCallback(() => {
        if (!textInputRequest) return;
        const { actionType } = textInputRequest;

        // If the user cancels the naming step of character creation, we must finish the creation process
        // to reset the loading state and refund any credits that were charged. This is a critical resilience step.
        if (actionType === 'name-character' || actionType === 'name-sticker-character') {
            dispatch({ type: 'FINISH_CHARACTER_CREATION' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Character creation cancelled.' } });
            
            // Only refund credits for the paid 'photo to character' flow, not the free sticker import.
            if (actionType === 'name-character') {
                dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: CREDIT_COSTS.CHARACTER_CREATION, reason: 'Cancelled character creation refund' } });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${CREDIT_COSTS.CHARACTER_CREATION} credits.` } });
            }
        }

        dispatch({ type: 'CLOSE_TEXT_INPUT_MODAL' });
    }, [textInputRequest, dispatch]);

    /**
     * @callback handleImageClick
     * @description Opens the global image viewer modal, starting from a specific image index in the results grid.
     * @param {number} startIndex - The index of the result to display first.
     */
    const handleImageClick = (startIndex: number) => {
        dispatch({ type: 'OPEN_VIEWER', payload: { images: results, startIndex } });
    };

    // Maps layout mode names from the state to their corresponding CSS grid classes.
    const layoutClasses: Record<LayoutMode, string> = {
        auto: 'layout-auto',
        'side-by-side': 'layout-side-by-side',
        stacked: 'layout-stacked',
        'dual-pane': 'layout-dual-pane',
    };

    // If the app is not in the 'studio' phase, render the landing page instead of the main UI.
    if (appPhase !== 'studio') {
        return <LandingPage />;
    }

    // Render the main studio UI.
    return (
        <div className="bg-gray-900 text-white h-screen flex flex-col font-sans">
            {/* The onboarding tooltips are conditionally rendered if the user hasn't completed them for the current mode. */}
            {appPhase === 'studio' && !(onboardingCompleted[appMode]) && <OnboardingTooltips appMode={appMode} />}
            <Header sessionManagement={sessionManagement} />
            <KillSwitchIndicator />
            <main className={`flex-grow p-2 sm:p-4 grid gap-4 ${layoutClasses[layoutMode]} min-h-0`}>
                <ControlPanel
                    appMode={present.appMode} 
                    generation={generation}
                    calibration={calibration}
                    characterCreation={characterCreation}
                    imageUpload={imageUpload}
                    remix={remix}
                    feedbackBin={present.feedbackBin}
                    recentGenerations={present.recentGenerations}
                />
                <StickerPreview 
                    results={results}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    error={error}
                    onClearError={() => dispatch({ type: 'CLEAR_ERROR' })}
                    characterCreation={characterCreation}
                    onImageClick={handleImageClick}
                />
            </main>
            {/* Render all potential modals and dialogs. Their visibility is controlled by their respective state flags. */}
            <FeedbackBin />
            {isCollectionOpen && <CollectionModal isOpen={isCollectionOpen} onClose={() => dispatch({ type: 'CLOSE_COLLECTION_MODAL' })} />}
            {isEditingModalOpen && editingResult && (
                <PostProcessingModal 
                    isOpen={isEditingModalOpen}
                    onClose={() => dispatch({ type: 'CLOSE_EDITING_MODAL' })}
                    result={editingResult}
                />
            )}
             {isCropModalOpen && imageToCrop && (
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    onClose={() => dispatch({ type: 'CLOSE_CROP_MODAL' })}
                    imageId={imageToCrop.id}
                    subjects={imageToCrop.subjects}
                    onCropComplete={imageUpload.cropComplete}
                />
            )}
             {isViewerOpen && (
                <ImageViewerModal
                    isOpen={isViewerOpen}
                    onClose={() => dispatch({ type: 'CLOSE_VIEWER' })}
                    images={viewerImages}
                    startIndex={viewerStartIndex}
                />
            )}
             {confirmationRequest && (
                <ConfirmationDialog 
                    onConfirm={handleConfirm}
                    onCancel={() => dispatch({ type: 'CANCEL_CONFIRMATION' })}
                />
            )}
            {isTextInputModalOpen && textInputRequest && (
                 <TextInputModal 
                    isOpen={isTextInputModalOpen}
                    request={textInputRequest}
                    onConfirm={handleConfirmTextInput}
                    onCancel={handleCancelTextInput}
                />
            )}
            {isCreditsModalOpen && (
                <CreditsModal isOpen={isCreditsModalOpen} onClose={() => dispatch({ type: 'CLOSE_CREDITS_MODAL' })} />
            )}
            {groupPhotoSuccessInfo && <GroupPhotoSuccessDialog />}
            {isDevLogOpen && <DevLogPanel onClose={() => dispatch({ type: 'CLOSE_DEV_LOG' })} />}
        </div>
    );
};


/**
 * @component App
 * @description The root-level component that initializes the state management
 * and provides the application context to all its children. This component's primary role
 * is to set up the global state and side effects like keyboard shortcuts.
 */
const App: React.FC = () => {
    // Initialize the persistent reducer. This hook manages loading state from IndexedDB
    // on startup and saving it on every change.
    const [state, dispatch] = usePersistentReducer(persistentReducer, initialState);

    // Load the static development log into the state once on application startup.
    useEffect(() => {
        dispatch({ type: 'LOAD_DEV_LOG', payload: DEV_LOG });
    }, [dispatch]);

    // Set up global keyboard shortcuts for undo (Ctrl/Cmd+Z) and redo (Ctrl/Cmd+Shift+Z).
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);
    
    // Provide the global state and dispatch function to the entire component tree via context.
    // The ErrorBoundary catches any rendering errors in its children and displays a fallback UI.
    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <ErrorBoundary>
                <AppContent />
            </ErrorBoundary>
        </AppContext.Provider>
    );
};

export default App;