/**
 * @file components/PromptControls.tsx
 * @description Component for handling prompt inputs and AI-generated suggestions in the Photo Remix workflow.
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { RemixState, SceneSuggestion } from '../../types/types';

/**
 * @interface PromptControlsProps
 * @description Props for the PromptControls component.
 */
interface PromptControlsProps {
    /** The current remix state containing prompt data */
    remixState: RemixState;
    /** Whether the app is currently loading */
    isLoading: boolean;
    /** Callback when a suggestion is selected */
    onSelectSuggestion: (suggestion: SceneSuggestion) => void;
}

/**
 * @component PromptControls
 * @description Handles the prompt input section of the Photo Remix workflow.
 */
const PromptControls: React.FC<PromptControlsProps> = ({ 
    remixState, 
    isLoading, 
    onSelectSuggestion 
}) => {
    const { dispatch } = useAppContext();
    const { backgroundPrompt, foregroundPrompt, sceneSuggestions, cutoutImage } = remixState;

    return (
        <div className="py-4 border-b border-gray-700/50 px-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-heading">2. Describe the New Scene</h3>
            </div>
            <div className="space-y-4">
                <textarea 
                    value={backgroundPrompt} 
                    onChange={(e) => dispatch({ type: 'SET_REMIX_STATE', payload: { backgroundPrompt: e.target.value, generatedBackground: null, finalImage: null }})} 
                    rows={3} 
                    placeholder="e.g., An epic battle on Mars with Earth in the sky, cinematic lighting" 
                    className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm text-white p-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500" 
                    disabled={!cutoutImage || isLoading} 
                />
                <textarea 
                    value={foregroundPrompt} 
                    onChange={(e) => dispatch({ type: 'SET_REMIX_STATE', payload: { foregroundPrompt: e.target.value, remixedCutoutImage: null, finalImage: null }})} 
                    rows={3} 
                    placeholder="Describe how to modify the subjects (clothing, props, etc.). Leave blank for no changes." 
                    className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm text-white p-2 focus:ring-1 focus:ring-purple-500 focus:border-purple-500" 
                    disabled={!cutoutImage || isLoading} 
                />
                {sceneSuggestions && (
                    <div className="p-3 bg-gray-900/50 rounded-lg space-y-2">
                        <h4 className="text-sm font-semibold text-gray-200">✨ AI-Generated Ideas</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sceneSuggestions.map((suggestion, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => onSelectSuggestion(suggestion)} 
                                    className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-md text-left transition-colors text-sm"
                                >
                                    <p className="font-semibold text-purple-300">{suggestion.title}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptControls;
