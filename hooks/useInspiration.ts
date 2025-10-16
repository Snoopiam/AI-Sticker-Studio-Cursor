/**
 * @file hooks/useInspiration.ts
 * @description Custom hook that encapsulates the "Inspire Me" functionality for the Photo Remix feature.
 * It provides both offline fallback suggestions and AI-powered context-aware suggestions.
 */

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeAndSuggestScenes } from '../utils/services/geminiService';

/**
 * @hook useInspiration
 * @description Provides the inspireMe function for generating creative suggestions.
 * @returns An object containing the inspireMe function and any related state.
 */
export const useInspiration = () => {
    const { state, dispatch } = useAppContext();
    const { remixState } = state;

    /**
     * @function inspireMe
     * @description Generates creative suggestions for photo remix backgrounds and foregrounds.
     * Uses offline fallback suggestions when no image is available, or AI-powered suggestions when an image exists.
     */
    const inspireMe = useCallback(async () => {
        if (!remixState.originalImage) {
            // If no image, provide a generic, offline-friendly fallback idea.
            const ideas = [
                { bg: 'A mystical forest at twilight with glowing mushrooms and fireflies.', fg: 'Transform them into woodland fairies with gossamer wings.' },
                { bg: 'A futuristic cyberpunk cityscape at night, with neon signs reflected in rainy streets.', fg: 'Add high-tech cyberpunk attire, glowing visors, and neon accents.' },
                { bg: 'The deck of a pirate ship on a stormy sea, with treasure chests visible.', fg: 'Dress them as adventurous pirate captains with tricorn hats and swords.' },
            ];
            const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
            dispatch({ type: 'SET_REMIX_STATE', payload: { backgroundPrompt: randomIdea.bg, foregroundPrompt: randomIdea.fg } });
        } else {
            // If an image exists, use the AI to generate context-aware suggestions.
            dispatch({ type: 'START_GENERATION', payload: 'Analyzing photo for ideas...' });
            try {
                const suggestions = await analyzeAndSuggestScenes(remixState.originalImage);
                if (suggestions && suggestions.length > 0) {
                    const chosen = suggestions[Math.floor(Math.random() * suggestions.length)];
                    dispatch({
                        type: 'SET_REMIX_STATE', payload: {
                            backgroundPrompt: chosen.backgroundPrompt,
                            foregroundPrompt: chosen.foregroundPrompt
                        }
                    });
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Remix Idea: "${chosen.title}"` } });
                } else {
                    throw new Error("AI did not return any suggestions.");
                }
            } catch (error: any) {
                dispatch({ type: 'GENERATION_ERROR', payload: error.message || 'Could not generate suggestions.' });
            } finally {
                dispatch({ type: 'FINISH_GENERATION' });
            }
        }
    }, [remixState.originalImage, dispatch]);

    return { inspireMe };
};
