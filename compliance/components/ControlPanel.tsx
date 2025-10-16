/**
 * @file ControlPanel.tsx
 * @description A container component that dynamically renders either the sticker creation workflow,
 * the wallpaper creation workflow, or the photo remix workflow based on the current application mode.
 * It also renders the main navigation tabs to switch between these studios.
 */

import React, { Suspense, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { StickerStudioWorkflow } from './StickerStudioWorkflow';
import { GeneratedResult, AppMode } from '../../types/types';
import { useGeneration } from '../../hooks/useGeneration';
import { useCalibration } from '../../hooks/useCalibration';
import { useCharacterCreation } from '../../hooks/useCharacterCreation';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useRemix } from '../../hooks/useRemix';

// Lazy load complex workflows for better initial page load performance (code splitting).
// This means the code for these components won't be downloaded until they are actually needed.
const WallpaperStudioWorkflow = React.lazy(() => import('./WallpaperStudioWorkflow'));
const PhotoRemixWorkflow = React.lazy(() => import('./PhotoRemixWorkflow'));


/**
 * @interface ControlPanelProps
 * @description Defines the props for the ControlPanel. Instead of individual callbacks, it now
 * accepts the entire objects returned by the core application hooks, reducing prop drilling
 * and keeping related logic grouped together.
 */
export interface ControlPanelProps {
    appMode: AppMode;
    generation: ReturnType<typeof useGeneration>;
    calibration: ReturnType<typeof useCalibration>;
    characterCreation: ReturnType<typeof useCharacterCreation>;
    imageUpload: ReturnType<typeof useImageUpload>;
    remix: ReturnType<typeof useRemix>;
    feedbackBin: GeneratedResult[];
    recentGenerations: GeneratedResult[];
}

/**
 * @component LoadingFallback
 * @description A simple fallback component to display while a lazy-loaded
 * component (like a workflow) is being loaded.
 */
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading Studio...</p>
    </div>
);


/**
 * @component TabButton
 * @description A reusable button component for the main studio navigation tabs.
 * @param {object} props - Component props.
 * @param {AppMode} props.mode - The app mode this button represents.
 * @param {string} props.label - The text label for the button.
 * @param {AppMode} props.currentMode - The currently active app mode.
 * @param {(mode: AppMode) => void} props.setMode - Callback to set the new app mode.
 */
const TabButton: React.FC<{
    mode: AppMode;
    label: string;
    currentMode: AppMode;
    setMode: (mode: AppMode) => void;
}> = ({ mode, label, currentMode, setMode }) => (
    <button
        onClick={() => setMode(mode)}
        className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors focus:outline-none flex items-center justify-center gap-2 ${
            currentMode === mode
                ? 'text-white border-b-2 border-purple-500 bg-purple-500/10'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
        aria-current={currentMode === mode ? 'page' : undefined}
    >
        {label}
    </button>
);


/**
 * @component ControlPanelComponent
 * @description The main control panel component. It uses the `appMode` from props
 * to decide which workflow component to render. It passes down relevant state slices
 * to enable memoization in child components.
 * @param {ControlPanelProps} props - The props containing all necessary action handlers from the core hooks.
 */
const ControlPanelComponent: React.FC<ControlPanelProps> = (props) => {
    const { state, dispatch } = useAppContext();
    const { appMode, generation, calibration, characterCreation, imageUpload, remix, feedbackBin, recentGenerations } = props;

    /**
     * @callback setMode
     * @description Dispatches an action to change the application's primary mode.
     * @param {AppMode} mode - The new mode to switch to.
     */
    const setMode = useCallback((mode: AppMode) => {
        dispatch({ type: 'SET_APP_MODE', payload: mode });
    }, [dispatch]);


    /**
     * @function renderWorkflow
     * @description A helper function that returns the correct workflow component based on the current `appMode`.
     * This keeps the main return statement clean and readable.
     * @returns {React.ReactNode} The component for the active workflow.
     */
    const renderWorkflow = () => {
        switch (appMode) {
            case 'stickers':
                return (
                    <StickerStudioWorkflow 
                        generation={generation}
                        calibration={calibration}
                        characterCreation={characterCreation}
                        imageUpload={imageUpload}
                        // State slices passed as props for memoization
                        settings={state.settings}
                        isLoading={state.isLoading}
                        isCalibrating={state.isCalibrating}
                        isPreAnalyzing={state.isPreAnalyzing}
                        calibrationStep={state.calibrationStep}
                        calibrationWarning={state.calibrationWarning}
                        validatedIdentityAnchorImageId={state.validatedIdentityAnchorImageId}
                        verificationImageId={state.verificationImageId}
                        credits={state.credits}
                        simpleMode={state.simpleMode}
                    /> 
                );
            case 'wallpapers':
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <WallpaperStudioWorkflow 
                            generation={generation} 
                            characterCreation={characterCreation} 
                            feedbackBin={feedbackBin}
                            // State slices passed as props for memoization
                            characterLibrary={state.characterLibrary}
                            wallpaperSettings={state.wallpaperSettings}
                            isLoading={state.isLoading}
                            credits={state.credits}
                            isCreatingCharacter={state.isCreatingCharacter}
                            simpleMode={state.simpleMode}
                            transferredCharacter={state.transferredCharacter}
                            recentGenerations={recentGenerations}
                        />
                    </Suspense>
                );
            case 'remix':
                return (
                     <Suspense fallback={<LoadingFallback />}>
                        <PhotoRemixWorkflow 
                            remix={remix}
                            // State slices passed as props for memoization
                            isLoading={state.isLoading}
                            remixState={state.remixState}
                            wallpaperSettings={state.wallpaperSettings}
                         />
                    </Suspense>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm h-full flex flex-col rounded-lg overflow-hidden border border-gray-700/50">
            {/* Main Studio Navigation Tabs */}
            <div className="flex border-b border-gray-700/50 flex-shrink-0">
                <TabButton mode="stickers" label="🎨 Sticker Studio" currentMode={appMode} setMode={setMode} />
                <TabButton mode="wallpapers" label="🖼️ Wallpaper Studio" currentMode={appMode} setMode={setMode} />
                <TabButton mode="remix" label="✨ Photo Remix" currentMode={appMode} setMode={setMode} />
            </div>
           {renderWorkflow()}
        </div>
    );
};


/**
 * Custom comparison function for React.memo.
 * It prevents ControlPanel from re-rendering unless the appMode or feedbackBin changes,
 * as other props (hooks) are assumed to be stable.
 */
const propsAreEqual = (prevProps: ControlPanelProps, nextProps: ControlPanelProps) => {
    return (
        prevProps.appMode === nextProps.appMode &&
        prevProps.feedbackBin === nextProps.feedbackBin &&
        prevProps.recentGenerations === nextProps.recentGenerations
    );
};

export const ControlPanel = React.memo(ControlPanelComponent, propsAreEqual);