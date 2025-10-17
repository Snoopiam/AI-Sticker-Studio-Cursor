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
    { target: '[data-tour-id="expression-grid"]', content: 'Next, choose one or more expressions for your sticker pack.', position: 'left' },
    { target: '[data-tour-id="generate-button"]', content: 'Finally, click "Generate" to create your stickers!', position: 'left' },
];

const wallpaperSteps: Step[] = [
    { target: '[data-tour-id="character-library"]', content: 'Import characters to include in your wallpapers. You can create them from photos or import generated stickers.', position: 'right' },
    { target: '[data-tour-id="wallpaper-prompt"]', content: 'Describe the scene you want to create for your wallpaper.', position: 'left' },
    { target: '[data-tour-id="wallpaper-generate"]', content: 'Click here to generate your stunning new wallpaper!', position: 'left' },
];

const remixSteps: Step[] = [
    { target: '[data-tour-id="remix-upload-area"]', content: 'Upload any photo to get started. The AI will automatically cut out the subjects for you.', position: 'right' },
    { target: '[data-tour-id="remix-generate"]', content: 'Describe the new scene and how you want to change the subjects, then click Generate!', position: 'left' },
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

    // Handle window resize to recalculate positions
    useEffect(() => {
        const handleResize = () => {
            if (step && targetRect) {
                const targetElement = document.querySelector(step.target);
                if (targetElement) {
                    setTargetRect(targetElement.getBoundingClientRect());
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [step, targetRect]);

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
        const offset = 24; // Increased offset to prevent overlap
        const tooltipWidth = window.innerWidth < 768 ? 280 : 320;
        const tooltipHeight = window.innerWidth < 768 ? 100 : 120;
        const viewportPadding = window.innerWidth < 768 ? 16 : 20;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate safe zones to avoid overlapping with target
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        
        // Determine best position to avoid overlap
        let finalPosition = position;
        let finalStyle: React.CSSProperties = { ...style };

        // Check if tooltip would overlap with target in current position
        const wouldOverlap = (pos: string) => {
            switch (pos) {
                case 'top':
                    return targetRect.top - tooltipHeight - offset < 0 || 
                           Math.abs((targetRect.top - tooltipHeight - offset) - targetRect.bottom) < 50;
                case 'bottom':
                    return targetRect.bottom + tooltipHeight + offset > viewportHeight ||
                           Math.abs((targetRect.bottom + offset) - targetRect.top) < 50;
                case 'left':
                    return targetRect.left - tooltipWidth - offset < 0 ||
                           Math.abs((targetRect.left - tooltipWidth - offset) - targetRect.right) < 50;
                case 'right':
                    return targetRect.right + tooltipWidth + offset > viewportWidth ||
                           Math.abs((targetRect.right + offset) - targetRect.left) < 50;
                default:
                    return false;
            }
        };

        // Find the best non-overlapping position
        if (wouldOverlap(position)) {
            const positions = ['top', 'bottom', 'left', 'right'];
            for (const pos of positions) {
                if (!wouldOverlap(pos)) {
                    finalPosition = pos;
                    break;
                }
            }
        }

        // Apply positioning with aggressive spacing
        switch (finalPosition) {
            case 'top':
                finalStyle.top = Math.max(viewportPadding, targetRect.top - tooltipHeight - offset);
                finalStyle.left = Math.max(viewportPadding, Math.min(
                    viewportWidth - tooltipWidth - viewportPadding,
                    targetCenterX - tooltipWidth / 2
                ));
                break;
            case 'bottom':
                finalStyle.top = Math.min(viewportHeight - tooltipHeight - viewportPadding, targetRect.bottom + offset);
                finalStyle.left = Math.max(viewportPadding, Math.min(
                    viewportWidth - tooltipWidth - viewportPadding,
                    targetCenterX - tooltipWidth / 2
                ));
                break;
            case 'left':
                finalStyle.top = Math.max(viewportPadding, Math.min(
                    viewportHeight - tooltipHeight - viewportPadding,
                    targetCenterY - tooltipHeight / 2
                ));
                finalStyle.left = Math.max(viewportPadding, targetRect.left - tooltipWidth - offset);
                break;
            case 'right':
                finalStyle.top = Math.max(viewportPadding, Math.min(
                    viewportHeight - tooltipHeight - viewportPadding,
                    targetCenterY - tooltipHeight / 2
                ));
                finalStyle.left = Math.min(viewportWidth - tooltipWidth - viewportPadding, targetRect.right + offset);
                break;
        }

        // If still overlapping, force position to screen edges
        if (finalStyle.top! < viewportPadding) {
            finalStyle.top = viewportPadding;
        }
        if (finalStyle.left! < viewportPadding) {
            finalStyle.left = viewportPadding;
        }
        if (finalStyle.top! + tooltipHeight > viewportHeight - viewportPadding) {
            finalStyle.top = viewportHeight - tooltipHeight - viewportPadding;
        }
        if (finalStyle.left! + tooltipWidth > viewportWidth - viewportPadding) {
            finalStyle.left = viewportWidth - tooltipWidth - viewportPadding;
        }

        return finalStyle;
    };
    
    // Enhanced highlight system with arrow indicators
    const highlightStyle: React.CSSProperties = {
        position: 'fixed',
        top: targetRect.top,
        left: targetRect.left,
        width: targetRect.width,
        height: targetRect.height,
        borderRadius: '8px',
        boxShadow: '0 0 0 3px #A78BFA, 0 0 0 9999px rgba(0,0,0,0.6)',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'all 0.3s ease-in-out'
    };

    // Calculate arrow position based on tooltip position
    const getArrowStyle = (): React.CSSProperties => {
        const tooltipStyle = getTooltipPosition();
        const arrowSize = 12;
        
        const arrowStyle: React.CSSProperties = {
            position: 'fixed',
            width: 0,
            height: 0,
            zIndex: 10002,
            pointerEvents: 'none',
        };

        // Determine arrow direction based on tooltip position relative to target
        const tooltipCenterX = tooltipStyle.left! + 160; // Half of tooltip width
        const tooltipCenterY = tooltipStyle.top! + 60; // Half of tooltip height
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;

        if (tooltipCenterY < targetCenterY) {
            // Tooltip is above target - arrow points down
            arrowStyle.top = tooltipStyle.top! + 120 - arrowSize;
            arrowStyle.left = Math.max(targetRect.left, Math.min(targetRect.right - arrowSize, tooltipCenterX - arrowSize));
            arrowStyle.borderLeft = `${arrowSize}px solid transparent`;
            arrowStyle.borderRight = `${arrowSize}px solid transparent`;
            arrowStyle.borderTop = `${arrowSize}px solid #A78BFA`;
        } else {
            // Tooltip is below target - arrow points up
            arrowStyle.top = tooltipStyle.top! - arrowSize;
            arrowStyle.left = Math.max(targetRect.left, Math.min(targetRect.right - arrowSize, tooltipCenterX - arrowSize));
            arrowStyle.borderLeft = `${arrowSize}px solid transparent`;
            arrowStyle.borderRight = `${arrowSize}px solid transparent`;
            arrowStyle.borderBottom = `${arrowSize}px solid #A78BFA`;
        }

        return arrowStyle;
    };

    return (
        <>
            <div className="fixed inset-0 z-[9999]" onClick={handleFinish} />
            <div style={highlightStyle} />
            <div style={getArrowStyle()} />
            <div 
                style={getTooltipPosition()} 
                className="bg-purple-600 text-white p-4 rounded-lg shadow-xl max-w-sm w-full animate-fade-in border border-purple-500"
            >
                <p className="text-sm font-medium leading-relaxed">{step.content}</p>
                <div className="flex justify-between items-center mt-4">
                    <button 
                        onClick={handleFinish} 
                        className="text-xs font-semibold text-purple-200 hover:text-white transition-colors duration-200"
                    >
                        Skip Tour
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-purple-200 font-medium">{currentStep + 1} / {steps.length}</span>
                        <button 
                            onClick={handleNext} 
                            className="bg-white text-purple-600 font-bold py-2 px-4 rounded-md text-sm hover:bg-purple-50 transition-colors duration-200 shadow-sm"
                        >
                            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};