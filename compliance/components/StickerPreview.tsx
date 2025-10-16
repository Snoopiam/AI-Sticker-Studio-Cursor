/**
 * @file components/StickerPreview.tsx
 * @description This component serves as the main preview area for the application. It dynamically
 * displays either the grid of generated stickers/wallpapers, the loading/error states, or a dedicated
 * "Before and After" UI for the Photo Remix feature.
 */

import React, { useState, useMemo } from 'react';
import { GeneratedResult, Settings, Character, WallpaperSettings } from '../../types/types';
import { useAppContext } from '../../context/AppContext';
import { imageCache } from '../../utils/services/imageCache';
import { downloadResult } from '../../utils/stateManager';
import { useCharacterCreation } from '../../hooks/useCharacterCreation';
import { DRAG_AND_DROP_TYPE } from '../../constants';

/**
 * @component AiCore
 * @description A reusable visual component representing the "AI Core". It displays a futuristic,
 * animated orb that pulses or pings to indicate whether the AI is idle or processing.
 * @param {object} props - Component props.
 * @param {boolean} props.isProcessing - Determines if the core shows the active "ping" animation.
 * @param {string} [props.className] - Optional additional CSS classes.
 */
export const AiCore: React.FC<{ isProcessing: boolean; className?: string }> = ({ isProcessing, className }) => (
    <div className={`relative w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 flex items-center justify-center ${className}`}>
        <div className={`absolute w-full h-full rounded-full bg-purple-500/10 ${isProcessing ? 'animate-ping' : 'animate-pulse'}`}></div>
        <div className="absolute w-2/3 h-2/3 rounded-full bg-purple-500/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <svg className="relative w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs><filter id="glow"><feGaussianBlur stdDeviation="3.5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <circle cx="100" cy="100" r="90" stroke="url(#paint0_linear)" strokeWidth="1" strokeOpacity="0.5" />
            <circle cx="100" cy="100" r="70" stroke="url(#paint1_linear)" strokeWidth="1" strokeOpacity="0.7" className="animate-[spin-slow_20s_linear_infinite_reverse]" />
            <circle cx="100" cy="100" r="50" stroke="url(#paint2_linear)" strokeWidth="1.5" className="animate-[spin-slow_15s_linear_infinite]" />
            <circle cx="100" cy="100" r="30" fill="url(#paint_core)" filter="url(#glow)" />
            <circle cx="100" cy="100" r="30" stroke="#c4b5fd" strokeOpacity="0.5" />
            <defs>
                <linearGradient id="paint0_linear" x1="100" y1="10" x2="100" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#a78bfa" stopOpacity="0" /><stop offset="0.5" stopColor="#a78bfa" /><stop offset="1" stopColor="#a78bfa" stopOpacity="0" /></linearGradient>
                <linearGradient id="paint1_linear" x1="100" y1="30" x2="100" y2="170" gradientUnits="userSpaceOnUse"><stop stopColor="#c4b5fd" stopOpacity="0" /><stop offset="0.5" stopColor="#c4b5fd" /><stop offset="1" stopColor="#c4b5fd" stopOpacity="0" /></linearGradient>
                <linearGradient id="paint2_linear" x1="50" y1="100" x2="150" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#ddd6fe" stopOpacity="0" /><stop offset="0.5" stopColor="#ddd6fe" /><stop offset="1" stopColor="#ddd6fe" stopOpacity="0" /></linearGradient>
                <radialGradient id="paint_core" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(90) scale(30)"><stop stopColor="#6d28d9" /><stop offset="1" stopColor="#3730a3" /></radialGradient>
            </defs>
        </svg>
    </div>
);

/**
 * @component ResultCard
 * @description Renders a single generated result (image or video) in the preview grid.
 * It includes an overlay with action buttons for pinning, editing, downloading, and sharing.
 * @param {object} props - Component props.
 * @param {GeneratedResult} props.result - The generated result to display.
 * @param {function} props.characterCreation - The character creation hook for saving/transferring.
 * @param {function} props.onClick - Callback for when the card is clicked (to open the viewer).
 */
const ResultCard: React.FC<{ result: GeneratedResult, characterCreation: ReturnType<typeof useCharacterCreation>; onClick: () => void; }> = ({ result, characterCreation, onClick }) => {
    const { state, dispatch } = useAppContext();
    const { isCreatingCharacter } = state;
    const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
    
    // Initiates a download of the result.
    const handleDownloadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        downloadResult(result);
    };
    
    // Opens the post-processing modal or downloads if not an editable image.
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (result.type === 'image') {
            dispatch({ type: 'OPEN_EDITING_MODAL', payload: result });
        } else {
            handleDownloadClick(e);
        }
    };
    
    // Copies the generation data (prompt and settings) to the clipboard.
    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const formatSingleItemReport = (item: GeneratedResult): string => {
            let report = `AI STICKER STUDIO - ITEM REPORT\n`;
            report += `========================================\n`;
            report += `ID: ${item.id}\n`;
            report += `Type: ${item.type}\n`;
            report += `----------------------------------------\n`;
            report += `PROMPT:\n${item.prompt}\n`;
            report += `----------------------------------------\n`;
            report += `SETTINGS:\n${JSON.stringify(item.settings, null, 2)}\n`;
            report += `========================================\n`;
            return report;
        };
        navigator.clipboard.writeText(formatSingleItemReport(result));
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
    };

    /**
     * Handles the start of a drag operation. It sets the full GeneratedResult object
     * as JSON data using a custom data type in the data transfer, allowing the FeedbackBin to receive it.
     * @param {React.DragEvent} e - The drag event.
     * @param {GeneratedResult} result - The result being dragged.
     */
    const handleDragToFeedback = (e: React.DragEvent, result: GeneratedResult) => {
        e.dataTransfer.setData(DRAG_AND_DROP_TYPE, JSON.stringify(result));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div 
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gray-800" 
            onClick={onClick}
            draggable
            onDragStart={(e) => handleDragToFeedback(e, result)}
        >
            {result.type === 'image' || result.type === 'svg' || result.type === 'wallpaper' ? (
                <img src={result.dataUrl} alt={`Generated sticker: ${result.sourceExpression || 'Custom creation'}`} className="w-full h-full object-cover" />
            ) : (
                <video src={result.dataUrl} loop autoPlay muted playsInline className="w-full h-full object-cover" />
            )}
             {result.validation && (
                <div 
                    className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full text-xs font-bold text-white ${result.validation.isValid ? 'bg-green-600/80' : 'bg-yellow-600/80'}`}
                    title={`Identity Similarity Score: ${result.validation.similarityScore}%\nIssues: ${result.validation.issues?.join(', ') || 'None'}`}
                >
                    {result.validation.similarityScore}%
                </div>
            )}
            <div className="absolute inset-0 bg-black/70 flex items-center justify-around p-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap gap-2">
                <button onClick={handleEditClick} title={result.type === 'image' ? "Post-Process" : "Download"} className="p-2 rounded-full bg-gray-800/80 text-gray-300 hover:bg-purple-600">
                    {result.type === 'image' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.408 2.342a1.868 1.868 0 00-2.643 0l-11 11.002a1.868 1.868 0 102.643 2.642l11-11.002a1.868 1.868 0 000-2.642z" /><path d="M12.25 4.25a.75.75 0 00-1.5 0v3.5a.75.75 0 00.75.75h3.5a.75.75 0 000-1.5h-2.75V4.25z" /></svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                </button>
                 <button onClick={handleShareClick} title="Copy generation data" className="p-2 rounded-full bg-gray-800/80 text-gray-300 hover:bg-purple-600">
                    {shareStatus === 'copied' ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 4.5a2.5 2.5 0 11.702 4.285A.75.75 0 0113 8.25a.75.75 0 01-.702-.535A2.5 2.5 0 0113 4.5zM3.25 9.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM5.5 12a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM8.25 14.5a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM11 15.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM13.75 14.5a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM16.5 12a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM17.25 9.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" /></svg>
                    )}
                </button>
                {result.type === 'image' && (
                    <>
                        <button onClick={() => characterCreation.createCharacter(result.dataUrl, result.sourceExpression || 'New Character')} disabled={isCreatingCharacter} title="Save as Character" className="p-2 rounded-full bg-gray-800/80 text-gray-300 hover:bg-purple-600 disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.5 5.5 0 00-5.5 5.5A.5.5 0 005 18h10a.5.5 0 00.5-.5A5.5 5.5 0 0010 12z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => characterCreation.transferStickerToWallpaper(result)} disabled={isCreatingCharacter} title="Use in Wallpaper" className="p-2 rounded-full bg-gray-800/80 text-gray-300 hover:bg-teal-600 disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13.5A1.5 1.5 0 017 12h6a1.5 1.5 0 010 3H7a1.5 1.5 0 01-1.5-1.5z" /><path fillRule="evenodd" d="M1.5 6.5a.5.5 0 01.5-.5h16a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5v-7zM2 7v6h16V7H2z" clipRule="evenodd" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

/**
 * Extracts a percentage value from a loading message string.
 * @param {string} message - The loading message (e.g., "Generating... 50% complete").
 * @returns {number | null} The extracted percentage, or null if not found.
 */
const extractProgress = (message: string): number | null => {
    const match = message.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : null;
};


/**
 * @component StickerPreview
 * @description The main component for the preview panel. It's a high-level router that decides
 * what to display based on the application mode and state (loading, error, results, etc.).
 * @param {object} props - Component props.
 */
export const StickerPreview: React.FC<{
    results: GeneratedResult[];
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    onClearError: () => void;
    characterCreation: ReturnType<typeof useCharacterCreation>;
    onImageClick: (startIndex: number) => void;
}> = ({ results, isLoading, loadingMessage, error, onClearError, characterCreation, onImageClick }) => {
    const { state, dispatch } = useAppContext();
    const { appMode, remixState } = state;

    /**
     * Handles the download action for the Photo Remix result.
     * It constructs a temporary `GeneratedResult` object on the fly to use
     * the existing `downloadResult` utility function, ensuring consistent naming conventions.
     */
    const handleRemixDownload = () => {
        if (remixState.finalImage) {
            downloadResult({
                id: crypto.randomUUID(),
                dataUrl: remixState.finalImage,
                type: 'image',
                prompt: `PHOTO REMIX:\nBackground: ${remixState.backgroundPrompt}\nForeground: ${remixState.foregroundPrompt || 'None'}`,
                settings: {},
            });
        }
    };
    
    // --- PHOTO REMIX UI ---
    // This block renders a completely different UI for the preview panel when the app is in 'remix' mode.
    // It provides a dedicated "Before and After" view which is more appropriate for this feature.
    if (appMode === 'remix') {
        // A flag to determine if there's any content to show (an original image, a loading state, or an error).
        const hasRemixContent = remixState.originalImage || isLoading || error;

        return (
            <div className="bg-gray-800/50 backdrop-blur-sm h-full rounded-lg flex flex-col border border-gray-700/50">
                 {/* Initial empty state before any image is uploaded. */}
                 {!hasRemixContent ? (
                     <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                        <AiCore isProcessing={false} />
                        <p className="mt-4 text-sm text-white font-semibold">Ready to create some magic!</p>
                        <p className="text-xs text-gray-400 mt-1">Upload a photo and describe your remix.</p>
                     </div>
                 // Error state if any part of the process fails.
                 ) : error ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-6 max-w-md">
                            <h3 className="text-lg font-bold text-red-200">Generation Failed</h3>
                            <p className="text-sm text-red-200/80 mt-2">{error}</p>
                            <button onClick={onClearError} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                OK
                            </button>
                        </div>
                    </div>
                 // The main "Before and After" display.
                 ) : (
                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-y-auto">
                        {/* "BEFORE" PANEL: Displays the original user-uploaded image. */}
                        <div className="flex flex-col gap-2">
                             <h4 className="font-semibold text-center text-gray-300">Before</h4>
                             <div className="flex-grow bg-gray-900/50 rounded-lg p-2 flex items-center justify-center min-h-[200px]">
                                 {remixState.originalImage ? (
                                     <img src={remixState.originalImage} alt="Before: Original user-uploaded photo" className="max-w-full max-h-full object-contain rounded-md" />
                                 ) : (
                                     <p className="text-sm text-gray-500">Original photo appears here</p>
                                 )}
                             </div>
                        </div>
                        {/* "AFTER" PANEL: Conditionally renders the final image, loading state, or a placeholder. */}
                        <div className="flex flex-col gap-2">
                             <h4 className="font-semibold text-center text-gray-300">After</h4>
                             <div className="flex-grow bg-gray-900/50 rounded-lg p-2 flex items-center justify-center min-h-[200px] relative group">
                                {remixState.finalImage ? (
                                    <>
                                        {/* Display the final remixed image. */}
                                        <img 
                                            src={remixState.finalImage} 
                                            alt="After: The final remixed image" 
                                            className="max-w-full max-h-full object-contain rounded-md" 
                                            draggable
                                            onDragStart={(e) => {
                                                const result: GeneratedResult = {
                                                    id: crypto.randomUUID(),
                                                    dataUrl: remixState.finalImage!,
                                                    type: 'image',
                                                    prompt: `PHOTO REMIX:\nBackground: ${remixState.backgroundPrompt}\nForeground: ${remixState.foregroundPrompt || 'None'}`,
                                                    settings: {},
                                                };
                                                e.dataTransfer.setData(DRAG_AND_DROP_TYPE, JSON.stringify(result));
                                                e.dataTransfer.effectAllowed = 'move';
                                            }}
                                        />
                                        {/* Show the download button on hover for a clean UI. */}
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={handleRemixDownload} title="Download Image" className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </>
                                 ) : isLoading ? (
                                     // Display the loading core and message while generating.
                                     <div className="text-center">
                                        <AiCore isProcessing={true} className="w-32 h-32" />
                                        <p className="mt-2 text-xs text-white font-semibold">{loadingMessage}</p>
                                    </div>
                                 ) : (
                                    // Display a placeholder before generation starts.
                                    <p className="text-sm text-gray-500">Your remixed image will appear here.</p>
                                 )}
                             </div>
                        </div>
                    </div>
                 )}
            </div>
        );
    }
    
    // --- ORIGINAL STICKER & WALLPAPER PREVIEW UI ---
    // This is the default view for the sticker and wallpaper creation modes.
    const progress = extractProgress(loadingMessage);

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm h-full rounded-lg flex flex-col border border-gray-700/50">
            {isLoading || error || results.length === 0 ? (
                // This block handles the empty, loading, and error states for the main grid view.
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                    {error ? (
                        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-6 max-w-md">
                            <h3 className="text-lg font-bold text-red-200">Generation Failed</h3>
                            <p className="text-sm text-red-200/80 mt-2">{error}</p>
                            <button onClick={onClearError} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                OK
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center max-w-md w-full px-4">
                            <AiCore isProcessing={true} />
                            {progress !== null ? (
                                <div className="mt-6">
                                    <div className="text-sm font-semibold text-purple-300 mb-2">
                                        {loadingMessage}
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                 <p className="mt-4 text-sm text-white font-semibold">{loadingMessage || 'Ready to create some magic!'}</p>
                                 <p className="text-xs text-gray-400 mt-1">This may take a moment...</p>
                                </>
                            )}
                        </div>
                     ) : (
                         <>
                           <AiCore isProcessing={false} />
                           <p className="mt-4 text-sm text-white font-semibold">Ready to create some magic!</p>
                           <p className="text-xs text-gray-400 mt-1">
                                {appMode === 'wallpapers' 
                                    ? 'Configure your wallpaper and click Generate.' 
                                    : 'Configure your sticker and click Generate.'}
                           </p>
                        </>
                    )}
                </div>
            ) : (
                 // This block displays the grid of generated results.
                 <div className="flex-grow flex flex-col min-h-0">
                    <div className="flex-grow overflow-y-auto p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {results.map((result, index) => (
                               <ResultCard key={result.id} result={result} characterCreation={characterCreation} onClick={() => onImageClick(index)} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};