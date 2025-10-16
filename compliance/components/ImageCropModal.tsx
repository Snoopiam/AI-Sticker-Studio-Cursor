/**
 * @file components/ImageCropModal.tsx
 * @description A modal component that allows users to crop an uploaded image. It supports
 * selecting from AI-detected subjects or manually adjusting a square crop area.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { DetectedSubject } from '../../types/types';
import { useCachedImage } from '../../context/AppContext';
import { MIN_CROP_SIZE_PX } from '../../constants';

/**
 * @interface ImageCropModalProps
 * @description Defines the props for the ImageCropModal component.
 */
interface ImageCropModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageId: string;
    subjects: DetectedSubject[];
    onCropComplete: (croppedImage: string) => void;
}

/**
 * @interface Crop
 * @description Defines the structure for the crop area, using coordinates in pixels relative to the displayed image.
 */
interface Crop {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * @component ImageCropModal
 * @description The main component for the image cropping modal. It manages all the logic
 * for displaying the image, handling user interactions for cropping, and applying the final crop.
 */
export const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, imageId, subjects, onCropComplete }) => {
    const src = useCachedImage(imageId);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [crop, setCrop] = useState<Crop | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const cropStartPoint = useRef({ x: 0, y: 0 });

    const selectSubject = useCallback((subject: DetectedSubject) => {
        if (!imageRef.current) return;
        const { clientWidth, clientHeight } = imageRef.current;
        const [y1, x1, y2, x2] = subject.boundingBox;
        setCrop({
            x: x1 * clientWidth,
            y: y1 * clientHeight,
            width: (x2 - x1) * clientWidth,
            height: (y2 - y1) * clientHeight,
        });
    }, []);

    const handleApplyCrop = useCallback(() => {
        if (!crop || !imageRef.current) return;

        const image = imageRef.current;
        const scaleX = image.naturalWidth / image.clientWidth;
        const scaleY = image.naturalHeight / image.clientHeight;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(crop.width * scaleX);
        canvas.height = Math.round(crop.height * scaleY);
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.drawImage(
            image,
            Math.round(crop.x * scaleX),
            Math.round(crop.y * scaleY),
            Math.round(crop.width * scaleX),
            Math.round(crop.height * scaleY),
            0,
            0,
            canvas.width,
            canvas.height
        );

        onCropComplete(canvas.toDataURL('image/png'));
        onClose();
    }, [crop, onCropComplete, onClose]);

    const getMousePos = (e: React.MouseEvent) => {
        const rect = imageRef.current!.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const pos = getMousePos(e);
        cropStartPoint.current = pos;
        setIsCropping(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isCropping) return;
        e.preventDefault();
        const currentPos = getMousePos(e);
        const startPos = cropStartPoint.current;

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(startPos.x - currentPos.x);
        const height = Math.abs(startPos.y - currentPos.y);
        
        setCrop({ x, y, width, height });
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isCropping) return;
        setIsCropping(false);
        if (crop && (crop.width < MIN_CROP_SIZE_PX || crop.height < MIN_CROP_SIZE_PX)) {
            setCrop(null); // Discard tiny crops
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setCrop(null);
            setIsCropping(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
                    <h2 className="text-xl font-bold text-white font-heading">Crop Image for Calibration</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="flex-grow flex p-4 gap-4 min-h-0">
                    <div className="flex-1 bg-gray-950 rounded-lg flex items-center justify-center relative overflow-hidden" ref={containerRef}>
                        {src ? (
                            <div 
                                className="relative cursor-crosshair"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <img ref={imageRef} src={src} alt="Image to crop for calibration" className="max-w-full max-h-full object-contain select-none" style={{ maxHeight: 'calc(80vh - 150px)' }} />
                                {crop && <div className="absolute border-2 border-dashed border-purple-400 bg-purple-500/20" style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, pointerEvents: 'none' }} />}
                            </div>
                        ) : (
                            <p className="text-gray-400 animate-pulse">Loading image...</p>
                        )}
                    </div>
                    <div className="w-64 flex-shrink-0 flex flex-col gap-4">
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                             <h3 className="font-semibold text-gray-200">Detected Subjects</h3>
                            {subjects.length > 0 ? subjects.map(subject => (
                                <button key={subject.id} onClick={() => selectSubject(subject)} className="w-full text-sm p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-left transition-colors">{subject.description}</button>
                            )) : (
                                <p className="text-xs text-gray-400">No specific subjects detected. You can draw a crop area manually.</p>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg">
                            <p className="font-semibold text-gray-300 mb-1">How to Crop:</p>
                            <p>Select a detected subject to auto-crop, or click and drag on the image to create a manual selection.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700/50 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                    <button onClick={handleApplyCrop} disabled={!crop} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">Apply Crop</button>
                </div>
            </div>
        </div>
    );
};