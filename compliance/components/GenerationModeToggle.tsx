/**
 * @file components/GenerationModeToggle.tsx
 * @description Component for toggling between simple and advanced generation modes in the Photo Remix workflow.
 */

import React from 'react';

/**
 * @interface GenerationModeToggleProps
 * @description Props for the GenerationModeToggle component.
 */
interface GenerationModeToggleProps {
    /** Whether advanced mode is currently enabled */
    advancedMode: boolean;
    /** Callback when the mode is toggled */
    onToggle: (enabled: boolean) => void;
}

/**
 * @component GenerationModeToggle
 * @description Handles the generation mode toggle section of the Photo Remix workflow.
 */
const GenerationModeToggle: React.FC<GenerationModeToggleProps> = ({ 
    advancedMode, 
    onToggle 
}) => {
    return (
        <div className="py-4 border-b border-gray-700/50 last:border-b-0 px-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-heading">3. Generation Mode</h3>
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3">
                    <label htmlFor="advanced-mode-toggle" className="font-semibold text-gray-300 cursor-pointer flex-grow">Advanced (Step-by-Step)</label>
                    <button 
                        id="advanced-mode-toggle" 
                        role="switch" 
                        aria-checked={advancedMode} 
                        onClick={() => onToggle(!advancedMode)} 
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${advancedMode ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${advancedMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerationModeToggle;
