/**
 * @file hooks/useCharacterCreation.ts
 * @description This hook handles all logic related to creating and saving characters to the user's library.
 * It manages multiple workflows: creating a character from a photo, importing a sticker with transparency,
 * saving a group photo, and transferring a generated sticker to the wallpaper studio. It orchestrates
 * AI analysis, user input via modals, and state updates.
 */

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { imageCache } from '../utils/services/imageCache';
import { analyzeCharacter, analyzeStickerContext } from '../utils/services/geminiService';
import type { Character, ConfirmationRequest, TextInputRequest, GeneratedResult, StickerAnalysis } from '../types/types';
import { CREDIT_COSTS, DEFAULT_CHARACTER_NAME } from '../constants';

/**
 * @hook useCharacterCreation
 * @description Provides a suite of functions to create and manage characters in the library.
 * It encapsulates all the complex logic for different character creation pathways.
 * @returns {object} An object containing all character creation and management functions.
 */
export const useCharacterCreation = () => {
    const { state, dispatch } = useAppContext();
    const { isCreatingCharacter, credits } = state;

    /**
     * @function executeCharacterCreation
     * @description The core logic for creating a character from a photo, executed after user confirmation.
     * It stores the image in the cache, calls the AI to analyze it for traits (gender, age, etc.),
     * and then opens the text input modal for the user to name their new character.
     * @param {string} base64Image - The base64 data URL of the image for the new character.
     * @param {string} namePrefix - A suggested prefix for the character's name, if available.
     */
    const executeCharacterCreation = useCallback(async (base64Image: string, namePrefix: string) => {
        const cost = CREDIT_COSTS.CHARACTER_CREATION;
        dispatch({ type: 'START_CHARACTER_CREATION' });
        dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Analyzing character...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Analyzing new character...' } });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Character creation from photo' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Character creation cost: -${cost} credits.` } });
        
        try {
            const imageId = crypto.randomUUID();
            await imageCache.store(imageId, base64Image);
            const analysis = await analyzeCharacter(base64Image);

            // Open a modal to ask the user for a name, passing the analysis results in the context.
            const request: TextInputRequest = {
                title: 'Name Your New Character',
                message: 'Enter a name to save this character to your library for use in the Wallpaper Studio.',
                initialValue: namePrefix || DEFAULT_CHARACTER_NAME,
                confirmText: 'Save Character',
                actionType: 'name-character',
                context: { imageId, analysis }
            };
            dispatch({ type: 'OPEN_TEXT_INPUT_MODAL', payload: request });

        } catch (e: any) {
            // On failure, refund credits and show an error.
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed character creation refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credits.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Character creation failed.' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Character creation failed.' } });
            dispatch({ type: 'FINISH_CHARACTER_CREATION' });
        }
    }, [dispatch]);

    /**
     * @function finalizeCharacter
     * @description Finalizes character creation after the user has entered a name in the modal.
     * It constructs the final `Character` object and dispatches an action to add it to the library.
     * @param {string} name - The name provided by the user in the modal.
     * @param {Partial<Character>} analysis - The AI analysis result from `executeCharacterCreation`.
     * @param {string} imageId - The ID of the cached character image.
     */
    const finalizeCharacter = useCallback((name: string, analysis: Partial<Character>, imageId: string) => {
        if (!name) {
            // Handle cancellation: refund credits and log the event.
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Character creation cancelled.' } });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: CREDIT_COSTS.CHARACTER_CREATION, reason: 'Cancelled character naming refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${CREDIT_COSTS.CHARACTER_CREATION} credits.` } });
        } else {
            const newCharacter: Character = {
                id: crypto.randomUUID(),
                name,
                imageId,
                ...analysis
            };
            dispatch({ type: 'ADD_CHARACTER', payload: newCharacter });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Character '${name}' saved! You can now select them in the Wallpaper Studio.` } });
        }
        dispatch({ type: 'FINISH_CHARACTER_CREATION' });

    }, [dispatch]);

    /**
     * @function createCharacter
     * @description Initiates the character creation process by creating and dispatching a confirmation request.
     * This is the entry point called from the UI.
     * @param {string} base64Image - The image data for the potential new character.
     * @param {string} namePrefix - A suggested prefix for the character's name.
     */
    const createCharacter = useCallback((base64Image: string, namePrefix: string) => {
        const cost = CREDIT_COSTS.CHARACTER_CREATION;
        if (isCreatingCharacter || credits < cost || !base64Image) {
            if (credits < cost) dispatch({ type: 'GENERATION_ERROR', payload: `Insufficient credits. Needs ${cost}.` });
            return;
        }
        
        const request: ConfirmationRequest = {
            title: 'Confirm Character Creation',
            message: 'This will analyze the image and save it as a new reusable character in your library.',
            cost: cost,
            actionType: 'create-character',
            context: { base64Image, namePrefix }
        };
        dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
    }, [credits, isCreatingCharacter, dispatch]);

    /**
     * @function saveGroupPhoto
     * @description Initiates the process of saving a group photo to the character library.
     * This opens a text input modal for the user to name the photo.
     * @param {string} base64Image - The image data of the group photo.
     */
    const saveGroupPhoto = useCallback((base64Image: string) => {
        if (isCreatingCharacter || !base64Image) return;

        const request: TextInputRequest = {
            title: 'Name Your Group Photo',
            message: 'Enter a name to save this photo to your Character Library for use in the Wallpaper Studio.',
            initialValue: 'Group Photo',
            confirmText: 'Save to Library',
            actionType: 'name-group-photo',
            context: { base64Image }
        };
        dispatch({ type: 'OPEN_TEXT_INPUT_MODAL', payload: request });
    }, [isCreatingCharacter, dispatch]);

    /**
     * @function confirmSaveGroupPhoto
     * @description Finalizes saving a group photo after the user provides a name. It creates a special
     * `Character` entry of type 'group' in the library.
     * @param {string} name - The name for the group photo character entry.
     */
    const confirmSaveGroupPhoto = useCallback(async (name: string) => {
        const base64Image = state.textInputRequest?.context?.base64Image;
        if (isCreatingCharacter || !base64Image) return;
        
        dispatch({ type: 'START_CHARACTER_CREATION' });
        try {
            const imageId = crypto.randomUUID();
            await imageCache.store(imageId, base64Image);

            const newCharacter: Character = {
                id: crypto.randomUUID(),
                name,
                imageId,
                type: 'group',
                createdAt: new Date(),
                tags: ['group photo']
            };
            dispatch({ type: 'ADD_CHARACTER', payload: newCharacter });
            dispatch({ type: 'SHOW_GROUP_PHOTO_SUCCESS', payload: { characterName: name } });

        } catch (e: any) {
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Failed to save group photo.' });
        } finally {
             dispatch({ type: 'FINISH_CHARACTER_CREATION' });
        }
    }, [isCreatingCharacter, state.textInputRequest, dispatch]);

    /**
     * @function transferStickerToWallpaper
     * @description Analyzes a generated sticker and transfers it as a temporary character to the wallpaper studio.
     * This provides a seamless "Use in Wallpaper" workflow.
     * @param {GeneratedResult} result - The sticker result object to transfer.
     */
    const transferStickerToWallpaper = useCallback(async (result: GeneratedResult) => {
        dispatch({ type: 'START_GENERATION', payload: 'Analyzing sticker for transfer...' });
        try {
            const analysis = await analyzeStickerContext(result.dataUrl);
            const imageId = crypto.randomUUID();
            await imageCache.store(imageId, result.dataUrl);

            const tempChar: Character = {
                id: crypto.randomUUID(),
                name: result.sourceExpression ? `${result.sourceExpression} Sticker` : 'New Sticker',
                imageId,
                identityTemplate: analysis.identityTemplate,
                style: analysis.style,
                mood: analysis.pose,
                type: 'sticker',
                createdAt: new Date(),
            };
            
            // This special action switches the app mode and passes the character data.
            dispatch({ type: 'TRANSFER_CHARACTER_TO_WALLPAPER', payload: { ...tempChar, imageDataUrl: result.dataUrl } });

        } catch (e: any) {
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Sticker transfer failed.' });
        } finally {
            dispatch({ type: 'FINISH_GENERATION' });
        }
    }, [dispatch]);

    /**
     * @function importStickerCharacter
     * @description Imports an image with transparency (a sticker) as a new character. This is a free operation.
     * It analyzes the sticker's context and then prompts the user for a name.
     * @param {string} base64Image - The base64 data URL of the sticker image.
     */
    const importStickerCharacter = useCallback(async (base64Image: string) => {
        dispatch({ type: 'START_CHARACTER_CREATION' });
        dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Analyzing imported sticker...' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Analyzing imported sticker...' } });
        try {
            const imageId = crypto.randomUUID();
            await imageCache.store(imageId, base64Image);
            const analysis = await analyzeStickerContext(base64Image);

            const request: TextInputRequest = {
                title: 'Name Your New Character',
                message: 'This sticker has been analyzed. Enter a name to save it as a new character.',
                initialValue: "New Sticker Character",
                confirmText: 'Save Character',
                actionType: 'name-sticker-character',
                context: { imageId, analysis }
            };
            dispatch({ type: 'OPEN_TEXT_INPUT_MODAL', payload: request });

        } catch (e: any) {
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Sticker import failed.' });
            dispatch({ type: 'FINISH_CHARACTER_CREATION' });
        }
    }, [dispatch]);

     /**
     * @function finalizeStickerCharacter
     * @description Finalizes the creation of a character from an imported sticker after the user provides a name.
     * @param {string} name - The name from the modal.
     * @param {StickerAnalysis} analysis - The AI analysis result from the sticker.
     * @param {string} imageId - The ID of the cached character image.
     */
    const finalizeStickerCharacter = useCallback((name: string, analysis: StickerAnalysis, imageId: string) => {
        if (!name) {
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Sticker import cancelled.' } });
        } else {
            const newCharacter: Character = {
                id: crypto.randomUUID(),
                name,
                imageId,
                identityTemplate: analysis.identityTemplate,
                style: analysis.style,
                mood: analysis.pose,
                type: 'sticker',
                createdAt: new Date(),
                tags: ['sticker-import', analysis.style.toLowerCase()]
            };
            dispatch({ type: 'ADD_CHARACTER', payload: newCharacter });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Character '${name}' saved from sticker!` } });
        }
        dispatch({ type: 'FINISH_CHARACTER_CREATION' });
    }, [dispatch]);


    return { createCharacter, executeCharacterCreation, finalizeCharacter, saveGroupPhoto, confirmSaveGroupPhoto, transferStickerToWallpaper, importStickerCharacter, finalizeStickerCharacter };
};