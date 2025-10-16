/**
 * @file components/PhotoRemixWorkflow.tsx
 * @description The main control panel UI for the "Photo Remix" feature. This component
 * manages the entire workflow from uploading a photo to configuring and generating the final
 * remixed image. It includes both a simple one-click generation mode and an advanced
 * step-by-step mode for finer control.
 */

import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useImageInputHandler } from '../../hooks/useImageInputHandler';
import { DRAG_AND_DROP_TYPE } from '../../constants';
import { RemixState, WallpaperSettings, GeneratedResult, SceneSuggestion } from '../../types/types';
import UploadSection from './UploadSection';
import PromptControls from './PromptControls';
import GenerationModeToggle from './GenerationModeToggle';
import ActionFooter from './ActionFooter';



/**
 * @interface PhotoRemixWorkflowProps
 * @description Defines the props for the PhotoRemixWorkflow.
 */
interface PhotoRemixWorkflowProps {
    remix: ReturnType<typeof useRemix>;
    isLoading: boolean;
    remixState: RemixState;
    wallpaperSettings: WallpaperSettings;
}

/**
 * @component PhotoRemixWorkflowComponent
 * @description The core component for the Photo Remix feature's control panel.
 */
const PhotoRemixWorkflowComponent: React.FC<PhotoRemixWorkflowProps> = ({ remix, isLoading, remixState, wallpaperSettings }) => {
    // Consume global state and dispatch function from the AppContext.
    const { dispatch } = useAppContext();
    
    // Local state for UI interactions.
    const [advancedMode, setAdvancedMode] = useState(false);

    /**
     * Callback for the image input hook. It converts the base64 string back to a File
     * to pass to the existing remix.uploadAndAnalyze hook, preserving its interface.
     */
    const onImageLoaded = useCallback((base64: string) => {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const file = new File([blob], "uploaded_image.png", { type: mimeString });
        remix.uploadAndAnalyze(file);
    }, [remix]);

    const imageInput = useImageInputHandler({
        onImageLoaded,
        onError: (e) => dispatch({ type: 'GENERATION_ERROR', payload: e.message }),
    });

    const handleCollectionDrop = (e: React.DragEvent) => {
        const data = e.dataTransfer.getData(DRAG_AND_DROP_TYPE);
        if (data) {
            try {
                const result: GeneratedResult = JSON.parse(data);
                onImageLoaded(result.dataUrl);
            } catch (error) {
                console.error("Failed to parse dropped collection item", error);
                dispatch({ type: 'GENERATION_ERROR', payload: 'Failed to use the dropped item.'});
            }
        }
    };
    
    /**
     * Populates the prompt text areas when a user selects an AI-generated idea.
     * @param {SceneSuggestion} suggestion - The selected suggestion object.
     */
    const handleSelectSuggestion = (suggestion: SceneSuggestion) => {
        dispatch({ type: 'SET_REMIX_STATE', payload: {
            backgroundPrompt: suggestion.backgroundPrompt,
            foregroundPrompt: suggestion.foregroundPrompt,
        }});
    };

    /**
     * Provides creative inspiration by suggesting prompts. It's context-aware, using the AI
     * to analyze the uploaded image if available, or providing a pre-defined fallback otherwise.
     */
    
    return (
        <div className="flex flex-col h-full" onPaste={imageInput.handlePaste}>
            <div className="flex-1 overflow-y-auto">
                <UploadSection 
                    remixState={remixState}
                    isLoading={isLoading}
                    onImageLoaded={onImageLoaded}
                    onCollectionDrop={handleCollectionDrop}
                />
                <PromptControls 
                    remixState={remixState}
                    isLoading={isLoading}
                    onSelectSuggestion={handleSelectSuggestion}
                />
                <GenerationModeToggle 
                    advancedMode={advancedMode}
                    onToggle={setAdvancedMode}
                />
            </div>
            <ActionFooter 
                remixState={remixState}
                isLoading={isLoading}
                advancedMode={advancedMode}
            />
        </div>
    );
};

const propsAreEqual = (prevProps: PhotoRemixWorkflowProps, nextProps: PhotoRemixWorkflowProps) => {
    return (
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.remixState === nextProps.remixState &&
        prevProps.wallpaperSettings === nextProps.wallpaperSettings
    );
};

export default React.memo(PhotoRemixWorkflowComponent, propsAreEqual);