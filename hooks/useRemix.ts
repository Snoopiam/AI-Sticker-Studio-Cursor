/**
 * @file hooks/useRemix.ts
 * @description This hook encapsulates all logic for the Photo Remix feature. It manages a complex,
 * multi-step workflow that includes image analysis, subject segmentation, foreground and background
 * generation, and final image composition. It also implements a "Divide and Conquer" strategy
 * for handling group photos efficiently.
 */

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { segmentImage, generateBackground, compositeImages, analyzeAndSuggestScenes, remixForeground, detectSubjectsInCutout } from '../utils/services/geminiService';
import { RemixState, DetectedSubject, ConfirmationRequest, GeneratedResult, OperationType, RemixSettings } from '../types/types';
import { CREDIT_COSTS, API_PACING_DELAY_MS } from '../constants';

// --- CANVAS UTILITY FUNCTIONS ---

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const cropImage = async (imageSrc: string, box: number[]): Promise<string> => {
    const image = await loadImage(imageSrc);
    const [y1, x1, y2, x2] = box;
    const sx = x1 * image.naturalWidth;
    const sy = y1 * image.naturalHeight;
    const sWidth = (x2 - x1) * image.naturalWidth;
    const sHeight = (y2 - y1) * image.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = sWidth;
    canvas.height = sHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    return canvas.toDataURL('image/png');
};

const stitchImages = async (pieces: { imageDataUrl: string, box: number[] }[], width: number, height: number): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    for (const piece of pieces) {
        const image = await loadImage(piece.imageDataUrl);
        const [y1, x1, y2, x2] = piece.box;
        const dx = x1 * width;
        const dy = y1 * height;
        const dWidth = (x2 - x1) * width;
        const dHeight = (y2 - y1) * height;
        ctx.drawImage(image, dx, dy, dWidth, dHeight);
    }
    return canvas.toDataURL('image/png');
};


/**
 * @hook useRemix
 * @description Provides a suite of functions to manage the entire Photo Remix workflow, from
 * uploading and analyzing a photo to executing simple or advanced multi-step generation.
 * @returns {object} An object containing all remix-related functions.
 */
export const useRemix = () => {
    const { state, dispatch } = useAppContext();
    const { credits, isLoading, remixState } = state;
    const { originalImage, cutoutImage, remixedCutoutImage, generatedBackground, backgroundPrompt, foregroundPrompt, isGroupPhoto } = remixState;

    const uploadAndAnalyze = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            dispatch({ type: 'GENERATION_ERROR', payload: 'Please upload an image file.' });
            return;
        }
        
        dispatch({ type: 'CLEAR_REMIX_STATE' });
        dispatch({ type: 'START_GENERATION', payload: 'Uploading photo...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Remix: Uploading photo...' } });

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target?.result as string;
            dispatch({ type: 'SET_REMIX_STATE', payload: { originalImage: base64Image } });
            
            try {
                // STEP 1: Critical segmentation (must succeed)
                dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Analyzing photo and removing background...' });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Remix: Segmenting image...' } });
                const cutoutDataUrl = await segmentImage(base64Image);
                dispatch({ type: 'SET_REMIX_STATE', payload: { cutoutImage: cutoutDataUrl } });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Remix: Background removed successfully.' } });
                
                // STEP 2: Non-critical AI suggestions (can fail gracefully)
                dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Generating creative scene ideas...' });
                try {
                    const suggestions = await analyzeAndSuggestScenes(base64Image);
                    dispatch({ type: 'SET_REMIX_STATE', payload: { sceneSuggestions: suggestions } });
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Remix: Scene suggestions generated.' } });
                } catch (suggestionError: any) {
                    // Log the error but don't fail the entire upload
                    console.warn('Scene suggestions failed, but upload continues:', suggestionError);
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { 
                        type: 'info', 
                        message: 'Remix: Scene suggestions unavailable (you can still create your own prompts).' 
                    } });
                    dispatch({ type: 'SET_REMIX_STATE', payload: { sceneSuggestions: [] } });
                }
                
                dispatch({ type: 'FINISH_GENERATION' });

            } catch (error: any) {
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: `Remix: Photo analysis failed: ${error.message}` } });
                dispatch({ type: 'GENERATION_ERROR', payload: `Photo analysis failed: ${error.message}` });
            }
        };
        reader.readAsDataURL(file);
    }, [dispatch]);


    const executeGroupPhotoRemix = useCallback(async (subjects: DetectedSubject[], cost: number) => {
        if (!cutoutImage || !originalImage) return;

        const startTime = Date.now();
        const operationType: OperationType = 'remix';
        const prompt = `Group Remix:\nBG: ${backgroundPrompt}\nFG: ${foregroundPrompt}`;

        dispatch({ type: 'START_GENERATION', payload: `Starting Group Remix...` });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Remix: Starting group photo remix.' } });
        dispatch({ type: 'SET_REMIX_STATE', payload: { finalImage: null, remixedCutoutImage: null, generatedBackground: null }});
        
        try {
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Group photo remix', metadata: { subjects: subjects.length } } });

            const originalCutoutImage = await loadImage(cutoutImage);
            const { naturalWidth, naturalHeight } = originalCutoutImage;
            
            const backgroundPromise = generateBackground(backgroundPrompt, originalImage);

            const foregroundPromise = (async () => {
                let finalCutoutResult = cutoutImage;
                if (foregroundPrompt.trim()) {
                    const cropPromises = subjects.map(subject => cropImage(cutoutImage, subject.boundingBox));
                    const croppedImages = await Promise.all(cropPromises);
                    const remixedPieces: { imageDataUrl: string, box: number[] }[] = [];
                    for (let i = 0; i < croppedImages.length; i++) {
                        if (i > 0) await new Promise(resolve => setTimeout(resolve, API_PACING_DELAY_MS));
                        dispatch({ type: 'SET_LOADING_MESSAGE', payload: `Remixing subject ${i + 1} of ${subjects.length}...` });
                        const remixedData = await remixForeground(croppedImages[i], foregroundPrompt.trim());
                        remixedPieces.push({ imageDataUrl: remixedData, box: subjects[i].boundingBox });
                    }
                    dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Re-assembling group...' });
                    finalCutoutResult = await stitchImages(remixedPieces, naturalWidth, naturalHeight);
                }
                return finalCutoutResult;
            })();

            const [finalCutoutResult, backgroundDataUrl] = await Promise.all([foregroundPromise, backgroundPromise]);

            dispatch({ type: 'SET_REMIX_STATE', payload: { remixedCutoutImage: finalCutoutResult, generatedBackground: backgroundDataUrl }});

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Compositing final image...' });
            const compositeDataUrl = await compositeImages([finalCutoutResult], backgroundDataUrl, state.wallpaperSettings);
            
            dispatch({ type: 'SET_REMIX_STATE', payload: { finalImage: compositeDataUrl }});
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Remix: Group photo generated successfully.' } });
            
            const result: GeneratedResult = {
                id: crypto.randomUUID(),
                type: 'image',
                dataUrl: compositeDataUrl,
                prompt,
                settings: { backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost,
                operationType,
                generationTimeMs: Date.now() - startTime,
                success: true,
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [result] });
            dispatch({ type: 'FINISH_GENERATION' });

        } catch (error: any) {
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: `Remix: Group photo generation failed.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: `Group Remix failed: ${error.message}` });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed group remix refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Refunded ${cost} credits for failed remix.` } });

            const failureResult: GeneratedResult = {
                id: crypto.randomUUID(), type: 'image', dataUrl: '', prompt,
                settings: { backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost, operationType,
                generationTimeMs: Date.now() - startTime,
                success: false, errorMessage: error.message || 'Group remix failed.',
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [failureResult] });
        }
    }, [dispatch, cutoutImage, originalImage, backgroundPrompt, foregroundPrompt, state.wallpaperSettings]);


    const executeSingleSubjectRemix = useCallback(async () => {
        if (!cutoutImage || !originalImage) return;
        
        const startTime = Date.now();
        const cost = CREDIT_COSTS.REMIX_SINGLE_SUBJECT;
        const operationType: OperationType = 'remix';
        const prompt = `Single Remix:\nBG: ${backgroundPrompt}\nFG: ${foregroundPrompt}`;

        dispatch({ type: 'START_GENERATION', payload: 'Starting Photo Remix...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Remix: Starting single subject remix.' } });
        dispatch({ type: 'SET_REMIX_STATE', payload: { finalImage: null, remixedCutoutImage: null, generatedBackground: null }});
        
        try {
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Single subject photo remix' } });

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Remixing subjects & generating background...' });
            const foregroundPromise = foregroundPrompt.trim() ? remixForeground(cutoutImage, foregroundPrompt.trim()) : Promise.resolve(cutoutImage);
            const backgroundPromise = generateBackground(backgroundPrompt, originalImage);
            
            const [finalCutoutResult, backgroundDataUrl] = await Promise.all([foregroundPromise, backgroundPromise]);
            
            const stateUpdate: Partial<RemixState> = { generatedBackground: backgroundDataUrl };
            if (foregroundPrompt.trim()) stateUpdate.remixedCutoutImage = finalCutoutResult;
            dispatch({ type: 'SET_REMIX_STATE', payload: stateUpdate });

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Compositing final image...' });
            const compositeDataUrl = await compositeImages([finalCutoutResult], backgroundDataUrl, state.wallpaperSettings);
            
            dispatch({ type: 'SET_REMIX_STATE', payload: { finalImage: compositeDataUrl }});
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Remix: Photo generated successfully.' } });

            const result: GeneratedResult = {
                id: crypto.randomUUID(), type: 'image', dataUrl: compositeDataUrl, prompt,
                settings: { backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost, operationType,
                generationTimeMs: Date.now() - startTime,
                success: true,
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [result] });
            dispatch({ type: 'FINISH_GENERATION' });
        } catch (error: any) {
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: `Remix: Photo generation failed.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: `Remix failed: ${error.message}` });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed single remix refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Refunded ${cost} credits for failed remix.` } });

             const failureResult: GeneratedResult = {
                id: crypto.randomUUID(), type: 'image', dataUrl: '', prompt,
                settings: { backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost, operationType,
                generationTimeMs: Date.now() - startTime,
                success: false, errorMessage: error.message || 'Single remix failed.',
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [failureResult] });
        }
    }, [dispatch, cutoutImage, originalImage, backgroundPrompt, foregroundPrompt, state.wallpaperSettings]);


    const initiateSimpleGenerate = useCallback(async () => {
        if (!cutoutImage || !backgroundPrompt.trim() || isLoading) return;

        if (isGroupPhoto) {
            dispatch({ type: 'START_GENERATION', payload: 'Analyzing subjects to calculate cost...' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Remix: Analyzing group photo subjects...' } });
            try {
                let subjects: DetectedSubject[];
                if (remixState.detectedSubjects) {
                    subjects = remixState.detectedSubjects;
                    dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Using cached subject analysis...' });
                } else {
                    subjects = await detectSubjectsInCutout(cutoutImage);
                    dispatch({ type: 'SET_REMIX_STATE', payload: { detectedSubjects: subjects }});
                }

                if (subjects.length === 0) throw new Error("No subjects were detected for group processing.");
                
                const numSubjects = subjects.length;
                const cost = CREDIT_COSTS.REMIX_GROUP_BASE + (foregroundPrompt.trim() ? numSubjects * CREDIT_COSTS.REMIX_STEP_REMIX : 0) + CREDIT_COSTS.REMIX_STEP_BACKGROUND + CREDIT_COSTS.REMIX_STEP_COMPOSITE;
                
                if (credits < cost) {
                    dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. This group photo with ${numSubjects} people requires ${cost} credits.` });
                    return;
                }
                
                const request: ConfirmationRequest = {
                    title: 'Confirm Group Photo Remix',
                    message: `This photo contains ${numSubjects} ${numSubjects === 1 ? 'person' : 'people'}. The high-fidelity remix will be a multi-step process.`,
                    cost,
                    actionType: 'generate-remix-group',
                    context: { subjects, cost }
                };
                dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
                dispatch({ type: 'FINISH_GENERATION' });
                
            } catch (error: any) {
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: `Remix: Group analysis failed.` } });
                dispatch({ type: 'GENERATION_ERROR', payload: `Group analysis failed: ${error.message}` });
            }
        } else {
            const cost = CREDIT_COSTS.REMIX_SINGLE_SUBJECT;
            if (credits < cost) {
                dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. Remixing a photo costs ${cost} credits.` });
                return;
            }
            const request: ConfirmationRequest = {
                title: 'Confirm Photo Remix',
                message: 'This will start the full remix process.',
                cost,
                actionType: 'generate-remix-single',
            };
            dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
        }
    }, [dispatch, credits, isLoading, cutoutImage, backgroundPrompt, foregroundPrompt, isGroupPhoto, remixState.detectedSubjects]);

    const executeAdvancedRemixStep = useCallback(async (step: 'remix' | 'background' | 'composite') => {
        const costs = { remix: CREDIT_COSTS.REMIX_STEP_REMIX, background: CREDIT_COSTS.REMIX_STEP_BACKGROUND, composite: CREDIT_COSTS.REMIX_STEP_COMPOSITE };
        const cost = costs[step];
        if (credits < cost) {
            dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. This step costs ${cost}.` });
            return;
        }
        
        const startTime = Date.now();
        const operationType: OperationType = 'remix';
        const prompt = `Advanced Remix Step: ${step}`;
        
        const loadingMessages = {
            remix: 'Remixing subjects...',
            background: 'Generating background...',
            composite: 'Compositing image...',
        };

        dispatch({ type: 'START_GENERATION', payload: loadingMessages[step] });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: `Advanced remix step: ${step}` } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Remix: Step '${step}' cost: -${cost} credit.` } });

        try {
            let resultDataUrl = '';
            if (step === 'remix') {
                if (!foregroundPrompt.trim() || !cutoutImage) throw new Error("Missing prompt or cutout image for remix step.");
                resultDataUrl = await remixForeground(cutoutImage, foregroundPrompt.trim());
                dispatch({ type: 'SET_REMIX_STATE', payload: { remixedCutoutImage: resultDataUrl } });
            } else if (step === 'background') {
                if (!backgroundPrompt.trim() || !originalImage) throw new Error("Missing prompt or original image for background step.");
                resultDataUrl = await generateBackground(backgroundPrompt, originalImage);
                dispatch({ type: 'SET_REMIX_STATE', payload: { generatedBackground: resultDataUrl } });
            } else if (step === 'composite') {
                const finalCutout = remixedCutoutImage || cutoutImage;
                if (!finalCutout || !generatedBackground) throw new Error("Missing images for composite step.");
                resultDataUrl = await compositeImages([finalCutout], generatedBackground, state.wallpaperSettings);
                dispatch({ type: 'SET_REMIX_STATE', payload: { finalImage: resultDataUrl } });
            }

            const result: GeneratedResult = {
                id: crypto.randomUUID(), type: 'image', dataUrl: resultDataUrl, prompt,
                settings: { step, backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost, operationType,
                generationTimeMs: Date.now() - startTime,
                success: true,
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [result] });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Remix: Step '${step}' completed.` } });
            dispatch({ type: 'FINISH_GENERATION' });
        } catch (error: any) {
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: `Remix: Step '${step}' failed.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: `Remix step failed: ${error.message}` });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: `Failed remix step refund: ${step}` } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Refunded ${cost} credits.` } });
            
            const failureResult: GeneratedResult = {
                id: crypto.randomUUID(), type: 'image', dataUrl: '', prompt,
                settings: { step, backgroundPrompt, foregroundPrompt } as RemixSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost, operationType,
                generationTimeMs: Date.now() - startTime,
                success: false, errorMessage: error.message || `Advanced remix step '${step}' failed.`,
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [failureResult] });
        }
    }, [dispatch, credits, originalImage, cutoutImage, remixedCutoutImage, generatedBackground, backgroundPrompt, foregroundPrompt, state.wallpaperSettings]);

    return { uploadAndAnalyze, initiateSimpleGenerate, executeSingleSubjectRemix, executeGroupPhotoRemix, executeAdvancedRemixStep };
};