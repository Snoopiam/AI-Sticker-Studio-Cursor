/**
 * @file hooks/useCalibration.ts
 * @description This hook encapsulates all logic related to the "Identity Lock" calibration process.
 * It manages the multi-step AI analysis workflow, which includes analyzing face structure, generating a
 * verification image, and calibrating the character's pose. It also handles user approval/rejection
 * and the streamlined "auto-calibration" flow.
 */

import { useCallback, useRef } from 'react';
import { useAppContext, useCachedImage } from '../context/AppContext';
import { analyzeFaceStructure, generateVerificationImage, calibratePose } from '../utils/services/geminiService';
import { imageCache } from '../utils/services/imageCache';
import type { ConfirmationRequest, IdentityAnchor } from '../types/types';
import { CREDIT_COSTS, API_PACING_DELAY_MS } from '../constants';
import { createIdentityAnchor } from '../utils/services/identityPreservation';

/**
 * @hook useCalibration
 * @description Provides a suite of functions to manage the entire Identity Lock workflow, from initiation to confirmation.
 * It consumes the global state and returns memoized callbacks for the UI to trigger calibration actions.
 * @returns {object} An object containing all calibration-related functions: `executeCalibration`, `calibrate`,
 * `approveVerification`, `rejectVerification`, and `autoCalibrate`.
 */
export const useCalibration = () => {
    const { state, dispatch } = useAppContext();
    const { settings, isCalibrating, credits, validatedIdentityTemplate, validatedIdentityAnchorImageId } = state;
    const uploadedImageData = useCachedImage(settings.uploadedImageId);
    // A ref used as a lock to prevent concurrent executions of the auto-calibration logic, guarding against race conditions.
    const calibrationLockRef = useRef(false);

    /**
     * @function executeCalibration
     * @description The core logic for the manual calibration process, executed after user confirmation.
     * It orchestrates a sequence of three Gemini API calls:
     * 1. `analyzeFaceStructure`: To create the JSON-based identity template.
     * 2. `generateVerificationImage`: To create a neutral "faceprint" for user approval.
     * 3. `calibratePose`: To get a text description of the original pose.
     * Includes built-in delays (`API_PACING_DELAY_MS`) between calls to avoid hitting API rate limits.
     */
    const executeCalibration = useCallback(async () => {
        if (!uploadedImageData) {
            dispatch({ type: 'GENERATION_ERROR', payload: 'No image available for calibration.' });
            return;
        };

        const cost = CREDIT_COSTS.CALIBRATION;
        dispatch({ type: 'START_CALIBRATION', payload: { step: 'calibrating', message: 'Starting calibration...' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Calibration started.' } });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Manual calibration' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Calibration cost: -${cost} credits.` } });
        
        try {
            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Analyzing facial structure...' });
            const identityTemplate = await analyzeFaceStructure(uploadedImageData);

            // Add a delay to pace API calls and avoid rate limits.
            await new Promise(resolve => setTimeout(resolve, API_PACING_DELAY_MS));

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Generating verification image...' });
            const verificationResult = await generateVerificationImage(uploadedImageData);
            
            const verificationImageId = crypto.randomUUID();
            await imageCache.store(verificationImageId, verificationResult.dataUrl);

            // Add another delay before the final call.
            await new Promise(resolve => setTimeout(resolve, API_PACING_DELAY_MS));

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Calibrating character pose...' });
            const pose = await calibratePose(uploadedImageData);

            // Dispatch the results to the state to show the user the verification step.
            dispatch({ type: 'VERIFICATION_READY', payload: { validatedAnchorImageId: settings.uploadedImageId!, verificationImageId, pose, identityTemplate } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Analysis complete. Awaiting user verification.' } });
        } catch (e: any) {
            // On failure, refund the credits and show an error.
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed manual calibration refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credits.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Calibration error.' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Calibration failed.' } });
        }
    }, [settings, uploadedImageData, dispatch]);
    
    /**
     * @function autoCalibrate
     * @description Automatically calibrates a newly uploaded/cropped image without requiring user verification.
     * This streamlined flow is triggered automatically and skips the `generateVerificationImage` step to save time and credits.
     * It includes a function-level lock and checks for cached results to prevent redundant API calls.
     */
    const autoCalibrate = useCallback(async () => {
        // If the identity template for the current image already exists in the state, skip re-calibration.
        if (settings.identityTemplate && settings.identityAnchorImageId === settings.uploadedImageId) {
            console.log('Using cached calibration results. Skipping re-calibration.');
            // Ensure the state is correctly set to 'confirmed' if we skip.
            dispatch({ type: 'SET_CALIBRATION_STEP', payload: 'confirmed' });
            return;
        }

        // Prevent concurrent calls using the ref lock.
        if (calibrationLockRef.current) {
            console.warn('Calibration lock is active. Skipping concurrent autoCalibrate call.');
            return;
        }
        calibrationLockRef.current = true;

        try {
            // Directly fetch the image from cache to avoid a race condition with the useCachedImage hook, which might not be updated yet.
            const imageDataToCalibrate = settings.uploadedImageId ? await imageCache.retrieve(settings.uploadedImageId) : null;
    
            if (!imageDataToCalibrate) {
                dispatch({ type: 'GENERATION_ERROR', payload: 'No image available for auto-calibration.' });
                return;
            }
    
            const cost = CREDIT_COSTS.CALIBRATION;
            dispatch({ type: 'START_CALIBRATION', payload: { step: 'auto-calibrating', message: 'Auto-calibrating your image...' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Auto-calibration started.' } });
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Auto-calibration' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Auto-calibration cost: -${cost} credit.` } });
            
            
            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Creating identity anchor...' });
            const identityAnchor: IdentityAnchor = await createIdentityAnchor(imageDataToCalibrate);
            
            // Extract components for state storage
            const identityTemplate = JSON.stringify(identityAnchor.biometricProfile);
            
            await new Promise(resolve => setTimeout(resolve, API_PACING_DELAY_MS));

            dispatch({ type: 'SET_LOADING_MESSAGE', payload: 'Calibrating character pose...' });
            const pose = await calibratePose(imageDataToCalibrate);
            
            // Store neutral reference in cache
            const neutralRefImageId = crypto.randomUUID();
            await imageCache.store(neutralRefImageId, identityAnchor.neutralFaceBase64);

            // Dispatch with both old format (template) and new format (anchor)
            dispatch({ type: 'AUTO_CALIBRATE_COMPLETE', payload: { 
                validatedAnchorImageId: settings.uploadedImageId!, 
                pose, 
                identityTemplate  // Keep for backwards compatibility
            } });
            
            // Store complete identity anchor in settings
            dispatch({ type: 'SET_SETTING', payload: { 
                identityAnchor: identityAnchor,
                identityLockStrength: 'standard'  // Default to standard
            } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Identity Lock automatically confirmed!' } });
            
            // For a better UX, auto-populate the subject description field from the identity template.
            if (identityTemplate) {
                try {
                    const template = JSON.parse(identityTemplate);
                    const parts = [];
                    if (template.hair?.style) parts.push(`a person with ${template.hair.style}`);
                    if (template.hair?.facialHair && template.hair.facialHair !== 'clean-shaven') parts.push(`and ${template.hair.facialHair}`);
                    if (parts.length > 0) {
                        const subject = parts.join(' ').replace(/ ,|,/g, ',') + '.';
                        dispatch({ type: 'SET_SETTING', payload: { subject: subject.charAt(0).toUpperCase() + subject.slice(1) }});
                    }
                } catch (e) {
                    console.warn("Could not parse identity template to auto-fill subject.", e);
                }
            }
        } catch (e: any) {
            const cost = CREDIT_COSTS.CALIBRATION;
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed auto-calibration refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credit.` } });
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Auto-calibration error.' });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Auto-calibration failed.' } });
        } finally {
            // Always release the lock.
            calibrationLockRef.current = false;
        }
    }, [settings.uploadedImageId, settings.identityTemplate, settings.identityAnchorImageId, dispatch]);

    /**
     * @function calibrate
     * @description Initiates the manual calibration process by creating and dispatching a confirmation request.
     * This is called by the UI's "Calibrate" button and serves as a gate before spending credits.
     */
    const calibrate = useCallback(() => {
        const cost = CREDIT_COSTS.CALIBRATION;
        if (!settings.uploadedImageId || isCalibrating || credits < cost) {
            if (credits < cost) dispatch({ type: 'GENERATION_ERROR', payload: 'Insufficient credits for calibration.' });
            return;
        }
        const request: ConfirmationRequest = {
            title: 'Confirm Calibration',
            message: 'This will analyze the uploaded image to create an Identity Lock. This process cannot be undone.',
            cost: cost,
            actionType: 'calibrate',
        };
        dispatch({ type: 'REQUEST_CONFIRMATION', payload: request });
    }, [settings.uploadedImageId, isCalibrating, credits, dispatch]);

    /**
     * @function approveVerification
     * @description Handles the user's approval of the verification image. This locks in the identity by
     * moving the `validatedIdentityTemplate` into the main `settings` object.
     */
    const approveVerification = useCallback(() => {
        dispatch({ type: 'APPROVE_VERIFICATION' });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Identity Lock Confirmed!' } });

        // Auto-populate subject description from the now-validated identity template for a better UX.
        if (validatedIdentityTemplate) {
            try {
                const template = JSON.parse(validatedIdentityTemplate);
                const parts = [];
                if (template.hair?.style) parts.push(`a person with ${template.hair.style}`);
                if (template.hair?.facialHair && template.hair.facialHair !== 'clean-shaven') parts.push(`and ${template.hair.facialHair}`);
                if (parts.length > 0) {
                    const subject = parts.join(' ').replace(/ ,|,/g, ',') + '.';
                    dispatch({ type: 'SET_SETTING', payload: { subject: subject.charAt(0).toUpperCase() + subject.slice(1) }});
                }
            } catch (e) {
                console.warn("Could not parse identity template to auto-fill subject.", e);
            }
        }
    }, [dispatch, validatedIdentityTemplate]);
    
    /**
     * @function rejectVerification
     * @description Handles the user's rejection of the verification image. It resets the calibration state,
     * refunds the credit cost, and displays a helpful warning with tips for better results.
     */
    const rejectVerification = useCallback(() => {
        const cost = CREDIT_COSTS.CALIBRATION;
        dispatch({ type: 'REJECT_VERIFICATION' });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Rejected verification refund' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Verification rejected.' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credits.` } });
    }, [dispatch]);

    return { executeCalibration, calibrate, approveVerification, rejectVerification, autoCalibrate };
};