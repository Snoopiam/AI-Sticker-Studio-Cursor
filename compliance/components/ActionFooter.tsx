/**
 * @file components/ActionFooter.tsx
 * @description Component for the action footer with generation controls in the Photo Remix workflow.
 */

import React from 'react';
import { useRemix } from '../../hooks/useRemix';
import { useInspiration } from '../../hooks/useInspiration';
import { CREDIT_COSTS } from '../../constants';
import { RemixState } from '../../types/types';

/**
 * @interface ActionFooterProps
 * @description Props for the ActionFooter component.
 */
interface ActionFooterProps {
    /** The current remix state */
    remixState: RemixState;
    /** Whether the app is currently loading */
    isLoading: boolean;
    /** Whether advanced mode is enabled */
    advancedMode: boolean;
}

/**
 * @component ActionFooter
 * @description Handles the action footer with generation controls for the Photo Remix workflow.
 */
const ActionFooter: React.FC<ActionFooterProps> = ({ 
    remixState, 
    isLoading, 
    advancedMode 
}) => {
    const remix = useRemix();
    const { inspireMe } = useInspiration();
    const { backgroundPrompt, foregroundPrompt, cutoutImage, originalImage, isGroupPhoto } = remixState;

    return (
        <div className="p-4 bg-gray-900/50 flex flex-col gap-2 flex-shrink-0 border-t border-gray-700/50">
            {advancedMode && (
                <div className="grid grid-cols-3 gap-2 items-center justify-center text-center text-xs mb-2">
                    {remixState.remixedCutoutImage ? (
                        <img 
                            src={remixState.remixedCutoutImage} 
                            alt="Step 1: Preview of remixed subjects" 
                            className="h-16 mx-auto rounded-md bg-transparent" 
                            style={{backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)', backgroundSize: '8px 8px' }}
                        />
                    ) : (
                        <div className="h-16 w-16 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">Subjects</div>
                    )}
                    {remixState.generatedBackground ? (
                        <img 
                            src={remixState.generatedBackground} 
                            alt="Step 2: Preview of generated background" 
                            className="h-16 mx-auto rounded-md" 
                        />
                    ) : (
                        <div className="h-16 w-16 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">BG</div>
                    )}
                    {remixState.finalImage ? (
                        <img 
                            src={remixState.finalImage} 
                            alt="Step 3: Preview of final composite image" 
                            className="h-16 mx-auto rounded-md" 
                        />
                    ) : (
                        <div className="h-16 w-16 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">Final</div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2">
                <button 
                    onClick={inspireMe}
                    className="text-sm font-semibold text-purple-400 hover:text-purple-300"
                    title="Get creative AI-powered suggestions"
                    disabled={isLoading}
                >
                    Inspire Me
                </button>
                <div className="flex-grow" />
                {advancedMode ? (
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => remix.executeAdvancedRemixStep('remix')} 
                            disabled={!foregroundPrompt.trim() || !cutoutImage || isLoading} 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 text-sm rounded-md disabled:opacity-50"
                        >
                            1. Remix Subjects ({CREDIT_COSTS.REMIX_STEP_REMIX})
                        </button>
                        <button 
                            onClick={() => remix.executeAdvancedRemixStep('background')} 
                            disabled={!backgroundPrompt.trim() || !originalImage || isLoading} 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 text-sm rounded-md disabled:opacity-50"
                        >
                            2. Gen Background ({CREDIT_COSTS.REMIX_STEP_BACKGROUND})
                        </button>
                        <button 
                            onClick={() => remix.executeAdvancedRemixStep('composite')} 
                            disabled={!remixState.generatedBackground || !cutoutImage || isLoading} 
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 text-sm rounded-md disabled:opacity-50"
                        >
                            3. Composite ({CREDIT_COSTS.REMIX_STEP_COMPOSITE})
                        </button>
                    </div>
                ) : (
                    <button
                        data-tour-id="remix-generate"
                        onClick={remix.initiateSimpleGenerate}
                        disabled={!cutoutImage || !backgroundPrompt.trim() || isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : isGroupPhoto ? 'Analyze & Generate (Costs Vary)' : `Generate Remix (Cost: ${CREDIT_COSTS.REMIX_SINGLE_SUBJECT})`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActionFooter;
