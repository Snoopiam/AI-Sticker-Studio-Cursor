/**
 * @file utils/stateManager.ts
 * @description Provides utility functions related to application state management,
 * such as handling the undo/redo history stack and generating filenames for downloads.
 */
import JSZip from 'jszip';
import type { GeneratedResult, Settings, WallpaperSettings, ViewerImage } from '../types';
import { WALLPAPER_PRESETS } from '../constants';

/** The maximum number of states to keep in the undo history. */
const MAX_HISTORY_SIZE = 50;

/**
 * Adds the current state to the 'past' history array, ensuring it doesn't exceed the max size.
 * @template T - The type of the state object.
 * @param {T[]} past - The array of past states.
 * @param {T} current - The current state to add to the history.
 * @returns {T[]} The new array of past states.
 */
export function addToHistory<T>(past: T[], current: T): T[] {
    const newPast = [...past, current];
    if (newPast.length > MAX_HISTORY_SIZE) {
        // Slice from the start to remove the oldest entry.
        return newPast.slice(1);
    }
    return newPast;
}

/**
 * A simple utility to convert a string into a URL-friendly slug.
 * @param {string} [text=''] - The text to slugify.
 * @returns {string} The slugified text.
 */
const slugify = (text: string = ''): string => text.toString().toLowerCase()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')           // Trim - from start of text
    .replace(/-+$/, '')            // Trim - from end of text
    .substring(0, 50);          // Truncate to 50 chars

/**
 * Generates a descriptive filename for a given generated result.
 * @param {GeneratedResult | ViewerImage} result - The generated result object.
 * @returns {string} The generated filename with extension.
 */
const generateFilename = (result: GeneratedResult | ViewerImage): string => {
    const extension = result.type === 'svg' ? 'svg' : result.type === 'video' ? 'mp4' : 'png';
    let fileName = `ai-studio-result-${result.id.substring(0, 8)}`; // Fallback filename
    const shortId = result.id.substring(0, 6);

    if (result.type === 'wallpaper' && result.settings) {
        const settings = result.settings as WallpaperSettings;
        let promptPart = 'custom';
        if (settings.selectedPresetId) {
            const preset = WALLPAPER_PRESETS.find(p => p.id === settings.selectedPresetId);
            promptPart = slugify(preset?.name || 'preset');
        } else if (settings.customPrompt) {
            promptPart = slugify(settings.customPrompt.split(' ').slice(0, 4).join(' '));
        }
        fileName = `wallpaper_${promptPart}_${shortId}`;
    } else if (result.settings) { // Stickers
        const settings = result.settings as Partial<Settings>;
        const style = slugify(settings.style || 'sticker');
        
        const expression = slugify(result.sourceExpression || settings.selectedExpressions?.join('_') || 'custom');
        const subject = slugify(settings.subject || 'character');
        const mainPart = settings.mode === 'text-to-image' ? subject : expression;
        fileName = `${style}_${mainPart}_${shortId}`;
    }

    return `${fileName}.${extension}`;
};


/**
 * Initiates a download for a single generated result.
 * @param {GeneratedResult | ViewerImage} result - The result object to download.
 */
export const downloadResult = (result: GeneratedResult | ViewerImage) => {
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = generateFilename(result);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


/**
 * Creates a ZIP archive of multiple results and initiates a download.
 * @param {GeneratedResult[]} results - An array of results to include in the ZIP.
 * @param {string} [filename='AI-Sticker-Studio-Collection.zip'] - The desired filename for the archive.
 */
export const downloadCollectionAsZip = async (results: GeneratedResult[], filename: string = 'AI-Sticker-Studio-Collection.zip') => {
    const zip = new JSZip();
    
    // Add each result to the zip file.
    results.forEach(result => {
        const base64Data = result.dataUrl.split(',')[1];
        const fileName = generateFilename(result);
        zip.file(fileName, base64Data, { base64: true });
    });

    // Generate the ZIP file content and trigger the download.
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};