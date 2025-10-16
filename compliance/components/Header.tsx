/**
 * @file components/Header.tsx
 * @description The main header component for the application. It displays the app title,
 * undo/redo controls, layout switcher, credits display, and action buttons including
 * dev log access, about modal, and session restart.
 * 
 * Recent Changes:
 * - Added Credits Display: Shows user's available credits with coin icon
 * - Added About Button: Opens the CreditsModal with app information
 */
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import type { useSessionManagement } from '../../hooks/useSessionManagement';
import { LayoutMode } from '../../types/types';

interface HeaderProps {
    sessionManagement: ReturnType<typeof useSessionManagement>;
}

/**
 * @const layoutOptions
 * @description An array of objects defining the available layout modes for the UI dropdown.
 */
const layoutOptions: { value: LayoutMode; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'side-by-side', label: 'Side-by-Side' },
    { value: 'stacked', label: 'Stacked' },
    { value: 'dual-pane', label: 'Dual Pane' },
];

/**
 * @component Header
 * @description Renders the main application header, including navigation, mode switching, and session controls.
 * @param {HeaderProps} props - The component props.
 */
export const Header: React.FC<HeaderProps> = ({ sessionManagement }) => {
    const { state, dispatch } = useAppContext();
    const { past, future, layoutMode, credits } = state;

    /**
     * Handles changes to the layout mode dropdown and dispatches the corresponding action.
     * @param {React.ChangeEvent<HTMLSelectElement>} e - The change event from the select element.
     */
    const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_LAYOUT_MODE', payload: e.target.value as LayoutMode });
    };

    /** Dispatches the 'UNDO' action. */
    const handleUndo = () => dispatch({ type: 'UNDO' });
    /** Dispatches the 'REDO' action. */
    const handleRedo = () => dispatch({ type: 'REDO' });
    /** Dispatches the 'OPEN_DEV_LOG' action. */
    const handleOpenDevLog = () => dispatch({ type: 'OPEN_DEV_LOG' });

    /** A string of common Tailwind CSS classes for consistent button styling in the header. */
    const commonButtonClasses = "text-sm font-semibold text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 p-2 rounded-md hover:bg-gray-700/50";

    return (
        <header className="flex-shrink-0 p-2 sm:p-4 flex items-center justify-between border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
            <h1 className="text-xl font-bold font-heading text-white">AI Sticker Studio</h1>
            
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Undo/Redo Controls */}
                <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-1">
                    <button onClick={handleUndo} disabled={past.length === 0} className={commonButtonClasses} aria-label="Undo" title="Undo (Ctrl+Z)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={handleRedo} disabled={future.length === 0} className={commonButtonClasses} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a7 7 0 107 7v-2a1 1 0 112 0v2a9 9 0 11-9-9h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Layout Switcher */}
                <div className="items-center gap-2 hidden sm:flex">
                    <label htmlFor="layout-switcher" className="text-sm font-medium text-gray-400">Layout:</label>
                    <select
                        id="layout-switcher"
                        value={layoutMode}
                        onChange={handleLayoutChange}
                        className="bg-gray-700 border border-gray-600 rounded-md text-sm text-white focus:ring-purple-500 focus:border-purple-500 py-1.5 pl-2 pr-8"
                        aria-label="Switch layout mode"
                    >
                        {layoutOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                
                {/* Credits Display: Shows the current credit balance with a coin icon */}
                <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5">
                    {/* Coin/token icon */}
                    <svg 
                        className="w-5 h-5 text-yellow-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                    >
                        <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
                            clipRule="evenodd" 
                        />
                    </svg>
                    {/* Live credit count from app state */}
                    <span className="text-sm font-semibold text-white" aria-label="Available credits">
                        {credits}
                    </span>
                </div>
                
                {/* Session & Dev Controls */}
                <div className="flex items-center gap-1">
                    <button onClick={handleOpenDevLog} className={commonButtonClasses} aria-label="Open Development Log">
                        Dev Log
                    </button>
                    {/* About Button: Opens modal with app info, credits, and technology details */}
                    <button 
                        onClick={() => dispatch({ type: 'OPEN_CREDITS_MODAL' })} 
                        className={commonButtonClasses} 
                        aria-label="About AI Sticker Studio"
                        title="About AI Sticker Studio"
                    >
                        {/* Info icon (i) */}
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                        >
                            <path 
                                fillRule="evenodd" 
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
                                clipRule="evenodd" 
                            />
                        </svg>
                        About
                    </button>
                    <button onClick={sessionManagement.restartSession} className={commonButtonClasses} aria-label="Restart Session">
                        Restart
                    </button>
                </div>
            </div>
        </header>
    );
};