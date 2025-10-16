/**
 * @file components/OnboardingTooltips.tsx
 * @description A component that provides a guided tour for first-time users. It displays
 * a sequence of tooltips that highlight key UI elements and explain their function.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { AppMode } from '../../types/types';
import { ONBOARDING_POLL_INTERVAL_MS, ONBOARDING_POLL_MAX_ATTEMPTS } from '../../constants';

/**
 * @interface Step
 * @description Defines the structure for a single step in the onboarding tour.
 */
interface Step {
    /** A CSS selector to find the UI element this tooltip should point to. */
    target: string;
    /** The text content of the tooltip. */
    content: string;
    /** The desired position of the tooltip relative to the target element. */
    position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * @interface OnboardingTooltipsProps
 * @description Defines the props for the OnboardingTooltips component.
 */
interface OnboardingTooltipsProps {
    appMode: AppMode;
}

// Define the steps for each application mode.
const stickerSteps: Step[] = [
    { target: '[data-tour-id="upload-area"]', content: 'Start by uploading a clear photo of yourself here.', position: 'right' },
    { target: '[data-tour-id="upload-area"]', content: 'Your photo will be automatically calibrated to lock your identity. This is the magic that makes stickers look like you!', position: 'right' },
    { target: '[data-tour-id="expression-grid"]', content: 'Next, choose one or more expressions for your sticker pack.', position: 'top' },
    { target: '[data-tour-id="generate-button"]', content: 'Finally, click "Generate" to create your stickers!', position: 'top' },
];

const wallpaperSteps: Step[] = [
    { target: '[data-tour-id="character-library"]', content: 'Import characters to include in your wallpapers. You can create them from photos or import generated stickers.', position: 'right' },
    { target: '[data-tour-id="wallpaper-prompt"]', content: 'Describe the scene you want to create for your wallpaper.', position: 'top' },
    { target: '[data-tour-id="wallpaper-generate"]', content: 'Click here to generate your stunning new wallpaper!', position: 'top' },
];

const remixSteps: Step[] = [
    { target: '[data-tour-id="remix-upload-area"]', content: 'Upload any photo to get started. The AI will automatically cut out the subjects for you.', position: 'right' },
    { target: '[data-tour-id="remix-generate"]', content: 'Describe the new scene and how you want to change the subjects, then click Generate!', position: 'top' },
];

const stepsMap: Record<string, Step[]> = {
    stickers: stickerSteps,
    wallpapers: wallpaperSteps,
    remix: remixSteps,
};

export const OnboardingTooltips: React.FC<OnboardingTooltipsProps> = ({ appMode }) => {
    const { dispatch } = useAppContext();
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = stepsMap[appMode] || [];
    const step = steps[currentStep];

    const handleFinish = useCallback(() => {
        dispatch({ type: 'COMPLETE_ONBOARDING_FOR_MODE', payload: appMode });
    }, [dispatch, appMode]);
    
    const handleNext = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    }, [currentStep, steps.length, handleFinish]);

    // Reset the tour if the app mode changes
    useEffect(() => {
        setCurrentStep(0);
        setTargetRect(null); // Clear previous target
    }, [appMode]);

    useEffect(() => {
        if (!step) return;

        let attempts = 0;
        const maxAttempts = ONBOARDING_POLL_MAX_ATTEMPTS;
        
        // This interval robustly polls the DOM for the target element, which is necessary
        // for lazy-loaded components that may not be available immediately.
        const interval = setInterval(() => {
            const targetElement = document.querySelector(step.target);
            if (targetElement) {
                clearInterval(interval);
                setTargetRect(targetElement.getBoundingClientRect());
                // Using a short delay before scrolling can help if there are other layout shifts.
                setTimeout(() => {
                     targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }, 50);
            } else {
                attempts++;
                if (attempts > maxAttempts) {
                    clearInterval(interval);
                    console.warn(`Onboarding target not found after ${maxAttempts} attempts: ${step.target}. Skipping.`);
                    handleNext();
                }
            }
        }, ONBOARDING_POLL_INTERVAL_MS);

        return () => clearInterval(interval);

    }, [currentStep, step, handleNext, appMode]);


    if (!targetRect || !step) {
        return null; // Don't render until we have a target
    }

    const getTooltipPosition = (): React.CSSProperties => {
        const position = step.position || 'bottom';
        const style: React.CSSProperties = {
            position: 'fixed',
            zIndex: 10001,
            transition: 'top 0.3s ease-in-out, left 0.3s ease-in-out',
        };
        const offset = 12;

        switch (position) {
            case 'top':
                style.top = targetRect.top - offset;
                style.left = targetRect.left + targetRect.width / 2;
                style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                style.top = targetRect.bottom + offset;
                style.left = targetRect.left + targetRect.width / 2;
                style.transform = 'translateX(-50%)';
                break;
            case 'left':
                style.top = targetRect.top + targetRect.height / 2;
                style.left = targetRect.left - offset;
                style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                style.top = targetRect.top + targetRect.height / 2;
                style.left = targetRect.right + offset;
                style.transform = 'translateY(-50%)';
                break;
        }
        return style;
    };
    
    // A separate element to highlight the target with a border and create a "spotlight" effect.
    const highlightStyle: React.CSSProperties = {
        position: 'fixed',
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius: '8px',
        boxShadow: '0 0 0 4px #A78BFA, 0 0 0 9999px rgba(0,0,0,0.7)',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'all 0.3s ease-in-out'
    };

    return (
        <>
            <div className="fixed inset-0 z-[9999]" onClick={handleFinish} />
            <div style={highlightStyle} />
            <div style={getTooltipPosition()} className="bg-purple-600 text-white p-4 rounded-lg shadow-lg max-w-xs w-full animate-fade-in">
                <p className="text-sm">{step.content}</p>
                <div className="flex justify-between items-center mt-4">
                    <button onClick={handleFinish} className="text-xs font-semibold text-purple-200 hover:text-white">Skip Tour</button>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-200">{currentStep + 1} / {steps.length}</span>
                        <button onClick={handleNext} className="bg-white text-purple-600 font-bold py-1 px-3 rounded-md text-sm">
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};