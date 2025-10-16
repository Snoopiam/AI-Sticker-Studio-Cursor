/**
 * @file components/KillSwitchIndicator.tsx
 * @description A UI component that displays a prominent warning when the global API kill switch is active.
 * It informs the user that services are temporarily paused and provides an estimated time for resumption if available.
 */

import React, { useState, useEffect } from 'react';
import { apiKillSwitch } from '../../utils/killSwitch';

/**
 * @component KillSwitchIndicator
 * @description Renders a warning banner when the API kill switch is active.
 * It subscribes to the kill switch state and updates its display accordingly.
 */
export const KillSwitchIndicator: React.FC = () => {
    const [state, setState] = useState(apiKillSwitch.getState());
    
    // Effect to subscribe to changes in the kill switch state.
    useEffect(() => {
        const unsubscribe = apiKillSwitch.subscribe(setState);
        return () => unsubscribe();
    }, []);
    
    if (!state.active) return null;
    
    // Calculate the remaining time if an auto-reactivation is scheduled.
    const timeRemaining = state.autoReactivateAt 
        ? Math.ceil((state.autoReactivateAt - Date.now()) / 1000)
        : null;
    
    return (
        <div className="fixed top-20 right-4 bg-red-800 border border-red-600 text-white p-4 rounded-lg shadow-xl z-[10000] max-w-sm fade-in">
            <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <strong className="text-lg font-heading">API Services Paused</strong>
            </div>
            <p className="text-sm text-red-100 mb-3">{state.reason}</p>
            {timeRemaining && timeRemaining > 0 && (
                <p className="text-xs text-red-200">Auto-resuming in {timeRemaining}s</p>
            )}
            <button
                onClick={() => apiKillSwitch.deactivate()}
                className="mt-2 w-full text-center px-3 py-1.5 bg-red-100 text-red-800 rounded text-sm font-bold hover:bg-red-200 transition-colors"
            >
                Resume Manually
            </button>
        </div>
    );
};