/**
 * @file types.ts
 * @description This file contains all the core TypeScript types, interfaces, and type aliases
 * used throughout the AI Sticker Studio application. It serves as a single source of truth for the
 * application's data structures, ensuring type safety and consistency across all modules.
 */

import type { Style, Palette, LineStyle, ShadingStyle, OutputResolution, Composition, AnimationStyle, ExpressionCategory } from '../constants';
import type { WallpaperSize, WallpaperPreset, BlendingMode, LightingStyle, QualityLevel } from '../constants/wallpaperPresets';
import type React from 'react';
import type { DevLogEntry, DevLogImpact, DevLogType } from './devLog';

// --- TYPE RE-EXPORTS ---
// Re-exporting types from other files to make this the single source of truth for imports.
export type { Style, Palette, LineStyle, ShadingStyle, Composition, AnimationStyle, OutputResolution, ExpressionCategory };
export type { WallpaperPreset };
export type { DevLogEntry, DevLogImpact, DevLogType };

// --- INTERFACE & OBJECT TYPES ---

/**
 * @interface SceneSuggestion
 * @description Defines the structure for an AI-generated scene suggestion for the Photo Remix feature.
 */
export interface SceneSuggestion {
    title: string;
    backgroundPrompt: string;
    foregroundPrompt: string;
}

/**
 * @interface StickerAnalysis
 * @description Defines the structure of the AI's analysis of a sticker's context.
 */
export interface StickerAnalysis {
    identityTemplate: string;
    pose: string;
    style: string;
}

/**
 * @interface BiometricProfile
 * @description Defines the structure for the detailed biometric analysis of a person's face.
 */
export interface BiometricProfile {
    bone_structure: {
        face_shape: string;
        jawline: string;
        cheekbones: string;
        chin: string;
        forehead: string;
    };
    eye_biometrics: {
        iris_color: string;
        eye_shape: string;
        pupillary_distance: string;
        eyelid_type: string;
        eyebrow_shape: string;
    };
    nose_structure: {
        bridge_width: string;
        bridge_height: string;
        nostril_shape: string;
        tip_shape: string;
        overall_size: string;
    };
    mouth_features: {
        lip_fullness: { upper: string; lower: string };
        cupids_bow: string;
        mouth_width: string;
    };
    distinctive_features: {
        dimples: string;
        hair_style: string;
        earrings: string;
        tattoos: string;
        piercings: string;
        markers: string;
    };
    skin_tone: {
        base: string;
        undertones: string;
    };
}

/**
 * @interface IdentityAnchor
 * @description Defines the complete V2 identity object, containing all necessary data for consistent generation and validation.
 */
export interface IdentityAnchor {
    sourceImageBase64: string;
    biometricProfile: BiometricProfile;
    neutralFaceBase64: string;
    identityFingerprint: string;
}

/**
 * @interface ValidationResult
 * @description Defines the structure of the identity validation result, including a similarity score and any detected issues.
 */
export interface ValidationResult {
    isValid: boolean;
    similarityScore: number;
    issues: string[];
}


/**
 * @interface Settings
 * @description Defines all user-configurable options for generating stickers. This object is
 * a central piece of the application state, controlling the input for the Gemini API.
 */
export interface Settings {
    /** @property {'image-to-image' | 'text-to-image'} mode - The primary generation mode. 'image-to-image' uses an uploaded photo for identity, while 'text-to-image' uses a text description. */
    mode: 'image-to-image' | 'text-to-image';
    /** @property {'static' | 'animated'} outputFormat - The desired output format for the sticker. */
    outputFormat: 'static' | 'animated';
    /** @property {string} subject - The subject description for text-to-image mode (e.g., "a wizard cat"). */
    subject: string;
    /** @property {string} keyCharacteristics - Key visual details of the subject for text-to-image mode (e.g., "wearing a pointy hat"). */
    keyCharacteristics: string;
    /** @property {string} clothing - Optional clothing description for the character. */
    clothing: string;
    /** @property {string} negativePrompt - A prompt to guide the AI away from certain features (e.g., "blurry, extra fingers"). */
    negativePrompt: string;
    /** @property {string | null} uploadedImageId - The ID of the user-uploaded image in the IndexedDB image cache. */
    uploadedImageId: string | null;
    /** @property {'photograph' | 'illustration' | 'sketch'} imageInputType - The type of the uploaded image, used to guide the AI's interpretation. */
    imageInputType: 'photograph' | 'illustration' | 'sketch';
    /** @property {boolean} isGroupSticker - A flag indicating if the source image contains multiple people for group sticker generation. */
    isGroupSticker: boolean;
    /** @property {string | null} identityAnchorImageId - The ID of the confirmed, calibrated image used for "Identity Lock". */
    identityAnchorImageId: string | null;
    /** @property {string} poseDescription - An AI-generated text description of the pose from the original uploaded image. */
    poseDescription: string;
    /** @property {string | undefined} identityTemplate - A JSON string containing a detailed analysis of the subject's facial features, forming the core of the Identity Lock. */
    identityTemplate?: string;
    /** @property {'off' | 'standard' | 'maximum'} identityLockStrength - Identity lock validation intensity */
    identityLockStrength?: 'off' | 'standard' | 'maximum';
    /** @property {IdentityAnchor} identityAnchor - Complete identity anchor with neutral reference */
    identityAnchor?: IdentityAnchor;
    /** @property {Style} style - The primary artistic style for the sticker. */
    style: Style;
    /** @property {Palette} palette - The color palette for the sticker. */
    palette: Palette;
    /** @property {LineStyle} lineStyle - The style of outlines for the sticker. */
    lineStyle: LineStyle;
    /** @property {ShadingStyle} shadingStyle - The style of shading for the sticker. */
    shadingStyle: ShadingStyle;
    /** @property {OutputResolution} resolution - The output resolution in pixels (e.g., 512, 768, 1024). */
    resolution: OutputResolution;
    /** @property {Composition} composition - The framing of the character (e.g., "Headshot", "Full-Body"). */
    composition: Composition;
    /** @property {boolean} addDieCutBorder - Whether to add a white die-cut border (feature not currently implemented). */
    addDieCutBorder: boolean;
    /** @property {boolean} addSolidBackground - Whether to add a solid background color (feature not currently implemented). */
    addSolidBackground: boolean;
    /** @property {string} backgroundColor - The background color if `addSolidBackground` is true. */
    backgroundColor: string;
    /** @property {string[]} selectedExpressions - An array of names for the selected sticker expressions to be generated. */
    selectedExpressions: string[];
    /** @property {Record<string, string> | undefined} speechBubbles - A mapping of expression names to custom speech bubble text. */
    speechBubbles?: Record<string, string>;
    /** @property {AnimationStyle} animationStyle - The style of animation for animated stickers. */
    animationStyle: AnimationStyle;
    /** @property {string} customAnimationPrompt - A user-provided prompt for a custom animation. */
    customAnimationPrompt: string;
    /** @property {number} packSize - The number of stickers to generate in a static pack. */
    packSize: number;
    /** @property {string} animationSpeed - The speed of the animation (e.g., '0.5x', '2x'). */
    animationSpeed?: string;
    /** @property {string} animationLoopStyle - The loop style of the animation (e.g., 'infinite', 'bounce'). */
    animationLoopStyle?: string;
    /** @property {string} animationEasing - The easing function for the animation (e.g., 'ease-in', 'linear'). */
    animationEasing?: string;
}

/**
 * @interface Expression
 * @description Defines the structure for a selectable sticker expression, including its name,
 * AI prompt description, UI icon, and category.
 */
export interface Expression {
    /** @property {string} name - The unique name/ID of the expression (e.g., "Thumbs Up"). */
    name: string;
    /** @property {string} description - A detailed text description used in the AI prompt to generate this expression. */
    description: string;
    /** @property {React.ReactNode | undefined} icon - The React component for the icon displayed in the UI. */
    icon?: React.ReactNode;
    /** @property {string | undefined} speechBubble - Default text for a speech bubble associated with this expression. */
    speechBubble?: string;
    /** @property {ExpressionCategory} category - The category for UI grouping (e.g., 'Gestures', 'Emotions'). */
    category: ExpressionCategory;
}

/**
 * @interface WallpaperSettings
 * @description Defines all user-configurable options for generating wallpapers.
 */
export interface WallpaperSettings {
    /** @property {string[]} selectedCharacterIds - An array of character IDs from the library to be included in the wallpaper. */
    selectedCharacterIds: string[];
    /** @property {string} customPrompt - The main text prompt describing the wallpaper scene. */
    customPrompt: string;
    /** @property {string | null} selectedPresetId - The ID of a selected preset, if any. */
    selectedPresetId: string | null;
    /** @property {WallpaperSize} size - The desired size and aspect ratio of the wallpaper. */
    size: WallpaperSize;
    /** @property {'Center' | ...} characterPosition - How characters are positioned in the scene. */
    characterPosition: 'Center' | 'Left' | 'Right' | 'Bottom' | 'Multiple' | 'Floating' | 'Scattered';
    /** @property {number} characterSize - The relative size of the characters in the scene, as a percentage. */
    characterSize: number;
    /** @property {number} backgroundIntensity - The intensity of the background elements, as a percentage. */
    backgroundIntensity: number;
    /** @property {BlendingMode} blendingMode - How characters are blended with the background lighting. */
    blendingMode: BlendingMode;
    /** @property {LightingStyle} lightingStyle - The style of lighting applied to the characters. */
    lightingStyle: LightingStyle;
    /** @property {QualityLevel} qualityLevel - The overall quality and detail level of the generation. */
    qualityLevel: QualityLevel;
    /** @property {boolean | undefined} useSmartContextAdaptation - When enabled, uses a more advanced AI pipeline to intelligently adapt characters to the scene. */
    useSmartContextAdaptation?: boolean;
}

/** @description The type of the generated asset. */
export type GeneratedResultType = 'image' | 'video' | 'svg' | 'wallpaper';
export type OperationType = 'sticker' | 'wallpaper' | 'remix' | 'animation';

export interface RemixSettings {
    backgroundPrompt?: string;
    foregroundPrompt?: string;
    step?: 'remix' | 'background' | 'composite';
}

/**
 * @interface GeneratedResult
 * @description Represents a single generated asset (sticker or wallpaper), containing its data,
 * the prompt used, and a snapshot of the settings. This is now used to track every generation attempt.
 */
export interface GeneratedResult {
    /** @property {string} id - A unique identifier for the result. */
    id: string;
    /** @property {GeneratedResultType} type - The type of the generated asset. */
    type: GeneratedResultType;
    /** @property {string} dataUrl - The base64 data URL of the generated asset. */
    dataUrl: string;
    /** @property {string} prompt - The full prompt used to generate this asset. */
    prompt: string;
    /** @property {Partial<Settings> | WallpaperSettings} settings - A snapshot of the settings used for generation. */
    settings: Partial<Settings> | WallpaperSettings | RemixSettings;
    /** @property {string | undefined} sourceExpression - The specific expression name used for this sticker, if applicable. */
    sourceExpression?: string;
    /** @property {ValidationResult} validation - Identity validation results if using Identity Lock V2 */
    validation?: ValidationResult;
    /** @property {number} attempts - Number of generation attempts made */
    attempts?: number;
    /** @property {string | undefined} characterId - The character ID used for this result (for gallery linking). */
    characterId?: string; 
    /** @property {string[] | undefined} characterIds - The character IDs used for this wallpaper. */
    characterIds?: string[];
    /** @property {string | undefined} timestamp - ISO string of when the item was generated. */
    timestamp?: string;
    /** @property {number | undefined} creditCost - The number of credits this generation cost. */
    creditCost?: number;
    /** @property {OperationType | undefined} operationType - The type of operation performed. */
    operationType?: OperationType;
    /** @property {number | undefined} generationTimeMs - The duration of the generation in milliseconds. */
    generationTimeMs?: number;
    /** @property {string | undefined} modelUsed - The identifier of the AI model used for generation. */
    modelUsed?: string;
    /** @property {boolean | undefined} success - Whether the generation succeeded or failed. */
    success?: boolean;
    /** @property {string | undefined} errorMessage - Error details if the generation failed. */
    errorMessage?: string;
}

/**
 * @interface CollectionItem
 * @description Represents a structured item within the user's collection, providing a stable
 * interface for the collection UI components.
 */
export interface CollectionItem {
    /** @property {string} id - A unique identifier. */
    id: string;
    /** @property {'image' | 'video' | 'wallpaper'} type - The type of the asset. */
    type: 'image' | 'video' | 'wallpaper';
    /** @property {string} dataUrl - The base64 data URL. */
    dataUrl: string;
    /** @property {string | undefined} thumbnail - Optional thumbnail data URL. */
    thumbnail?: string;
    /** @property {object} metadata - A collection of metadata for display and filtering. */
    metadata: {
      expression?: string;
      style?: string;
      dateAdded: string;
      settings: Partial<Settings> | WallpaperSettings | RemixSettings;
      success?: boolean;
      errorMessage?: string;
    };
  }

/**
 * @interface ViewerImage
 * @description A simplified structure for images passed to the global image viewer modal.
 */
export interface ViewerImage {
    /** @property {string} id - A unique identifier. */
    id: string;
    /** @property {string} dataUrl - The base64 data URL. */
    dataUrl: string;
    /** @property {GeneratedResultType} type - The type of the asset. */
    type: GeneratedResultType;
    /** @property {Partial<Settings> | WallpaperSettings | undefined} settings - Optional settings snapshot. */
    settings?: Partial<Settings> | WallpaperSettings | RemixSettings;
    /** @property {string | undefined} prompt - Optional generation prompt. */
    prompt?: string;
    /** @property {string | undefined} sourceExpression - The specific expression name used for this sticker. */
    sourceExpression?: string;
}

/** @description The type of an entry in the user-facing activity log. */
export type LogEntryType = 'info' | 'success' | 'error' | 'credit' | 'system';

/**
 * @interface LogEntry
 * @description Represents a single entry in the user-facing activity log.
 */
export interface LogEntry {
    /** @property {string} id - A unique identifier for the log entry. */
    id: string;
    /** @property {Date} timestamp - The time the event occurred. */
    timestamp: Date;
    /** @property {LogEntryType} type - The type of the log entry, for styling. */
    type: LogEntryType;
    /** @property {string} message - The message to display to the user. */
    message: string;
}

/**
 * @interface CreditTransaction
 * @description Represents a single credit transaction for the audit trail.
 */
export interface CreditTransaction {
    id: string;
    timestamp: string;
    type: 'deduction' | 'refund' | 'grant';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    reason: string;
    metadata?: Record<string, any>;
}

/** @description The current high-level phase of the application (e.g., loading screen vs. main studio). */
export type AppPhase = 'landing' | 'transitioning' | 'studio';
/** @description The primary mode of the studio (creating stickers, wallpapers, or remixing photos). */
export type AppMode = 'stickers' | 'wallpapers' | 'remix';
/** @description The layout mode for the main studio UI (e.g., stacked on mobile, side-by-side on desktop). */
export type LayoutMode = 'auto' | 'side-by-side' | 'stacked' | 'dual-pane';

/** @description The current step in the multi-stage image calibration workflow. */
export type CalibrationStep = 'idle' | 'pre-analyzing' | 'subject-selection' | 'calibrating' | 'awaiting-verification' | 'confirmed' | 'auto-calibrating';

/**
 * @interface DetectedSubject
 * @description Represents a single human subject detected in an uploaded image by the AI.
 */
export interface DetectedSubject {
    /** @property {string} id - A unique identifier for the detected subject. */
    id: string;
    /** @property {string} description - A brief description of the subject (e.g., "person on the left"). */
    description: string;
    /** @property {[number, number, number, number]} boundingBox - Normalized bounding box coordinates [y1, x1, y2, x2]. */
    boundingBox: [number, number, number, number];
}

/**
 * @interface Character
 * @description Represents a saved character in the user's library, containing their identity template and metadata.
 */
export interface Character {
    /** @property {string} id - A unique identifier for the character. */
    id: string;
    /** @property {string} name - The user-assigned name of the character. */
    name: string;
    /** @property {string} imageId - The ID of the character's image in the IndexedDB image cache. */
    imageId: string; 
    /** @property {string | undefined} ageGroup - AI-analyzed age group. */
    ageGroup?: string;
    /** @property {string | undefined} gender - AI-analyzed gender. */
    gender?: string;
    /** @property {string | undefined} ethnicity - AI-analyzed ethnicity. */
    ethnicity?: string;
    /** @property {'uploaded' | 'generated' | 'group' | 'sticker' | undefined} type - The source of the character. */
    type?: 'uploaded' | 'generated' | 'group' | 'sticker';
    /** @property {Date | undefined} createdAt - The date the character was created. */
    createdAt?: Date;
    /** @property {string | undefined} identityTemplate - The JSON string of the AI facial analysis for this character. */
    identityTemplate?: string; 
    /** @property {string[] | undefined} tags - User-editable tags for organization. */
    tags?: string[];
    /** @property {string | undefined} mood - The AI-analyzed mood from the source image. */
    mood?: string;
    /** @property {string | undefined} style - The AI-analyzed style of the source image. */
    style?: string;
    /** @property {string[] | undefined} recommendedPresets - A list of recommended wallpaper preset IDs for this character. */
    recommendedPresets?: string[];
}

/** @description The type of action a confirmation dialog is for (e.g., 'generate-stickers'). */
export type ConfirmationAction = 'generate-stickers' | 'generate-wallpaper' | 'calibrate' | 'create-character' | 'generate-remix-single' | 'generate-remix-group' | 'delete-dev-log-entry';

/**
 * @interface ConfirmationRequest
 * @description Holds all the details needed to display a confirmation dialog to the user,
 * such as the title, message, and credit cost of an action.
 */
export interface ConfirmationRequest {
    /** @property {string} title - The title of the confirmation dialog. */
    title: string;
    /** @property {string} message - The descriptive message explaining the action. */
    message: string;
    /** @property {number} cost - The credit cost of the action. */
    cost: number;
    /** @property {ConfirmationAction} actionType - The type of action being confirmed. */
    actionType: ConfirmationAction;
    /** @property {object | undefined} context - Any additional data needed to execute the action after confirmation. */
    context?: {
        id?: string;
        base64Image?: string;
        namePrefix?: string;
        subjects?: DetectedSubject[];
        cost?: number;
    };
}

/** @description The type of action a generic text input modal is for. */
export type TextInputAction = 'name-character' | 'add-speech-bubble' | 'name-group-photo' | 'name-sticker-character';

/**
 * @interface TextInputRequest
 * @description Holds the details for a generic text input modal, replacing `window.prompt`.
 */
export interface TextInputRequest {
    /** @property {string} title - The title of the modal. */
    title: string;
    /** @property {string} message - The descriptive message for the user. */
    message: string;
    /** @property {string} initialValue - The initial value for the text input. */
    initialValue: string;
    /** @property {string} confirmText - The text for the confirm button. */
    confirmText: string;
    /** @property {TextInputAction} actionType - The type of action this input is for. */
    actionType: TextInputAction;
    /** @property {any | undefined} context - Any additional data needed to process the input. */
    context?: any;
}


// --- STATE SLICES ---
// These interfaces define the logical sections of the application's state.

/**
 * @interface AppCoreState
 * @description Manages core application status like phase, mode, errors, credits, and logs.
 */
export interface AppCoreState {
    appPhase: AppPhase;
    appMode: AppMode;
    error: string | null;
    credits: number;
    activityLog: LogEntry[];
    creditTransactions: CreditTransaction[];
    onboardingCompleted: {
        stickers: boolean;
        wallpapers: boolean;
        remix: boolean;
    };
    simpleMode: boolean;
    devLog: DevLogEntry[];
}

/**
 * @interface SettingsState
 * @description Holds all user-configurable settings for both sticker and wallpaper generation.
 */
export interface SettingsState {
    settings: Settings;
    wallpaperSettings: WallpaperSettings;
}

/**
 * @interface GenerationState
 * @description Tracks the status of all asynchronous generation and processing tasks.
 */
export interface GenerationState {
    isLoading: boolean;
    isCalibrating: boolean;
    isCreatingCharacter: boolean;
    isPreAnalyzing: boolean;
    loadingMessage: string;
    results: GeneratedResult[];
}

/**
 * @interface CalibrationState
 * @description Manages the state of the multi-step identity calibration process.
 */
export interface CalibrationState {
    calibrationStep: CalibrationStep;
    calibrationWarning: string | null;
    detectedSubjects: DetectedSubject[] | null;
    selectedSubjectId: string | null;
    validatedIdentityAnchorImageId: string | null;
    validatedIdentityTemplate?: string | null;
    verificationImageId: string | null;
}

/**
 * @interface CharacterState
 * @description Holds the user's library of saved characters.
 */
export interface CharacterState {
    characterLibrary: Character[];
}

/**
 * @interface RemixState
 * @description Manages all data for the Photo Remix feature, including images at each step and user inputs.
 */
export interface RemixState {
    originalImage: string | null;
    cutoutImage: string | null;
    remixedCutoutImage: string | null;
    generatedBackground: string | null;
    finalImage: string | null;
    sceneSuggestions: SceneSuggestion[] | null;
    backgroundPrompt: string;
    foregroundPrompt: string;
    isGroupPhoto: boolean;
    detectedSubjects: DetectedSubject[] | null;
}

/**
 * @interface UIState
 * @description Manages the state of the user interface, including modals, dialogs, layout, and other UI elements.
 */
export interface UIState {
    layoutMode: LayoutMode;
    feedbackBin: GeneratedResult[];
    isCollectionOpen: boolean;
    editingResult: GeneratedResult | null;
    isEditingModalOpen: boolean;
    isCropModalOpen: boolean;
    imageToCrop: { id: string, subjects: DetectedSubject[] } | null;
    confirmationRequest: ConfirmationRequest | null;
    isCreditsModalOpen: boolean;
    groupPhotoSuccessInfo: { characterName: string } | null;
    isDevLogOpen: boolean;
    isViewerOpen: boolean;
    viewerImages: ViewerImage[];
    viewerStartIndex: number;
    remixState: RemixState;
    isTextInputModalOpen: boolean;
    textInputRequest: TextInputRequest | null;
    /** A temporary character being transferred from sticker generation to the wallpaper studio. */
    transferredCharacter: (Character & { imageDataUrl: string }) | null;
    recentGenerations: GeneratedResult[];
}

// --- COMBINED STATE ---

/**
 * @interface PresentAppState
 * @description The complete state of the application at any given moment, excluding undo/redo history.
 * It combines all the individual state slices into a single, flat object.
 */
export interface PresentAppState extends AppCoreState, SettingsState, GenerationState, CalibrationState, CharacterState, UIState {}

/**
 * @interface AppState
 * @description The top-level state object for the entire application, including the
 * `past` and `future` arrays which are managed by the history reducer for undo/redo functionality.
 */
export interface AppState extends PresentAppState {
    /** @property {PresentAppState[]} past - An array of previous states for the undo history. */
    past: PresentAppState[];
    /** @property {PresentAppState[]} future - An array of future states for the redo history. */
    future: PresentAppState[];
}


// --- ACTIONS ---

/**
 * @type Action
 * @description A discriminated union of all possible actions that can be dispatched to the reducer.
 * This ensures type safety for action payloads and is a core part of the `useReducer` pattern.
 */
export type Action =
    // Core Actions
    | { type: 'REHYDRATE_STATE', payload: Partial<PresentAppState> }
    | { type: 'APPLY_SHARED_STATE', payload: { settings?: Partial<Settings>, wallpaperSettings?: Partial<WallpaperSettings> } }
    | { type: 'SET_APP_MODE', payload: AppMode }
    | { type: 'START_TRANSITION' }
    | { type: 'FINISH_TRANSITION' }
    | { type: 'CHANGE_CREDITS_BY', payload: { amount: number; reason: string; metadata?: Record<string, any> } }
    | { type: 'ADD_LOG_ENTRY', payload: { type: LogEntryType, message: string } }
    | { type: 'CLEAR_LOG' }
    | { type: 'COMPLETE_ONBOARDING_FOR_MODE', payload: AppMode }
    | { type: 'TOGGLE_SIMPLE_MODE' }
    
    // Settings Actions
    | { type: 'SET_SETTING', payload: Partial<Settings> }
    | { type: 'SET_SETTINGS', payload: Settings }
    | { type: 'RANDOMIZE_STYLE_ONLY', payload: Partial<Settings> }
    | { type: 'RANDOMIZE_PROMPT' }
    | { type: 'SET_WALLPAPER_SETTING', payload: Partial<WallpaperSettings> }
    
    // Generation Actions
    | { type: 'START_GENERATION', payload: string }
    | { type: 'GENERATION_COMPLETE', payload: GeneratedResult[] }
    | { type: 'ADD_RESULT', payload: GeneratedResult }
    | { type: 'FINISH_GENERATION' }
    | { type: 'GENERATION_ERROR', payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'CLEAR_RESULTS' }
    | { type: 'SET_LOADING_MESSAGE', payload: string }
    | { type: 'START_WALLPAPER_GENERATION', payload: string }
    
    // Calibration Actions
    | { type: 'START_CALIBRATION', payload: { step: CalibrationStep, message: string } }
    | { type: 'SELECT_SUBJECT', payload: string }
    | { type: 'VERIFICATION_READY', payload: { validatedAnchorImageId: string, verificationImageId: string, pose: string, identityTemplate: string } }
    | { type: 'APPROVE_VERIFICATION' }
    | { type: 'REJECT_VERIFICATION' }
    | { type: 'RESET_CALIBRATION' }
    | { type: 'CLEAR_UPLOADED_IMAGE' }
    | { type: 'SET_CALIBRATION_WARNING', payload: string }
    | { type: 'START_PRE_ANALYSIS' }
    | { type: 'APPLY_CROP', payload: string }
    | { type: 'TRIGGER_AUTO_CALIBRATION' }
    | { type: 'AUTO_CALIBRATE_COMPLETE'; payload: { validatedAnchorImageId: string; pose: string; identityTemplate: string } }
    | { type: 'SET_CALIBRATION_STEP', payload: CalibrationStep }

    // Character Actions
    | { type: 'START_CHARACTER_CREATION' }
    | { type: 'FINISH_CHARACTER_CREATION' }
    | { type: 'ADD_CHARACTER', payload: Character }
    | { type: 'UPDATE_CHARACTER', payload: Character }
    | { type: 'REMOVE_CHARACTER', payload: string }
    
    // UI Actions
    | { type: 'SET_LAYOUT_MODE', payload: LayoutMode }
    | { type: 'ADD_RESULTS_TO_COLLECTION', payload: GeneratedResult[] }
    | { type: 'REMOVE_FROM_FEEDBACK_BIN', payload: string }
    | { type: 'CLEAR_FEEDBACK_BIN' }
    | { type: 'OPEN_COLLECTION_MODAL' }
    | { type: 'CLOSE_COLLECTION_MODAL' }
    | { type: 'OPEN_EDITING_MODAL', payload: GeneratedResult }
    | { type: 'CLOSE_EDITING_MODAL' }
    | { type: 'UPDATE_EDITING_RESULT', payload: GeneratedResult }
    | { type: 'OPEN_CROP_MODAL', payload: { id: string, subjects: DetectedSubject[] } }
    | { type: 'CLOSE_CROP_MODAL' }
    | { type: 'REQUEST_CONFIRMATION', payload: ConfirmationRequest }
    | { type: 'CANCEL_CONFIRMATION' }
    | { type: 'OPEN_CREDITS_MODAL' }
    | { type: 'CLOSE_CREDITS_MODAL' }
    | { type: 'SHOW_GROUP_PHOTO_SUCCESS', payload: { characterName: string } }
    | { type: 'HIDE_GROUP_PHOTO_SUCCESS' }
    | { type: 'OPEN_TEXT_INPUT_MODAL', payload: TextInputRequest }
    | { type: 'CLOSE_TEXT_INPUT_MODAL' }
    | { type: 'OPEN_VIEWER', payload: { images: ViewerImage[], startIndex: number } }
    | { type: 'CLOSE_VIEWER' }
    | { type: 'SET_REMIX_STATE', payload: Partial<RemixState> }
    | { type: 'CLEAR_REMIX_STATE' }
    | { type: 'TRANSFER_CHARACTER_TO_WALLPAPER', payload: Character & { imageDataUrl: string } }
    | { type: 'CLEAR_TRANSFERRED_CHARACTER' }
    | { type: 'ADD_TO_RECENT_GENERATIONS', payload: GeneratedResult }
    
    // History Actions
    | { type: 'UNDO' }
    | { type: 'REDO' }

    // Dev Log Actions
    | { type: 'LOAD_DEV_LOG', payload: DevLogEntry[] }
    | { type: 'OPEN_DEV_LOG' }
    | { type: 'CLOSE_DEV_LOG' }
    | { type: 'DELETE_DEV_LOG_ENTRY', payload: string };