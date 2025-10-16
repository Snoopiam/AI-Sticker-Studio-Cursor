/**
 * @file components/LandingPage.tsx
 * @description The initial landing page component for the application. It provides a welcoming
 * splash screen and a button to enter the main studio. It also manages the transition
 * animation from the landing page to the studio view.
 */

import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { AiCore } from '../compliance/components/StickerPreview';
import { LANDING_PAGE_BACKGROUND_IMAGE } from '../constants';

/**
 * @component LandingPage
 * @description Renders the full-screen landing page. It listens for the 'transitioning'
 * app phase to apply fade-out animations before the main app is rendered.
 */
export const LandingPage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { appPhase } = state;

    /**
     * Initiates the transition to the main studio by dispatching the 'START_TRANSITION' action.
     */
    const handleEnter = () => {
        dispatch({ type: 'START_TRANSITION' });
    };

    /**
     * An effect that listens for the 'transitioning' phase. Once triggered, it waits for the
     * CSS animation to complete before dispatching 'FINISH_TRANSITION' to finally switch
     * to the 'studio' phase and unmount the landing page.
     */
    useEffect(() => {
        if (appPhase === 'transitioning') {
            const timer = setTimeout(() => {
                dispatch({ type: 'FINISH_TRANSITION' });
            }, 1000); // This duration should match the CSS transition for the landing page fade-out.
            return () => clearTimeout(timer);
        }
    }, [appPhase, dispatch]);

    const isTransitioning = appPhase === 'transitioning';
    // Dynamic CSS classes to control the fade-out and slide-up animations.
    const containerClasses = `fixed inset-0 z-50 transition-opacity duration-1000 ${isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'}`;
    const contentClasses = `text-center transition-all duration-700 ${isTransitioning ? 'opacity-0 transform -translate-y-8' : 'opacity-100'}`;
    const coreClasses = isTransitioning ? 'core-power-up-animation' : 'core-scale-in-animation';
    
    return (
        <div 
            className={containerClasses}
            style={{
                backgroundImage: `url(${LANDING_PAGE_BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
            }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative h-full flex flex-col items-center justify-center p-4 md:p-8">
                 <AiCore isProcessing={false} className={coreClasses} />
                 
                <div className={`mt-4 sm:mt-6 md:mt-8 ${contentClasses}`}>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-heading text-white" style={{ animation: 'text-focus-in 1s cubic-bezier(0.550, 0.085, 0.680, 0.530) both' }}>
                        AI Sticker Studio
                    </h1>
                    <p className="text-base sm:text-lg text-gray-300 mt-2 md:mt-4" style={{ animation: 'text-focus-in 1s cubic-bezier(0.550, 0.085, 0.680, 0.530) 0.2s both' }}>
                        Craft Your Vision. Instantly.
                    </p>
                </div>
                
                <div className={`mt-6 sm:mt-8 md:mt-12 ${contentClasses}`} style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={handleEnter}
                        className="bg-purple-600 text-white font-bold text-sm sm:text-base py-2 px-6 sm:py-3 sm:px-8 rounded-lg 
                                   hover:bg-purple-700 transition-all duration-300 transform hover:scale-105
                                   focus:outline-none focus:ring-4 focus:ring-purple-500/50
                                   shadow-lg shadow-purple-500/20"
                    >
                        Enter Studio
                    </button>
                </div>
            </div>
        </div>
    );
};