/**
 * @file hooks/useImageUpload.ts
 * @description This hook manages the entire image upload and pre-processing workflow.
 * It handles the initial upload, calls the Gemini service for pre-analysis (subject detection and quality checks),
 * and manages the subsequent cropping and enhancement steps. It's a critical part of the image-to-image pipeline.
 */

import React, { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { imageCache } from '../utils/services/imageCache';
import { preAnalyzeImage } from '../utils/services/geminiService';
import { compressImage } from '../utils/imageCompression';

/**
 * @hook useImageUpload
 * @description Provides memoized functions to handle image uploads and the results of the cropping modal.
 * This hook is consumed by the main workflow components (`StickerStudioWorkflow`, `WallpaperStudioWorkflow`, etc.).
 * @returns {object} An object containing the `uploadImage`, `cropComplete`, and `handlePaste` functions.
 */
export const useImageUpload = () => {
    const { dispatch } = useAppContext();

    /**
     * @function uploadImage
     * @description Handles the initial upload of an image. It orchestrates a two-stage process:
     * 1. Stores the original, high-resolution image in the cache for high-quality cropping.
     * 2. Compresses the image and sends the smaller version to the AI for a faster, more efficient pre-analysis.
     * After analysis, it opens the cropping modal, passing the ID of the original high-res image.
     * @param {string} base64 - The base64 data URL of the uploaded image.
     */
    const uploadImage = useCallback(async (base64: string) => {
        dispatch({ type: 'START_PRE_ANALYSIS' });
        dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Pre-analyzing uploaded image...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Pre-analyzing uploaded image...' } });
        try {
            const imageId = crypto.randomUUID();
            // 1. Store the original, full-resolution image for the crop step.
            await imageCache.store(imageId, base64);
            
            // 2. Compress the image for a faster, more efficient pre-analysis.
            const compressedBase64 = await compressImage(base64, 1024, 0.85);

            // 3. Send the compressed image for analysis.
            const analysis = await preAnalyzeImage(compressedBase64);
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Image analysis complete. Ready to crop.' } });
            
            // 4. Open the crop modal with the ID of the ORIGINAL high-res image.
            dispatch({ type: 'OPEN_CROP_MODAL', payload: { id: imageId, subjects: analysis.subjects }});
            
            // 5. Handle any quality warnings from the AI or if no subjects were detected.
            let warning = analysis.qualityWarning;
            if (analysis.subjects.length === 0 && !warning) {
                warning = "Could not detect a character in the image.|Upload a photo that clearly shows a person's face.|Ensure the face is a prominent part of the image.";
            }

            if (warning) {
                dispatch({ type: 'SET_CALIBRATION_WARNING', payload: warning });
            }
        } catch(e: any) {
            const errorMessage = e.message || 'Image analysis failed.';
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: errorMessage } });
            dispatch({ type: 'GENERATION_ERROR', payload: errorMessage });
        }
    }, [dispatch]);

    /**
     * @function cropComplete
     * @description A callback function that is triggered when the user confirms a crop in the `ImageCropModal`.
     * It stores the new cropped image data in the cache, updates the application state to use this new image,
     * and then dispatches an action to trigger the automatic calibration workflow.
     * @param {string} croppedImage - The base64 data URL of the newly cropped image.
     */
    const cropComplete = useCallback(async (croppedImage: string) => {
        const imageId = crypto.randomUUID();
        await imageCache.store(imageId, croppedImage);
        dispatch({ type: 'APPLY_CROP', payload: imageId });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Image cropped successfully.' } });
        
        // Trigger the automatic calibration process on the newly cropped image.
        dispatch({ type: 'TRIGGER_AUTO_CALIBRATION' });
    }, [dispatch]);

    /**
     * @function handlePaste
     * @description Handles pasting an image from the clipboard into the application. It finds the first
     * image item in the clipboard data and processes it using the `uploadImage` function.
     * @param {React.ClipboardEvent} e - The paste event from the browser.
     */
    const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image')) {
                const file = items[i].getAsFile();
                if (file) {
                    e.preventDefault();
                    
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        uploadImage(event.target!.result as string);
                    };
                    reader.readAsDataURL(file);
                    
                    return; // Stop after handling the first image found.
                }
            }
        }
    }, [uploadImage]);

    return { uploadImage, cropComplete, handlePaste };
};