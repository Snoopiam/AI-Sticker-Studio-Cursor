/**
 * @file components/UploadSection.tsx
 * @description Component for handling photo upload in the Photo Remix workflow.
 * Includes drag & drop, paste functionality, and group photo toggle.
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useImageInputHandler } from '../../hooks/useImageInputHandler';
import { useRemix } from '../../hooks/useRemix';
import { CREDIT_COSTS, DRAG_AND_DROP_TYPE } from '../../constants';
import { RemixState, GeneratedResult } from '../../types/types';
import { AiCore } from './StickerPreview';

/**
 * @interface UploadSectionProps
 * @description Props for the UploadSection component.
 */
interface UploadSectionProps {
    /** The current remix state containing image data */
    remixState: RemixState;
    /** Whether the app is currently loading */
    isLoading: boolean;
    /** Callback when an image is loaded */
    onImageLoaded: (base64: string) => void;
    /** Callback for handling collection drops */
    onCollectionDrop: (e: React.DragEvent) => void;
}

/**
 * @component UploadSection
 * @description Handles the photo upload section of the Photo Remix workflow.
 */
const UploadSection: React.FC<UploadSectionProps> = ({ 
    remixState, 
    isLoading, 
    onImageLoaded, 
    onCollectionDrop 
}) => {
    const { dispatch } = useAppContext();
    const { originalImage, cutoutImage, isGroupPhoto } = remixState;

    const imageInput = useImageInputHandler({
        onImageLoaded,
        onError: (e) => dispatch({ type: 'GENERATION_ERROR', payload: e.message }),
    });

    return (
        <div className="py-4 border-b border-gray-700/50 px-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-heading">1. Upload Your Photo</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="isGroup-toggle" className="text-sm font-medium text-gray-300 cursor-pointer">Group Photo?</label>
                    <button
                        id="isGroup-toggle"
                        role="switch"
                        aria-checked={isGroupPhoto}
                        onClick={() => dispatch({ type: 'SET_REMIX_STATE', payload: { isGroupPhoto: !isGroupPhoto } })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${isGroupPhoto ? 'bg-purple-600' : 'bg-gray-600'}`}>
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isGroupPhoto ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <div
                    data-tour-id="remix-upload-area"
                    onClick={isLoading || imageInput.isProcessing ? undefined : imageInput.handleClick}
                    onDragOver={isLoading || imageInput.isProcessing ? undefined : imageInput.handleDragOver}
                    onDragLeave={isLoading || imageInput.isProcessing ? undefined : imageInput.handleDragLeave}
                    onDrop={(e) => {
                        if (isLoading || imageInput.isProcessing) return;
                        if (e.dataTransfer.types.includes(DRAG_AND_DROP_TYPE)) {
                            onCollectionDrop(e);
                        } else {
                            imageInput.handleDrop(e);
                        }
                    }}
                    className={`relative flex items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors min-h-[150px] ${(isLoading || imageInput.isProcessing) ? 'cursor-not-allowed bg-gray-700/50' : 'cursor-pointer'} ${imageInput.isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                >
                    <input ref={imageInput.fileInputRef} type="file" onChange={imageInput.handleFileChange} accept="image/*,.heic,.heif" className="hidden" disabled={isLoading || imageInput.isProcessing}/>
                    {isLoading || imageInput.isProcessing ? (
                        <AiCore isProcessing={true} className="w-24 h-24" />
                    ) : originalImage ? (
                        <div className="flex gap-4 items-center">
                            <img src={originalImage} alt="Original uploaded photo" className="max-h-32 rounded-md" />
                            {cutoutImage && <img src={cutoutImage} alt="AI-generated cutout of subjects" className="max-h-32 rounded-md bg-transparent" style={{backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)', backgroundSize: '16px 16px' }} />}
                        </div>
                    ) : (
                        <div className="text-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <p className="mt-2 text-sm text-gray-200 font-semibold">Click, Paste, or Drag & Drop</p>
                            <p className="text-xs text-gray-400">The AI will automatically cut out the main subjects.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadSection;
