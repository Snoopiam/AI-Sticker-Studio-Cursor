/**
 * @file reducers/settingsReducer.ts
 * @description A reducer that handles all state changes related to user-configurable settings
 * for both sticker and wallpaper generation.
 */

import { PresentAppState, Action, Style } from '../types/types';
import { PROMPT_IDEAS } from '../constants/promptIdeas';
import { STYLE_COMPATIBILITY } from '../constants';

/**
 * Returns an object representing the initial/reset state for the calibration slice.
 * This is used to reset calibration when a new image is uploaded.
 * @returns A partial state object with reset calibration values.
 */
const getResetCalibrationState = () => ({
    calibrationStep: 'idle' as const,
    detectedSubjects: null,
    selectedSubjectId: null,
    calibrationWarning: null,
    error: null,
    validatedIdentityAnchorImageId: null,
    verificationImageId: null,
    validatedIdentityTemplate: null,
});


/**
 * Manages the settings slice of the application state.
 * @param {PresentAppState} state - The current state.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state.
 */
export const settingsReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        case 'SET_SETTING': {
            const newSettings = { ...state.settings, ...action.payload };

            // When style changes, enforce compatibility for sub-styles
            if (action.payload.style) {
                const newStyle = action.payload.style as Style;
                const compatibility = STYLE_COMPATIBILITY[newStyle];
                if (compatibility) {
                    if (!compatibility.lines.includes(newSettings.lineStyle)) {
                        newSettings.lineStyle = compatibility.lines[0];
                    }
                    if (!compatibility.shading.includes(newSettings.shadingStyle)) {
                        newSettings.shadingStyle = compatibility.shading[0];
                    }
                }
            }

            // When output format changes, adjust pack size and expressions
            if (action.payload.outputFormat) {
                if (action.payload.outputFormat === 'animated') {
                    newSettings.packSize = 1;
                } else { // Switching back to static
                    // Reset expressions to a sensible default for static packs
                    if (state.settings.outputFormat === 'animated') {
                        newSettings.selectedExpressions = ['HEY', 'Thumbs Up', 'Laughing', 'Wink'];
                        newSettings.packSize = 4;
                    } else {
                        const isPoseFromImageOnly = newSettings.selectedExpressions.length === 1 && newSettings.selectedExpressions[0] === '(Pose from image)';
                        newSettings.packSize = isPoseFromImageOnly ? 1 : 4;
                    }
                }
            }
            
            if (action.payload.mode === 'image-to-image') newSettings.selectedExpressions = ['(Pose from image)'];
            else if (action.payload.mode === 'text-to-image' && state.settings.mode === 'image-to-image') newSettings.selectedExpressions = ['HEY'];
            
            if (action.payload.isGroupSticker === true) {
                return { ...state, settings: { ...newSettings, identityAnchorImageId: null, poseDescription: '' }, ...getResetCalibrationState() };
            }

            if (action.payload.uploadedImageId && action.payload.uploadedImageId !== state.settings.uploadedImageId) {
                return { ...state, settings: {...newSettings, identityTemplate: undefined, identityAnchorImageId: null, poseDescription: ''}, ...getResetCalibrationState() };
            }
            
            // When selected expressions change, adjust pack size
            if (action.payload.selectedExpressions) {
                const isPoseOnly = action.payload.selectedExpressions.length === 1 && action.payload.selectedExpressions[0] === '(Pose from image)';
                const wasPoseOnly = state.settings.selectedExpressions.length === 1 && state.settings.selectedExpressions[0] === '(Pose from image)';

                if (isPoseOnly) {
                    newSettings.packSize = 1;
                } else if (wasPoseOnly && !isPoseOnly) {
                    // If we just added another expression to "Pose from image", reset pack size.
                    newSettings.packSize = 4;
                }
            }
            return { ...state, settings: newSettings };
        }
        case 'SET_SETTINGS':
            return { ...state, settings: action.payload };
        case 'RANDOMIZE_STYLE_ONLY':
             return { ...state, settings: { ...state.settings, ...action.payload } };
        case 'RANDOMIZE_PROMPT': {
            const randomIdea = PROMPT_IDEAS[Math.floor(Math.random() * PROMPT_IDEAS.length)];
            if (state.settings.mode === 'image-to-image' && state.calibrationStep === 'confirmed') {
                const { style, palette, lineStyle, shadingStyle } = randomIdea;
                return { ...state, settings: { ...state.settings, style, palette, lineStyle, shadingStyle }};
            } else {
                return { ...state, settings: { ...state.settings, ...randomIdea, mode: 'text-to-image', outputFormat: 'static', uploadedImageId: null, identityAnchorImageId: null, poseDescription: '', isGroupSticker: false, selectedExpressions: ['HEY'] }};
            }
        }
        case 'SET_WALLPAPER_SETTING':
            return { ...state, wallpaperSettings: { ...state.wallpaperSettings, ...action.payload } };
        default:
            return state;
    }
};