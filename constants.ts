/**
 * @file constants.ts
 * @description This file defines constant values used throughout the application,
 * such as available styles, palettes, and other configuration options. It serves as a
 * single source of truth for "magic numbers" and static data, improving maintainability.
 */

import type { WallpaperPreset } from './constants/wallpaperPresets';

// --- TYPE DEFINITIONS for UI Selectors ---

/** @description Defines the available primary artistic styles for sticker generation. */
export type Style = 'Cartoon Vector' | 'Kawaii' | 'Lineart' | 'Flat' | 'WPAP' | 'Pop' | 'Tritone' | 'Dotwork' | 'Watercolor' | 'Oil Painting' | 'Pencil Sketch' | 'Photorealistic' | '3D Render' | 'Chibi' | 'Sticker Style';
/** @description Defines the available color palettes for sticker generation. */
export type Palette = 'Vibrant' | 'Pastel' | 'Monochrome';
/** @description Defines the available line/outline styles for sticker generation. */
export type LineStyle = 'Bold' | 'Thin' | 'Hand-drawn' | 'Smooth' | 'None';
/** @description Defines the available shading styles for sticker generation. */
export type ShadingStyle = 'Flat' | 'Cel-shading' | 'Gradient' | 'None';
/** @description Defines the available output resolutions for generated images. */
export type OutputResolution = 512 | 768 | 1024;
/** @description Defines the available character framing/composition options. */
export type Composition = 'Headshot / Bust' | 'Half-Body' | 'Full-Body';
/** @description Defines the available animation styles for animated stickers. */
export type AnimationStyle = 'Subtle Movement' | 'Bouncing' | 'Wiggle' | 'Spinning' | 'Shimmering' | 'Floating' | 'Pulsing' | 'Glitching' | 'Zoom In-Out' | 'Custom';
/** @description Defines the categories for grouping expressions in the UI for better organization. */
export type ExpressionCategory = 'Gestures' | 'Emotions' | 'Reactions' | 'Props & Items' | 'Greetings' | 'Activities' | 'Poses' | 'Expressions of Surprise';


// --- CONSTANT ARRAYS for populating UI dropdowns ---

/** @description An array of all available primary artistic styles, used to populate the style dropdown. */
export const STYLES: Style[] = ['Cartoon Vector', 'Sticker Style', 'Kawaii', 'Chibi', '3D Render', 'Flat', 'Lineart', 'WPAP', 'Pop', 'Tritone', 'Dotwork', 'Watercolor', 'Oil Painting', 'Pencil Sketch', 'Photorealistic'];
/** @description An array of all available color palettes. */
export const PALETTES: Palette[] = ['Vibrant', 'Pastel', 'Monochrome'];
/** @description An array of all available line/outline styles. */
export const LINE_STYLES: LineStyle[] = ['Bold', 'Thin', 'Hand-drawn', 'Smooth', 'None'];
/** @description An array of all available shading styles. */
export const SHADING_STYLES: ShadingStyle[] = ['Flat', 'Cel-shading', 'Gradient', 'None'];
/** @description An array of all available output resolutions. */
export const RESOLUTIONS: OutputResolution[] = [512, 768, 1024];
/** @description An array of all available character framing options. */
export const COMPOSITIONS: Composition[] = ['Headshot / Bust', 'Half-Body', 'Full-Body'];
/** @description An array of all available pre-defined animation styles with metadata for the gallery. */
export const ANIMATION_STYLES = [
    { id: 'Subtle Movement', label: 'Subtle Movement', exampleUrl: '/examples/animations/subtle-movement.gif' },
    { id: 'Bouncing', label: 'Bouncing', exampleUrl: '/examples/animations/bouncing.gif' },
    { id: 'Wiggle', label: 'Wiggle', exampleUrl: '/examples/animations/wiggle.gif' },
    { id: 'Spinning', label: 'Spinning', exampleUrl: '/examples/animations/spinning.gif' },
    { id: 'Shimmering', label: 'Shimmering', exampleUrl: '/examples/animations/shimmering.gif' },
    { id: 'Floating', label: 'Floating', exampleUrl: '/examples/animations/floating.gif' },
    { id: 'Pulsing', label: 'Pulsing', exampleUrl: '/examples/animations/pulsing.gif' },
    { id: 'Glitching', label: 'Glitching', exampleUrl: '/examples/animations/glitching.gif' },
    { id: 'Zoom In-Out', label: 'Zoom In-Out', exampleUrl: '/examples/animations/zoom-in-out.gif' },
];

/**
 * @const STYLE_COMPATIBILITY
 * @description A critical mapping that defines which shading and line styles are compatible
 * with each primary artistic style. This is used to dynamically filter UI options, preventing
 * users from creating artistically incoherent prompts (e.g., a "Photorealistic" image with "Bold" outlines).
 * For styles with only one valid option (e.g., 'Lineart' must have 'None' for shading), the UI
 * dropdown will be disabled to enforce this rule.
 */
export const STYLE_COMPATIBILITY: Record<Style, { shading: ShadingStyle[], lines: LineStyle[] }> = {
    'Cartoon Vector': { shading: ['Cel-shading', 'Flat', 'Gradient'], lines: ['Bold', 'Thin', 'Smooth'] },
    'Sticker Style': { shading: ['Gradient', 'Cel-shading'], lines: ['Bold', 'Smooth'] },
    'Kawaii': { shading: ['Gradient', 'Cel-shading', 'Flat'], lines: ['Smooth', 'Thin', 'Bold'] },
    'Chibi': { shading: ['Cel-shading', 'Gradient'], lines: ['Bold', 'Smooth'] },
    '3D Render': { shading: ['Gradient'], lines: ['None'] },
    'Lineart': { shading: ['None'], lines: ['Thin', 'Bold', 'Hand-drawn', 'Smooth'] },
    'Flat': { shading: ['Flat'], lines: ['Smooth', 'Bold', 'Thin', 'None'] },
    'WPAP': { shading: ['Flat'], lines: ['Bold'] },
    'Pop': { shading: ['Flat', 'Cel-shading'], lines: ['Bold', 'Thin'] },
    'Tritone': { shading: ['Flat'], lines: ['Smooth', 'Bold', 'None'] },
    'Dotwork': { shading: ['None'], lines: ['Thin'] },
    'Watercolor': { shading: ['Gradient', 'None'], lines: ['Thin', 'Hand-drawn', 'None'] },
    'Oil Painting': { shading: ['Gradient'], lines: ['None', 'Smooth', 'Hand-drawn', 'Bold'] },
    'Pencil Sketch': { shading: ['None'], lines: ['Hand-drawn', 'Thin'] },
    'Photorealistic': { shading: ['Gradient'], lines: ['None'] },
};


// --- UI Logic Values ---

/** @description The minimum size (in pixels) for a manual crop selection. */
export const MIN_CROP_SIZE_PX = 20;
/** @description The target resolution for rasterizing SVG images into PNGs. */
export const RASTERIZE_RESOLUTION = 1024;
/** @description An array of available pack sizes for static sticker generation. */
export const PACK_SIZES = [1, 2, 4, 8, 12, 16, 20];
/** @description A custom MIME type string used for identifying drag-and-drop data within the application. */
export const DRAG_AND_DROP_TYPE = 'application/x-ai-sticker-studio-result';


// --- System Identifiers ---

/** @description The name of the IndexedDB database for storing the main application state. */
export const DB_NAME = 'aiStickerStudioDB';
/** @description The key used to store preserved state in sessionStorage during a manual app restart. */
export const SESSION_STORAGE_KEY = 'aiStickerStudioPreservedState';


// --- Assets & Placeholders ---

/** @description The path to the background image for the landing page. */
export const LANDING_PAGE_BACKGROUND_IMAGE = '/landing-bg.jpg';
/** @description A 1x1 transparent pixel data URL, used as a placeholder for text-to-image generation which requires an image input part. */
export const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


// --- Asynchronous Timings (in milliseconds) ---

/** @description An estimated duration for video generation, used for providing progress feedback to the user. */
export const VIDEO_GEN_ESTIMATED_DURATION_MS = 180000;
/** @description The interval at which to poll the status of a pending video generation operation. */
export const VIDEO_GEN_POLL_INTERVAL_MS = 10000;
/** @description The debounce delay for the auto-calibration trigger to prevent race conditions. */
export const AUTO_CALIBRATION_DEBOUNCE_MS = 100;
/** @description The interval for polling the DOM to find onboarding tooltip targets, necessary for lazy-loaded components. */
export const ONBOARDING_POLL_INTERVAL_MS = 100;
/** @description The maximum number of attempts to find an onboarding tooltip target before giving up. */
export const ONBOARDING_POLL_MAX_ATTEMPTS = 20;
/** @description The duration to show the "Copied!" success message in the feedback bin. */
export const FEEDBACK_COPY_SUCCESS_MS = 2000;
/** @description The duration to show the "Copied!" success message after copying a prompt from the AI assistant. */
export const FEEDBACK_ASK_AI_COPY_MS = 2500;


/**
 * @const CREDIT_COSTS
 * @description A centralized object for all credit costs in the application. Using a constant object
 * ensures consistency and makes it easy to adjust pricing.
 */
export const CREDIT_COSTS = {
    /** @description The cost to perform a manual or automatic identity calibration. */
    CALIBRATION: 1,
    /** @description The cost to create a new character from an uploaded photograph. */
    CHARACTER_CREATION: 2,
    /** @description The cost to generate a single animated sticker. */
    ANIMATED_STICKER: 1,
    /** @description The cost to generate a wallpaper. */
    WALLPAPER: 3,
    /** @description The cost for a single edit in the post-processing studio. */
    POST_PROCESSING_EDIT: 1,
    /** @description The base cost for a single-subject photo remix. */
    REMIX_SINGLE_SUBJECT: 5,
    /** @description The cost for the 'remix foreground' step in an advanced remix. */
    REMIX_STEP_REMIX: 1,
    /** @description The cost for the 'generate background' step in an advanced remix. */
    REMIX_STEP_BACKGROUND: 2,
    /** @description The cost for the 'composite' step in an advanced remix. */
    REMIX_STEP_COMPOSITE: 2,
    /** @description The base cost for a group photo remix, covering subject detection. */
    REMIX_GROUP_BASE: 1,
};

/** @description A consistent delay in milliseconds for pacing sequential API calls to avoid rate limits. */
export const API_PACING_DELAY_MS = 500;

/** @description The default name used for new characters created from photos or stickers. */
export const DEFAULT_CHARACTER_NAME = "New Character";

// --- LAZY-LOADED CONSTANTS RE-EXPORT ---
// Re-exporting these allows other files to import them from this central constants file
// while still benefiting from the lazy loading defined in their original files. This pattern
// centralizes imports for better maintainability.
export { EXPRESSIONS } from './constants/expressions';
export { WALLPAPER_PRESETS, WALLPAPER_SIZES, BLENDING_MODES, LIGHTING_STYLES, QUALITY_LEVELS } from './constants/wallpaperPresets';
export * from './constants/system';
export type { WallpaperPreset };