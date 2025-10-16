/**
 * @file hooks/useGeneration.ts
 * @description This hook encapsulates all the logic for initiating and executing sticker and wallpaper
 * generation tasks. It handles building the generation request, managing costs, and dispatching
 * actions for the entire generation lifecycle.
 */

import { useCallback, useRef, useEffect } from 'react';
import { Modality } from '@google/genai';
import { useAppContext } from '../context/AppContext';
import { imageCache } from '../utils/services/imageCache';
import { 
    generateAnimatedSticker as genAnimatedSticker, 
    generateStaticStickers, 
    generateWallpaper as genWallpaper, 
    segmentImage,
    generateUnifiedWallpaperScene,
    base64ToPart
} from '../utils/services/geminiService';
import { generateStickerPack } from '../utils/services/identityPreservation';
import type { ValidationResult, OperationType } from '../types/types';
import { EXPRESSIONS, CREDIT_COSTS, TRANSPARENT_PIXEL } from '../constants';
import { Expression, ConfirmationRequest, LogEntryType, GeneratedResult } from '../types/types';

/**
 * @hook useGeneration
 * @description Provides functions to initiate and execute sticker and wallpaper generation.
 * @returns An object containing all generation-related functions.
 */
export const useGeneration = () => {
    const { state, dispatch } = useAppContext();
    const { settings, wallpaperSettings, characterLibrary, credits, isLoading, isCalibrating } = state;
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const cancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    /**
     * The core logic for generating stickers after user confirmation.
     * It retrieves the necessary identity image, builds the list of expressions,
     * and calls the appropriate Gemini service for static or animated stickers.
     */
    const executeStickerGeneration = useCallback(async () => {
        const startTime = Date.now();
        console.log('--- Sticker Gen Start ---', { settings });
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const isPoseOnly = settings.selectedExpressions.length === 1 && settings.selectedExpressions[0] === '(Pose from image)';
        const cost = settings.outputFormat === 'animated' 
            ? CREDIT_COSTS.ANIMATED_STICKER 
            : (isPoseOnly ? 1 : settings.packSize);
        
        const operationType: OperationType = settings.outputFormat === 'animated' ? 'animation' : 'sticker';

        let generationPrompt = "Sticker Generation"; // Placeholder
        
        try {
            const identityAnchorImage = settings.mode === 'image-to-image' 
                ? await imageCache.retrieve(settings.identityAnchorImageId!)
                : TRANSPARENT_PIXEL; // Transparent pixel for text-to-image

            if (signal.aborted) return;

            if (!identityAnchorImage) {
                dispatch({ type: 'GENERATION_ERROR', payload: 'Your calibrated image has expired or could not be found. Please re-upload your photo to create a new Identity Lock.' });
                return;
            }
            
            // Validation before credit deduction
            if (isNaN(cost) || cost < 1) {
                const validationError = `Invalid generation cost calculated: ${cost}. Aborting.`;
                console.error(validationError, { settings });
                dispatch({ type: 'GENERATION_ERROR', payload: validationError });
                return;
            }
            console.log('--- Sticker Gen Credit Deduction ---', { cost, packSize: settings.packSize, isPoseOnly });
            
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Generation started.` } });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Sticker generation', metadata: { packSize: settings.packSize, outputFormat: settings.outputFormat } } });
            // Enhanced transaction logging
            const creditLogMessage = settings.outputFormat === 'animated'
                ? `Animated sticker cost: -${cost} credit.`
                : `Static pack (${cost} ${cost === 1 ? 'sticker' : 'stickers'}) cost: -${cost} credits.`;
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: creditLogMessage } });
            
            const onProgress = (msg: string) => {
                if (!signal.aborted) {
                    dispatch({ type: 'SET_LOADING_MESSAGE', payload: msg });
                }
            };

            const buildExpressions = (): Expression[] => {
                const selected: Expression[] = settings.selectedExpressions
                    .map(name => {
                        const baseExp = EXPRESSIONS.find(exp => exp.name === name);
                        if (!baseExp) return null;
                        const newExp = { ...baseExp };
                        if (newExp.name === '(Pose from image)') {
                            newExp.description = `Use the exact pose and expression from the provided photo. Original photo description: ${settings.poseDescription}`;
                        }
                        newExp.speechBubble = settings.speechBubbles?.[newExp.name] || newExp.speechBubble;
                        return newExp;
                    })
                    .filter((exp): exp is Expression => !!exp);
                return selected;
            };

            if (settings.outputFormat === 'animated') {
                dispatch({ type: 'START_GENERATION', payload: 'Initializing animation...' });
                const result: GeneratedResult = await genAnimatedSticker(settings, identityAnchorImage, onProgress, signal);
                if (signal.aborted) return;

                const finalResult: GeneratedResult = {
                    ...result,
                    timestamp: new Date(startTime).toISOString(),
                    creditCost: cost,
                    operationType,
                    generationTimeMs: Date.now() - startTime,
                    modelUsed: 'veo-2.0-generate-001',
                    success: true,
                };
                generationPrompt = finalResult.prompt;

                dispatch({ type: 'GENERATION_COMPLETE', payload: [finalResult] });
                dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [finalResult] });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Animated sticker generated.' } });
            } else {
                let finalExpressions = buildExpressions();
        
                if (finalExpressions.length < settings.packSize) {
                    const needed = settings.packSize - finalExpressions.length;
                    const availableExpressions = EXPRESSIONS.filter(exp => 
                        !finalExpressions.some(fExp => fExp.name === exp.name)
                    );
                    const shuffled = [...availableExpressions].sort(() => 0.5 - Math.random());
                    finalExpressions.push(...shuffled.slice(0, needed));
                }

                finalExpressions = finalExpressions.slice(0, settings.packSize);

                dispatch({ type: 'START_GENERATION', payload: `Generating a pack of ${finalExpressions.length} stickers...` });
                
                const useIdentityLockV2 = settings.identityAnchor && settings.identityLockStrength !== 'off';
                
                let rawResults: GeneratedResult[];
                let modelUsed: string;
                
                if (useIdentityLockV2 && settings.identityAnchor) {
                    const maxRetries = settings.identityLockStrength === 'maximum' ? 2 : 0;
                    modelUsed = 'gemini-2.5-flash-image-preview';
                    const packResults = await generateStickerPack(
                        settings.identityAnchor,
                        finalExpressions.map(exp => ({ 
                            name: exp.name, 
                            description: exp.description 
                        })),
                        settings.style,
                        (msg, current, total) => onProgress(`${msg} (${current}/${total})`),
                        maxRetries
                    );
                    
                    rawResults = packResults.map(r => ({
                        id: crypto.randomUUID(),
                        type: 'image' as const,
                        dataUrl: r.image,
                        prompt: `Identity-locked generation for ${r.expression}`,
                        settings: { ...settings, packSize: 1, selectedExpressions: [r.expression] },
                        sourceExpression: r.expression,
                        validation: r.validation,
                        attempts: r.attempts
                    }));
                    
                    const failedValidations = rawResults.filter(r => r.validation && !r.validation.isValid);
                    if (failedValidations.length > 0) {
                        dispatch({ type: 'ADD_LOG_ENTRY', payload: { 
                            type: 'error', 
                            message: `${failedValidations.length} sticker(s) may have identity inconsistencies` 
                        } });
                    }
                } else {
                    modelUsed = 'gemini-2.5-flash-image-preview';
                    rawResults = await generateStaticStickers(
                        settings, 
                        identityAnchorImage,
                        finalExpressions, 
                        onProgress
                    );
                }
                
                const generationTimeMs = Date.now() - startTime;
                const resultsWithMetadata = rawResults.map(r => {
                    generationPrompt = r.prompt; // Store last prompt for error logging
                    return {
                        ...r,
                        timestamp: new Date(startTime).toISOString(),
                        creditCost: cost / rawResults.length,
                        operationType,
                        generationTimeMs: Math.round(generationTimeMs / rawResults.length),
                        modelUsed,
                        success: true,
                    };
                });

                dispatch({ type: 'GENERATION_COMPLETE', payload: resultsWithMetadata });
                dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: resultsWithMetadata });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Generated a pack of ${resultsWithMetadata.length} stickers.` } });
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                dispatch({ type: 'FINISH_GENERATION' });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Generation cancelled by user.' } });
                dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Cancelled animation refund' } });
                dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credits for cancelled animation.` } });
                return; // Exit gracefully
            }
            if (signal.aborted) return;
            
            // Check for specific Identity Lock V2 validation failures
            let errorMessage = e.message || 'Generation error.';
            if (e.message && e.message.includes('after max retries')) {
                errorMessage = 'Generation failed because the AI could not maintain identity consistency. Try a different style, a higher \'Identity Lock Strength\', or re-calibrate with a clearer photo.';
            }
            
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed sticker generation refund' } });
            dispatch({ type: 'GENERATION_ERROR', payload: errorMessage });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Generation failed.' } });
            const refundLogMessage = `Refunded ${cost} credits for failed generation.`;
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: refundLogMessage } });
            
            // Log failure to collection
            const failureResult: GeneratedResult = {
                id: crypto.randomUUID(),
                type: settings.outputFormat === 'animated' ? 'video' : 'image',
                dataUrl: '', // No image data on failure
                prompt: generationPrompt,
                settings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost,
                operationType,
                generationTimeMs: Date.now() - startTime,
                success: false,
                errorMessage: e.message || 'Unknown generation error.',
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [failureResult] });
        } finally {
            abortControllerRef.current = null;
        }
    }, [settings, dispatch]);

    const generateStickers = useCallback(() => {
        if (isLoading || isCalibrating) return;
        const isAnimated = settings.outputFormat === 'animated';
        const isPoseOnly = settings.selectedExpressions.length === 1 && settings.selectedExpressions[0] === '(Pose from image)';
        // Corrected cost logic
        const cost = isAnimated ? CREDIT_COSTS.ANIMATED_STICKER : (isPoseOnly ? 1 : settings.packSize);

        if (cost === 0) { dispatch({ type: 'GENERATION_ERROR', payload: "Please select a pack size." }); return; }
        if (credits < cost) { dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. Needs ${cost}.` }); return; }
        
        const request: ConfirmationRequest = {
            title: isAnimated ? 'Confirm Animation Generation' : 'Confirm Sticker Generation',
            message: isAnimated 
                ? 'This will generate 1 animated sticker.' 
                : `This will generate a pack of ${cost} ${cost === 1 ? 'sticker' : 'stickers'}.`,
            cost: cost,
            actionType: 'generate-stickers',
        };
        dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
    }, [isLoading, isCalibrating, settings.packSize, settings.outputFormat, settings.selectedExpressions, credits, dispatch]);


    const executeWallpaperGeneration = useCallback(async () => {
        const startTime = Date.now();
        const cost = CREDIT_COSTS.WALLPAPER;
        const operationType: OperationType = 'wallpaper';
        let generationPrompt = "Wallpaper Generation"; // Placeholder

        dispatch({ type: 'START_WALLPAPER_GENERATION', payload: 'Generating your wallpaper...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Wallpaper generation started.' } });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Wallpaper generation' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Wallpaper cost: -${cost} credits.` } });

        const onProgress = (msg: string) => dispatch({ type: 'SET_LOADING_MESSAGE', payload: msg });

        try {
            const selectedCharacters = characterLibrary.filter(c => wallpaperSettings.selectedCharacterIds.includes(c.id));

            const charactersWithImageData = await Promise.all(selectedCharacters.map(async c => {
                const imageDataUrl = await imageCache.retrieve(c.imageId);
                if (!imageDataUrl) throw new Error(`Failed to process character: '${c.name}'. Please try removing them or using a different image.`);
                return { ...c, imageDataUrl };
            }));
            
            let rawResult: GeneratedResult;
            let modelUsed: string;

            if (wallpaperSettings.useSmartContextAdaptation && charactersWithImageData.length > 0) {
                modelUsed = 'gemini-2.5-flash-image-preview';
                onProgress('Preparing characters for scene...');

                const characterCutouts: string[] = [];
                for (const [index, char] of charactersWithImageData.entries()) {
                    if (index > 0) await new Promise(resolve => setTimeout(resolve, 500));
                    onProgress(`Segmenting character ${index + 1}/${charactersWithImageData.length}: ${char.name}`);
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Segmenting '${char.name}' for scene integration.` } });
                    const cutout = await segmentImage(char.imageDataUrl);
                    characterCutouts.push(cutout);
                }

                const characterImageParts = characterCutouts.map(base64ToPart);
                onProgress('Generating and compositing final scene...');
                
                // Build the VFX Compositor prompt following the Four Pillars structure
                const characterDescriptions = charactersWithImageData.map(c => 
                    `Character: ${c.name} (${c.gender || 'person'}, ${c.ageGroup || 'adult'})`
                ).join('\n');
                
                const finalPrompt = `You are a Lead VFX Compositor from a world-class film studio, renowned for your mastery of photorealistic integration, light, and shadow. You specialize in seamlessly blending real-world elements with AI-generated environments.

**MISSION:**
You have been provided with character cutouts that need to be integrated into a new wallpaper scene. Your job is to create a seamless, photorealistic composite where these characters look naturally and physically present in the new environment.

**CHARACTERS TO INTEGRATE:**
${characterDescriptions}

**SCENE DESCRIPTION:**
${wallpaperSettings.customPrompt}

**COMPOSITION SPECIFICATIONS:**
- Wallpaper Size: ${wallpaperSettings.size.name} (${wallpaperSettings.size.aspectRatio})
- Character Position: ${wallpaperSettings.characterPosition}
- Character Size: ${wallpaperSettings.characterSize}% of scene height
- Quality Level: ${wallpaperSettings.qualityLevel}
- Blending Mode: ${wallpaperSettings.blendingMode}
- Lighting Style: ${wallpaperSettings.lightingStyle}

**UNBREAKABLE CONSTRAINTS:**
- PRIMARY DIRECTIVE: Create a seamless, photorealistic composite where the characters look naturally present in the scene
- Lighting & Shadow: Match the lighting direction, color, and intensity between characters and background
- Color Grading: Apply unified color grade so characters don't look "pasted on"
- Perspective & Scale: Position characters consistently with the scene's perspective
- Edge Blending: Eliminate any harsh cutout edges to create natural integration

**OUTPUT:**
Generate a single, high-resolution composite wallpaper image that seamlessly integrates all provided character cutouts into the described scene.`;
                
                generationPrompt = finalPrompt;
                const response = await generateUnifiedWallpaperScene(characterImageParts, finalPrompt);
                const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
                if (!imageResponsePart?.inlineData) throw new Error("Scene generation failed: No image data in response.");
                
                const finalDataUrl = `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
                
                rawResult = {
                    id: crypto.randomUUID(),
                    type: 'wallpaper',
                    dataUrl: finalDataUrl,
                    prompt: `ADAPTED WALLPAPER:\nBackground: ${wallpaperSettings.customPrompt}\nCharacters: ${charactersWithImageData.map(c => c.name).join(', ')}`,
                    settings: wallpaperSettings,
                    characterIds: charactersWithImageData.map(c => c.id)
                };
                
            } else {
                modelUsed = 'imagen-4.0-generate-001';
                rawResult = await genWallpaper(wallpaperSettings, charactersWithImageData, onProgress);
                generationPrompt = rawResult.prompt;
            }
            
            const resultWithMetadata: GeneratedResult = {
                ...rawResult,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost,
                operationType,
                generationTimeMs: Date.now() - startTime,
                modelUsed,
                success: true,
            };

            dispatch({ type: 'GENERATION_COMPLETE', payload: [resultWithMetadata] });
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [resultWithMetadata] });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Wallpaper generated successfully!' } });
            dispatch({ type: 'ADD_TO_RECENT_GENERATIONS', payload: resultWithMetadata });

        } catch (e: any) {
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed wallpaper generation refund' } });
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Wallpaper generation failed.' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Wallpaper generation failed.' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credits.` } });

            const failureResult: GeneratedResult = {
                id: crypto.randomUUID(),
                type: 'wallpaper',
                dataUrl: '',
                prompt: generationPrompt,
                settings: wallpaperSettings,
                timestamp: new Date(startTime).toISOString(),
                creditCost: cost,
                operationType,
                generationTimeMs: Date.now() - startTime,
                success: false,
                errorMessage: e.message || 'Unknown wallpaper generation error.',
            };
            dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [failureResult] });
        }
    }, [wallpaperSettings, characterLibrary, dispatch]);
    
    const generateWallpaper = useCallback(() => {
        const cost = CREDIT_COSTS.WALLPAPER;
        if (isLoading) return;
        
        const isPromptEmpty = !wallpaperSettings.customPrompt && !wallpaperSettings.selectedPresetId;
        if (isPromptEmpty) {
            dispatch({ type: 'GENERATION_ERROR', payload: 'Please enter a prompt or select a preset to generate a wallpaper.' });
            return;
        }
        if (credits < cost) { dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. Needs ${cost}.` }); return; }
        
        const request: ConfirmationRequest = {
            title: 'Confirm Wallpaper Generation',
            message: 'This will generate a new wallpaper. This action cannot be undone.',
            cost: cost,
            actionType: 'generate-wallpaper',
        };
        dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });

    }, [isLoading, credits, wallpaperSettings, dispatch]);


    return { generateStickers, executeStickerGeneration, generateWallpaper, executeWallpaperGeneration, cancelGeneration };
};