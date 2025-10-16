/**
 * @file components/ImageViewerModal.tsx
 * @description A full-screen modal component for viewing generated images and videos.
 * It supports navigation between multiple results and can display metadata about the generation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, WallpaperSettings, WallpaperPreset, ViewerImage } from '../../types/types';
import { WALLPAPER_PRESETS } from '../../constants';
import { downloadResult } from '../../utils/stateManager';

/**
 * @interface ImageViewerModalProps
 * @description Defines the props for the ImageViewerModal component.
 */
interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    images: ViewerImage[];
    startIndex: number;
}

/**
 * @component ImageViewerModal
 * @description The main component for the image viewer. It manages the currently displayed
 * image and handles user interactions for navigation and metadata display.
 */
export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, images, startIndex }) => {
    // Local state to track the currently viewed image index and metadata visibility.
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    const [showMetadata, setShowMetadata] = useState(false);

    /**
     * Navigates to the next image in the list, wrapping around to the beginning if at the end.
     */
    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    /**
     * Navigates to the previous image in the list, wrapping around to the end if at the beginning.
     */
    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Effect to add keyboard shortcuts (left/right arrows, escape) when the modal is open.
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowRight') handleNext();
                if (e.key === 'ArrowLeft') handlePrev();
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleNext, handlePrev, onClose]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];
    const settings = currentImage.settings;
    
    /**
     * Initiates a download of the currently viewed image.
     */
    const handleDownload = () => {
        downloadResult(currentImage);
    };

    /**
     * Retrieves the name of a wallpaper preset from its ID.
     * @param {string | null} presetId - The ID of the preset.
     * @returns {string} The name of the preset or 'N/A'.
     */
    const getPresetName = (presetId: string | null): string => {
        if (!presetId) return 'N/A';
        return WALLPAPER_PRESETS.find(p => p.id === presetId)?.name || 'Unknown Preset';
    };

    /**
     * @component MetadataDisplay
     * @description A sub-component that renders the generation settings for the current image.
     * It conditionally formats the output based on whether the image is a wallpaper or a sticker.
     */
    const MetadataDisplay = () => {
        if (!settings) {
            return (
                <div className={`absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-xs transition-transform duration-300 ${showMetadata ? 'translate-y-0' : 'translate-y-full'}`}>
                    <p>No metadata available for this image.</p>
                </div>
            );
        }
        return (
            <div className={`absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 text-xs transition-transform duration-300 ${showMetadata ? 'translate-y-0' : 'translate-y-full'}`}>
                <h4 className="font-bold text-sm mb-2">Generation Details</h4>
                {currentImage.type === 'wallpaper' ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Preset:</span><span>{getPresetName((settings as WallpaperSettings).selectedPresetId)}</span>
                        <span>Size:</span><span>{(settings as WallpaperSettings).size.name}</span>
                        <span>Quality:</span><span>{(settings as WallpaperSettings).qualityLevel}</span>
                        <span>Blending:</span><span>{(settings as WallpaperSettings).blendingMode}</span>
                        <span>Lighting:</span><span>{(settings as WallpaperSettings).lightingStyle}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span>Mode:</span><span>{(settings as Settings).mode}</span>
                        <span>Style:</span><span>{(settings as Settings).style}</span>
                        <span>Palette:</span><span>{(settings as Settings).palette}</span>
                        <span>Composition:</span><span>{(settings as Settings).composition}</span>
                        <span>Pose:</span><span>{(settings as Settings).selectedExpressions.join(', ')}</span>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                {/* Image/Video Display */}
                <div className="max-w-full max-h-full flex items-center justify-center">
                    {currentImage.type === 'video' ? (
                        <video src={currentImage.dataUrl} controls autoPlay loop className="max-w-full max-h-[90vh] object-contain" />
                    ) : (
                        <img src={currentImage.dataUrl} alt={currentImage.sourceExpression ? `Generated sticker: ${currentImage.sourceExpression}` : `Generated ${currentImage.type || 'image'} result ${currentIndex + 1}`} className="max-w-full max-h-[90vh] object-contain" />
                    )}
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 bg-gray-800/50 text-white rounded-full p-2 hover:bg-gray-700" aria-label="Close viewer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-800/50 text-white rounded-full p-2 hover:bg-gray-700" aria-label="Previous image">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-800/50 text-white rounded-full p-2 hover:bg-gray-700" aria-label="Next image">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </>
                )}
                
                {/* Bottom Toolbar */}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/50 rounded-lg p-2 flex items-center gap-4">
                     <span className="text-sm text-gray-300">{`${currentIndex + 1} / ${images.length}`}</span>
                     <button onClick={() => setShowMetadata(!showMetadata)} className="p-2 text-white hover:text-purple-400" title="Toggle Metadata">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                     </button>
                     <button onClick={handleDownload} className="p-2 text-white hover:text-purple-400" title="Download">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                     </button>
                 </div>
                 {/* Sliding Metadata Panel */}
                 <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none" style={{height: '200px'}}>
                     <MetadataDisplay />
                 </div>
            </div>
        </div>
    );
};