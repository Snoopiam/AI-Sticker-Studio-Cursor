/**
 * @file reducers/calibrationReducer.ts
 * @description A reducer dedicated to handling all state changes for the multi-step identity calibration process.
 * This includes managing the calibration steps, handling subject selection, processing verification results,
 * and managing reset logic.
 */

import { PresentAppState, Action, CalibrationStep } from '../types/types';

/**
 * @function calibrationReducer
 * @description Manages the calibration-related slice of the application state. It responds to actions
 * related to the Identity Lock workflow.
 * @param {PresentAppState} state - The current state before the action.
 * @param {Action} action - The dispatched action.
 * @returns {PresentAppState} The new state after applying the action.
 */
export const calibrationReducer = (state: PresentAppState, action: Action): PresentAppState => {
    switch (action.type) {
        // Kicks off the automated calibration process after an image is cropped.
        case 'TRIGGER_AUTO_CALIBRATION': {
            // A state-based guard to prevent starting a new calibration if one is already in progress.
            if (state.isCalibrating || state.calibrationStep === 'auto-calibrating' || state.calibrationStep === 'calibrating') {
                console.log('Calibration already in progress, ignoring trigger');
                return state;
            }
            return {
                ...state,
                calibrationStep: 'auto-calibrating',
                isCalibrating: true,
                calibrationWarning: null, // Clear any previous warnings.
            };
        }
        
        // A generic action to manually set the calibration step, used internally by hooks.
        case 'SET_CALIBRATION_STEP':
            return { ...state, calibrationStep: action.payload, isCalibrating: action.payload === 'calibrating' || action.payload === 'auto-calibrating' };

        // Handles the completion of the auto-calibration flow.
        case 'AUTO_CALIBRATE_COMPLETE': {
            return {
                ...state,
                isCalibrating: false,
                calibrationStep: 'confirmed', // The identity is now locked.
                validatedIdentityAnchorImageId: action.payload.validatedAnchorImageId,
                validatedIdentityTemplate: action.payload.identityTemplate,
                settings: {
                    ...state.settings,
                    // Apply the confirmed calibration results directly to the main settings.
                    identityAnchorImageId: action.payload.validatedAnchorImageId,
                    poseDescription: action.payload.pose,
                    identityTemplate: action.payload.identityTemplate,
                },
                verificationImageId: null, // No verification image in this flow.
            };
        }
        // Records the user's selection of a subject from a multi-person photo.
        case 'SELECT_SUBJECT':
            return { ...state, selectedSubjectId: action.payload };

        // Handles the results from a manual calibration, moving the state to 'awaiting-verification'.
        case 'VERIFICATION_READY': {
            return { 
                ...state, 
                isCalibrating: false, 
                calibrationStep: 'awaiting-verification',
                // Store the results temporarily for the user to review.
                validatedIdentityAnchorImageId: action.payload.validatedAnchorImageId, 
                verificationImageId: action.payload.verificationImageId, 
                settings: { ...state.settings, poseDescription: action.payload.pose }, 
                validatedIdentityTemplate: action.payload.identityTemplate 
            };
        }

        // Handles the user's approval of the verification image.
        case 'APPROVE_VERIFICATION': {
            if (!state.validatedIdentityAnchorImageId || !state.validatedIdentityTemplate) return state;
            return { 
                ...state, 
                settings: { 
                    ...state.settings, 
                    // Promote the temporary validated data to the main settings, locking the identity.
                    identityAnchorImageId: state.validatedIdentityAnchorImageId, 
                    identityTemplate: state.validatedIdentityTemplate 
                }, 
                calibrationStep: 'confirmed', 
                // Clear the temporary verification data.
                validatedIdentityAnchorImageId: null, 
                verificationImageId: null, 
                validatedIdentityTemplate: null 
            };
        }

        // Handles the user's rejection of the verification image.
        case 'REJECT_VERIFICATION': {
            return { 
                ...state, 
                calibrationStep: 'idle', // Reset the calibration step.
                // Clear all temporary verification data.
                validatedIdentityAnchorImageId: null, 
                verificationImageId: null, 
                validatedIdentityTemplate: null, 
                // Provide a helpful warning to the user with tips for better results.
                calibrationWarning: "Verification Rejected|The AI's analysis didn't quite look right. Here are some tips for better results:|Try a different photo where the person's face is clear, well-lit, and facing forward.|Ensure the crop is a tight headshot with minimal background.|Adjust the crop manually if the auto-detection isn't perfect." 
            };
        }

        // Resets the entire calibration and identity state, typically when a new image is uploaded or the user clears it.
        case 'CLEAR_UPLOADED_IMAGE':
        case 'RESET_CALIBRATION':
            return { 
                ...state, 
                calibrationStep: 'idle', 
                isCalibrating: false, 
                detectedSubjects: null, 
                selectedSubjectId: null, 
                calibrationWarning: null, 
                validatedIdentityAnchorImageId: null, 
                verificationImageId: null, 
                validatedIdentityTemplate: null, 
                settings: { 
                    ...state.settings, 
                    // Clear all identity-related fields from the main settings.
                    identityAnchorImageId: null, 
                    poseDescription: '', 
                    uploadedImageId: null, 
                    identityTemplate: undefined,
                    speechBubbles: {} 
                } 
            };

        // Sets a calibration-specific warning message to be displayed in the UI.
        case 'SET_CALIBRATION_WARNING':
            return { ...state, isCalibrating: false, calibrationWarning: action.payload, calibrationStep: 'idle' };

        // Resets all calibration and identity state after a new crop is applied, preparing for a fresh calibration.
        case 'APPLY_CROP': {
             return { 
                ...state, 
                isCropModalOpen: false, 
                imageToCrop: null, 
                settings: { 
                    ...state.settings, 
                    // Set the new cropped image ID and clear any previous identity template.
                    uploadedImageId: action.payload, 
                    identityTemplate: undefined 
                }, 
                // Reset the entire calibration state machine.
                calibrationStep: 'idle' as CalibrationStep, 
                detectedSubjects: null, 
                selectedSubjectId: null, 
                calibrationWarning: null, 
                error: null, 
                validatedIdentityAnchorImageId: null, 
                verificationImageId: null, 
                validatedIdentityTemplate: null 
            };
        }

        default:
            return state;
    }
};