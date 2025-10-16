/**
 * @file geminiService.ts
 * @description This file contains all the service functions for interacting with the Google Gemini API.
 * It handles the initialization of the AI client, utility functions for data conversion,
 * and the core logic for generating images, videos, and analyzing content.
 */
import { GoogleGenAI, Part, Modality, Type, GenerateContentResponse } from "@google/genai";
import type { Settings, GeneratedResult, Expression, WallpaperSettings, WallpaperPreset, Character, DetectedSubject, LogEntryType, Style, SceneSuggestion, StickerAnalysis } from '../../types/types';
import { EXPRESSIONS, WALLPAPER_PRESETS, STYLE_COMPATIBILITY, API_PACING_DELAY_MS, VIDEO_GEN_ESTIMATED_DURATION_MS, VIDEO_GEN_POLL_INTERVAL_MS } from "../../constants";
import { safeApiCall } from "../apiUtils";
import { networkMonitor } from '../networkStatus';
import { apiSerializer } from '../apiSerializer';

// --- INITIALIZATION ---

/** A boolean flag indicating whether the Gemini API key is available in the environment variables. */
export const isApiKeySet = !!process.env.API_KEY;

if (!isApiKeySet) {
    console.warn("API_KEY environment variable not set. Gemini API calls will be disabled.");
}

/** 
 * The singleton instance of the GoogleGenAI client.
 * Initialized with the API key from environment variables.
 */
export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


// --- UTILITIES ---

/**
 * Converts a base64 data URL string into a `Part` object suitable for the Gemini API.
 * @param {string} base64 - The base64 data URL (e.g., "data:image/png;base64,...").
 * @returns {Part} A `Part` object containing the mimeType and base64 data.
 * @throws Will throw an error if the base64 string format is invalid.
 */
export const base64ToPart = (base64: string): Part => {
    const match = base64.match(/^data:(image\/.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 string format for base64ToPart");
    return { inlineData: { mimeType: match[1], data: match[2] } };
};


// --- CORE GENERATION SERVICES ---

/**
 * Generates a pack of static stickers based on the provided settings.
 * @param {Settings} settings - The current application settings for generation.
 * @param {string} identityAnchorImage - The base64 data URL of the identity anchor image.
 * @param {Expression[]} expressions - An array of expression objects to generate.
 * @param {(message: string) => void} onProgress - A callback to report progress.
 * @returns {Promise<GeneratedResult[]>} A promise that resolves to an array of generated sticker results.
 */
export const generateStaticStickers = async (
    settings: Settings,
    identityAnchorImage: string,
    expressions: Expression[],
    onProgress: (message: string) => void
): Promise<GeneratedResult[]> => {
    const results: GeneratedResult[] = [];
    let isGroup = false;

    // Check if the identity template indicates a group photo
    if (settings.identityTemplate) {
        try {
            const template = JSON.parse(settings.identityTemplate);
            if (Array.isArray(template) && template.length > 1) {
                isGroup = true;
            }
        } catch(e) { console.warn("Could not parse identity template to check for group photo."); }
    }

    const imagePart = base64ToPart(identityAnchorImage);

    for (let i = 0; i < expressions.length; i++) {
        const expression = expressions[i];
        onProgress(`Generating sticker ${i + 1} of ${expressions.length}: ${expression.name}...`);
        
        const expressionDescription = expression.speechBubble
            ? `${expression.description} The character should have a speech bubble saying "${expression.speechBubble}".`
            : expression.description;
        
        const characterTerm = isGroup ? "The characters are the people" : "The character is the person";

        const prompt = `
            You are a world-class digital illustrator specializing in clean, vibrant vector art for stickers. Your primary duty is to maintain perfect consistency with the provided Identity Lock profile.

            **Primary Directive:** The generated sticker MUST be a perfect likeness of the person in the provided photograph. All facial features, hair, and defining characteristics MUST be preserved exactly.

            **Identity Anchor:**
            -   **${characterTerm}** in the provided photograph.
            -   **Detailed Analysis:** ${settings.identityTemplate || 'No detailed analysis provided.'}

            **Sticker Task:**
            1.  **Expression/Pose:** Create a sticker of the character with the following expression: "${expressionDescription}"
            2.  **Artistic Style:**
                -   **Overall Style:** ${settings.style}
                -   **Color Palette:** ${settings.palette}
                -   **Line Style:** ${settings.lineStyle}
                -   **Shading Style:** ${settings.shadingStyle}
            3.  **Composition:** ${settings.composition}
            4.  **Output Format:** The final image MUST have a transparent background (alpha channel). It should be a professional, high-quality sticker.
            5.  **Negative Prompts:** Avoid the following: ${settings.negativePrompt || 'blurry, low-quality, text, watermarks'}
        `;

        const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
        }), { circuitName: 'generateStaticStickers' })) as GenerateContentResponse;
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imageResponsePart?.inlineData) throw new Error("Sticker generation failed: No image data in response.");
        
        const dataUrl = `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
        
        // Save each result with its own specific settings for reproducibility
        results.push({
            id: crypto.randomUUID(),
            type: 'image',
            dataUrl,
            prompt,
            settings: { ...settings, packSize: 1, selectedExpressions: [expression.name] },
            sourceExpression: expression.name,
        });

        if (i < expressions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, API_PACING_DELAY_MS));
        }
    }
    return results;
};

/**
 * Generates an animated sticker (video).
 * @param {Settings} settings - The application settings.
 * @param {string} identityAnchorImage - The base64 identity image.
 * @param {(message: string) => void} onProgress - A progress callback.
 * @param {AbortSignal} abortSignal - An AbortSignal to cancel the operation.
 * @returns {Promise<GeneratedResult>} A promise resolving to the generated video result.
 */
export const generateAnimatedSticker = async (
    settings: Settings,
    identityAnchorImage: string,
    onProgress: (message: string) => void,
    abortSignal: AbortSignal
): Promise<GeneratedResult> => {
    const animationPrompt = settings.animationStyle === 'Custom' 
        ? settings.customAnimationPrompt 
        : `A subtle, looping animation in the style of '${settings.animationStyle}'.`;

    const expression = EXPRESSIONS.find(e => e.name === settings.selectedExpressions[0]);
    if (!expression) throw new Error("Selected expression not found for animation.");

    const prompt = `
        You are a master motion graphics artist and animator specializing in short-form looping animations for digital stickers and GIFs. Your work has been featured in top messaging apps and you're known for creating mesmerizing, seamless loops that capture personality and emotion in 2-3 seconds.

        Your expertise includes:
        - Character animation and micro-expressions
        - Seamless loop composition and timing
        - Visual effects that enhance without overwhelming
        
        Create a premium animated sticker with these specifications:
        
        - **Subject Identity:** The character is the person in the provided image. Their identity, facial features, and hair MUST be preserved perfectly.
        - **Identity Analysis:** ${settings.identityTemplate || 'N/A'}
        - **Expression/Pose:** ${expression.description}
        - **Artistic Style:** ${settings.style}, ${settings.palette} colors, ${settings.lineStyle} lines, ${settings.shadingStyle} shading.
        - **Animation:** ${animationPrompt}. The animation must be a perfect, seamless loop.
        - **Composition:** ${settings.composition}.
        - **Advanced Animation Settings:** Speed: ${settings.animationSpeed || '1x'}, Loop: ${settings.animationLoopStyle || 'infinite'}, Easing: ${settings.animationEasing || 'linear'}.
        - **Output:** The final output should have a transparent background if possible.
    `;
    
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt,
        image: {
            imageBytes: identityAnchorImage.split(',')[1],
            mimeType: 'image/png',
        },
        config: { numberOfVideos: 1 }
    });

    const startTime = Date.now();
    while (!operation.done) {
        if (abortSignal.aborted) {
            const error = new Error('Generation cancelled by user.');
            error.name = 'AbortError';
            throw error;
        }
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(95, (elapsedTime / VIDEO_GEN_ESTIMATED_DURATION_MS) * 100);
        onProgress(`Generating animation... ${Math.round(progress)}%`);
        await new Promise(resolve => setTimeout(resolve, VIDEO_GEN_POLL_INTERVAL_MS));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: no download link found.");

    onProgress('Downloading and finalizing animation...');
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
    });

    return {
        id: crypto.randomUUID(),
        type: 'video',
        dataUrl,
        prompt,
        settings: { ...settings, packSize: 1 },
        sourceExpression: expression.name,
    };
};

/**
 * Generates a wallpaper based on the provided settings and characters.
 * @param {WallpaperSettings} wallpaperSettings - The settings for wallpaper generation.
 * @param {(Character & { imageDataUrl: string })[]} characters - The characters to include.
 * @param {(message: string) => void} onProgress - A progress callback.
 * @returns {Promise<GeneratedResult>} A promise resolving to the generated wallpaper result.
 */
export const generateWallpaper = async (
    wallpaperSettings: WallpaperSettings,
    characters: (Character & { imageDataUrl: string })[],
    onProgress: (message: string) => void
): Promise<GeneratedResult> => {
    let prompt = wallpaperSettings.customPrompt;
    
    // If a preset is selected and the custom prompt hasn't been modified, use the preset's prompt.
    const selectedPreset = WALLPAPER_PRESETS.find(p => p.id === wallpaperSettings.selectedPresetId);
    if (selectedPreset && prompt === selectedPreset.prompt) {
        prompt = selectedPreset.prompt;
    }
    
    if (characters.length > 0) {
        onProgress('Analyzing characters for wallpaper...');
        const characterDescriptions = characters.map(c => {
            // Concise character summary for wallpaper context - avoid long identityTemplate JSON
            const parts = [];
            if (c.gender) parts.push(c.gender);
            if (c.ageGroup) parts.push(c.ageGroup);
            
            // Extract only essential appearance details from identityTemplate if available
            let appearance = '';
            if (c.identityTemplate) {
                try {
                    const template = JSON.parse(c.identityTemplate);
                    if (template.distinctive_features?.hair_style && template.distinctive_features.hair_style !== 'none') {
                        appearance = ` with ${template.distinctive_features.hair_style} hair`;
                    }
                } catch(e) { 
                    // Fallback to basic description if parsing fails
                    appearance = '';
                }
            }
            
            const description = parts.length > 0 ? `${parts.join(', ')}${appearance}` : 'person';
            return `Character: ${c.name} (${description})`;
        }).join('\n');
        
        prompt += `\n\n**Characters to include:**\n${characterDescriptions}`;
    }
    
    prompt += `\n\n**Composition & Style:**\n- Wallpaper Size/Aspect Ratio: ${wallpaperSettings.size.name} / ${wallpaperSettings.size.aspectRatio}\n- Quality: ${wallpaperSettings.qualityLevel}\n- Character Position: ${wallpaperSettings.characterPosition}\n- Character Size: ${wallpaperSettings.characterSize}% of scene height.`;
    
    const finalPrompt = `
        You are a master digital artist and **style chameleon**, renowned for your ability to adapt your technique to any artistic style demanded by a project. You are a world-class expert in **character integration**, with a signature skill for making a character look perfectly natural in any environment, whether it's a photorealistic film scene, a vibrant anime city, or a whimsical oil painting.

        **Your Core Expertise:**
        - **Style Analysis & Adaptation:** You can instantly analyze the artistic style of any character and adapt the generated scene to be a cohesive match
        - **Smart Context Adaptation:** You are a master of matching lighting, shadows, color grading, and perspective to realistically blend characters into backgrounds
        - **Creative Ideation:** You excel at brainstorming diverse and compelling scene ideas that showcase characters in their best light

        **Your Signature Techniques:**
        - Masterful use of light and shadow to create depth and atmosphere
        - Composition that works flawlessly across different screen aspect ratios
        - Color palettes that remain vibrant without causing eye strain
        - Seamless integration of characters into environments with perfect style matching

        **CRITICAL STYLE INTEGRATION RULES:**
        - If a character's art style differs from the scene's style, your primary task is to blend them cohesively
        - Adapt the background style to be a harmonious mix of both styles, or subtly adjust the character's rendering to fit the new environment
        - The lighting and shadows on characters must be consistent with the lighting source in the scene
        - Never let characters look "pasted on" - they must appear naturally present in their environment

        Create a breathtaking, wallpaper-quality scene with these specifications:

        ${prompt}
    `;

    onProgress('Generating wallpaper...');
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: wallpaperSettings.size.aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const dataUrl = `data:image/png;base64,${base64ImageBytes}`;

    return {
        id: crypto.randomUUID(),
        type: 'wallpaper',
        dataUrl,
        prompt: finalPrompt,
        settings: wallpaperSettings,
        characterIds: characters.map(c => c.id)
    };
};

// --- IMAGE ANALYSIS & EDITING SERVICES ---

/**
 * Analyzes a sticker image to extract its identity, pose, and style.
 * @param {string} base64Image - The base64 sticker image.
 * @returns {Promise<StickerAnalysis>} A promise resolving to the analysis object.
 */
export const analyzeStickerContext = async (base64Image: string): Promise<StickerAnalysis> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `
        Analyze this sticker image which has a transparent background. Provide three distinct pieces of information in a JSON object:
        1.  **identityTemplate**: Create a detailed facial analysis JSON for the character, following the standard format (bone_structure, eye_biometrics, hair, etc.).
        2.  **pose**: A concise, one-sentence description of the character's pose and expression (e.g., "A joyful character giving a thumbs up").
        3.  **style**: A short phrase describing the artistic style of the sticker (e.g., "Clean Cartoon Vector", "Detailed 3D Render").

        Output ONLY the raw JSON object.
    `;
    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    }), { circuitName: 'analyzeSticker' })) as GenerateContentResponse;

    return JSON.parse(response.text);
};


/**
 * Analyzes a user-uploaded photo to detect subjects and check for quality issues.
 * @param {string} base64Image - The base64 photo.
 * @returns {Promise<{ subjects: DetectedSubject[], qualityWarning: string | null }>} A promise resolving to the analysis result.
 */
export const preAnalyzeImage = async (base64Image: string): Promise<{ subjects: DetectedSubject[], qualityWarning: string | null }> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `
        Analyze this photograph and provide a JSON object with two properties:
        1. 'subjects': An array of objects, where each object represents a person detected. For each person, provide:
           - 'id': A unique string identifier (e.g., "subject_1").
           - 'description': A brief, non-identifying description (e.g., "person on the left").
           - 'boundingBox': A normalized bounding box [y_min, x_min, y_max, x_max].
        2. 'qualityWarning': A string containing a user-friendly warning if the image quality is poor (e.g., blurry, bad lighting, face obscured), or null if the quality is good. Separate sentences with a pipe character '|'.
        
        If no human faces are clearly visible, return an empty 'subjects' array and set a qualityWarning.
    `;
    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    }), { circuitName: 'preAnalyzeImage' })) as GenerateContentResponse;

    return JSON.parse(response.text);
};


/**
 * Analyzes a character's face from a photo to generate an "Identity Template".
 * @param {string} base64Image - The base64 photo of the character.
 * @returns {Promise<string>} A promise resolving to the JSON string of the identity template.
 */
export const analyzeFaceStructure = async (base64Image: string): Promise<string> => {
     return apiSerializer.add(() => _analyzeFaceStructure(base64Image));
};
const _analyzeFaceStructure = async (base64Image: string): Promise<string> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `
        As a forensic facial analyst, your task is to create a detailed, structured JSON object describing the permanent facial features of the person in this photograph. Ignore transient expressions, lighting, and camera angles. Focus only on the underlying biometric identity.

        **Output Format:** Provide ONLY the raw JSON object with the following structure. Be as descriptive and precise as possible.

        {
          "bone_structure": {
            "face_shape": "oval/round/square/heart/diamond",
            "jawline": "e.g., 'strong and square' or 'soft and rounded'",
            "cheekbones": "e.g., 'high and prominent' or 'low and subtle'",
            "chin_shape": "e.g., 'pointed', 'square', 'rounded', 'cleft'"
          },
          "eye_biometrics": {
            "color": "e.g., 'deep brown with amber flecks'",
            "shape": "almond/round/hooded/upturned/downturned",
            "spacing": "wide-set/average/close-set",
            "eyebrows": "e.g., 'thick and arched' or 'thin and straight'"
          },
          "nose_structure": {
            "shape": "e.g., 'Roman with a high bridge' or 'button nose, slightly upturned'",
            "width": "narrow/medium/wide"
          },
          "mouth_features": {
            "lip_fullness": "full/medium/thin",
            "cupids_bow": "defined/subtle/undefined"
          },
          "hair": {
            "color": "e.g., 'jet black', 'ash blonde with highlights'",
            "style": "e.g., 'short crew cut', 'long wavy hair parted on the side'",
            "facial_hair": "e.g., 'clean-shaven', 'thick, well-groomed beard', 'light stubble'"
          },
          "distinctive_features": ["e.g., 'mole above left eyebrow', 'freckles across the nose', 'dimples when smiling', 'scar on chin'"]
        }
    `;
    const response = await safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    }), { circuitName: 'analyzeFaceStructure' }) as GenerateContentResponse;
    
    return response.text;
};

/**
 * Generates a neutral "faceprint" image for user verification.
 * @param {string} base64Image - The base64 source image.
 * @returns {Promise<GeneratedResult>} A promise resolving to the generated verification image result.
 */
export const generateVerificationImage = async (base64Image: string): Promise<GeneratedResult> => {
    return apiSerializer.add(() => _generateVerificationImage(base64Image));
};
const _generateVerificationImage = async (base64Image: string): Promise<GeneratedResult> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `
        **Task:** Create a neutral, forward-facing reference portrait of the person in the provided image.
        **Output Requirements:**
        -   **Pose:** Perfectly forward-facing, looking directly at the camera.
        -   **Expression:** Completely neutral (no smiling, no emotion).
        -   **Lighting:** Even, flat studio lighting.
        -   **Focus:** Sharp focus on all facial features.
        -   **Background:** Plain, solid light-gray background.
        **CRITICAL:** You must preserve the person's exact facial structure, features, skin tone, and hair from the original photo. Only change the expression, pose, and lighting. This is for an identity verification system.
    `;
    const response = await safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    }), { circuitName: 'generateVerificationImage' }) as GenerateContentResponse;
    
    const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imageResponsePart?.inlineData) throw new Error("Verification image generation failed.");

    return {
        id: crypto.randomUUID(),
        type: 'image',
        dataUrl: `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`,
        prompt,
        settings: {},
    };
};

/**
 * Analyzes an image to get a text description of the character's pose.
 * @param {string} base64Image - The base64 source image.
 * @returns {Promise<string>} A promise resolving to the pose description text.
 */
export const calibratePose = async (base64Image: string): Promise<string> => {
    return apiSerializer.add(() => _calibratePose(base64Image));
};
const _calibratePose = async (base64Image: string): Promise<string> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `Analyze the provided image and give a concise, one-sentence description of the person's pose and expression. For example: "A person smiling and giving a thumbs up."`;
    const response = await safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    }), { circuitName: 'calibratePose' }) as GenerateContentResponse;
    return response.text;
};

/**
 * Analyzes an image to generate a character profile.
 * @param {string} base64Image - The base64 source image.
 * @returns {Promise<Partial<Character>>} A promise resolving to the character analysis.
 */
export const analyzeCharacter = async (base64Image: string): Promise<Partial<Character>> => {
     const imagePart = base64ToPart(base64Image);
    const prompt = `
        Analyze the person in this photo and return a JSON object with the following properties:
        - 'gender': "Male", "Female", or "Non-binary".
        - 'ageGroup': "Child", "Teenager", "Young Adult", "Adult", "Senior".
        - 'ethnicity': A best guess at the person's ethnicity.
        - 'identityTemplate': A detailed JSON string of their facial analysis (bone structure, eyes, hair, etc.).
        - 'mood': The dominant mood or emotion conveyed (e.g., 'Joyful', 'Serious', 'Thoughtful').
        - 'style': The overall style of the photo (e.g., 'Candid Portrait', 'Professional Headshot', 'Action Shot').
        Output ONLY the raw JSON object.
    `;
    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    }), { circuitName: 'analyzeCharacter' })) as GenerateContentResponse;
    
    return JSON.parse(response.text);
};


/**
 * Analyzes a photo and suggests creative remix ideas.
 * @param {string} base64Image - The base64 source photo.
 * @returns {Promise<SceneSuggestion[]>} A promise resolving to an array of scene suggestions.
 */
export const analyzeAndSuggestScenes = async (base64Image: string): Promise<SceneSuggestion[]> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = `
        You are a creative director for a visual effects studio. Analyze the subjects and context of this image and generate 4 diverse, creative ideas for a "photo remix". For each idea, provide a JSON object with three properties: "title" (a short, catchy name for the idea), "backgroundPrompt" (a detailed prompt for an AI to generate a new background scene), and "foregroundPrompt" (a detailed prompt for how to artistically modify the subjects to fit the new scene).

        Return your answer as a valid JSON array of these objects.
    `;

    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json" }
    }), { circuitName: 'suggestScenes' })) as GenerateContentResponse;
    
    return JSON.parse(response.text);
};

// --- PHOTO REMIX WORKFLOW SERVICES ---

/**
 * Removes the background from an image.
 * @param {string} base64Image - The base64 source image.
 * @returns {Promise<string>} A promise resolving to the base64 image with a transparent background.
 */
export const segmentImage = async (base64Image: string): Promise<string> => {
    const imagePart = base64ToPart(base64Image);
    const prompt = "Your single task is to perform a perfect, studio-quality background removal on this image. Isolate all foreground subjects from their background. The output MUST have a transparent alpha channel. Do not add any effects or change the subjects themselves.";

    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    }), { circuitName: 'segmentImage' })) as GenerateContentResponse;

    const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imageResponsePart?.inlineData) throw new Error("Image segmentation failed.");
    return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
};

/**
 * Artistically modifies a foreground image based on a prompt.
 * @param {string} cutoutBase64 - The base64 foreground image (with transparency).
 * @param {string} prompt - The prompt describing the desired modifications.
 * @returns {Promise<string>} A promise resolving to the remixed foreground image.
 */
export const remixForeground = async (cutoutBase64: string, prompt: string): Promise<string> => {
    const imagePart = base64ToPart(cutoutBase64);
    const fullPrompt = `You are a Lead VFX Compositor from a world-class film studio, renowned for your mastery of photorealistic integration, light, and shadow. You specialize in seamlessly blending real-world elements with artistic modifications while preserving core identity.

**Your Core Expertise:**
- Photorealistic Integration: Seamlessly blending modifications with the original subject
- Identity Preservation: Maintaining exact facial features and defining characteristics
- Edge Blending: Creating natural transitions without harsh cutout edges
- Light & Color Matching: Ensuring artistic modifications match the subject's existing lighting

**PRIMARY DIRECTIVE:** The person's core facial features, bone structure, and identity MUST be preserved exactly. Only the requested artistic modifications should be applied.

**TASK:** Artistically modify the person in this pre-segmented image according to the following instruction, while maintaining their exact identity and facial features: "${prompt}"

**CONSTRAINTS:**
- The person's facial structure, features, and identity are sacrosanct and cannot be altered
- Apply only the specific modifications requested in the instruction
- Maintain photorealistic quality in all modifications
- The output image MUST retain its transparent background (alpha channel)
- Blend all modifications seamlessly with the original subject

**OUTPUT:** A single, high-quality image with transparent background, featuring the requested modifications while preserving the person's exact identity.`;

    const response = await apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: fullPrompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    }), { circuitName: 'remixForeground' })) as GenerateContentResponse;
    
    const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
    if (!imageResponsePart?.inlineData) throw new Error("Foreground remix failed.");
    return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
};

// FIX: Add missing functions that were causing import errors.
/**
 * Generates a new background image from a prompt.
 * @param {string} prompt - The prompt for the background.
 * @param {string} originalImageBase64 - The original photo, used for context.
 * @returns {Promise<string>} A promise resolving to the base64 data URL of the generated background.
 */
export const generateBackground = async (prompt: string, originalImageBase64: string): Promise<string> => {
    const fullPrompt = `You are a Lead VFX Compositor from a world-class film studio, renowned for your mastery of photorealistic scene creation and lighting design. You specialize in creating environments that are perfectly suited for seamless photo compositing.

**Your Core Expertise:**
- Photorealistic Scene Generation: Creating believable, high-fidelity environments
- Lighting Design: Establishing clear, consistent light sources and atmospheric conditions
- Composition for Compositing: Designing scenes with appropriate depth, perspective, and space for subject integration
- Color & Mood: Creating cohesive color palettes that support photorealistic integration

**MISSION:** Generate a photorealistic background scene that will serve as the environment for a photo remix composite. This scene must have clear lighting direction, appropriate depth, and realistic atmospheric qualities to allow seamless subject integration.

**SCENE DESCRIPTION:**
${prompt}

**CRITICAL REQUIREMENTS:**
- Scene must be photorealistic with clear, identifiable light sources
- Lighting direction and color temperature must be consistent throughout the scene
- Depth and perspective must be clearly established
- Scene should have appropriate atmospheric qualities (shadows, ambient light, environmental effects)
- High resolution and detail quality suitable for professional compositing
- Color palette should be cohesive and support natural subject integration

**CONTEXT:** The original photo context is provided as reference for matching general style, mood, or technical qualities if applicable to the requested scene.

**OUTPUT:** A single, high-resolution, photorealistic background scene optimized for compositing with a foreground subject.`;

    return apiSerializer.add(() => safeApiCall(async () => {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        if (!base64ImageBytes) throw new Error("Background generation failed: No image data in response.");
        return `data:image/png;base64,${base64ImageBytes}`;
    }, { circuitName: 'generateBackground' }));
};

/**
 * Composites one or more foreground images onto a background image.
 * @param {string[]} foregroundsBase64 - An array of base64 foreground images (with transparency).
 * @param {string} backgroundBase64 - The base64 background image.
 * @param {WallpaperSettings} settings - Composition settings.
 * @returns {Promise<string>} A promise resolving to the final composited image data URL.
 */
export const compositeImages = async (
    foregroundsBase64: string[],
    backgroundBase64: string,
    settings: WallpaperSettings
): Promise<string> => {
    return apiSerializer.add(() => safeApiCall(async () => {
        const parts: Part[] = [
            base64ToPart(backgroundBase64),
            ...foregroundsBase64.map(base64ToPart),
            {
                text: `You are a Lead VFX Compositor from a world-class film studio, renowned for your mastery of photorealistic compositing, light, and shadow. You are the final step in creating seamless, believable composite images where subjects look naturally present in their new environment.

**Your Core Expertise:**
- Photorealistic Integration: Making pre-segmented subjects look physically present in new scenes
- Light & Color Matching: Analyzing scene lighting and re-lighting subjects to match perfectly
- Shadow Generation: Creating realistic shadows that anchor subjects to their environment
- Edge Blending: Refining cutout edges to eliminate any "pasted-on" appearance
- Color Grading: Unifying the color palette across all elements for seamless integration

**PRIMARY DIRECTIVE:** Your highest priority is to create a seamless, photorealistic composite where the foreground subject(s) look naturally and physically present in the background scene. The final image must be indistinguishable from a photograph taken in that environment.

**THE DIGITAL DAILIES:**
You have been provided with:
- A background scene (first image)
- One or more pre-segmented foreground subject(s) with transparent backgrounds
- Composition specifications

**CRITICAL CONSTRAINTS:**
- Lighting & Shadow: The lighting on each subject MUST be altered to match the direction, color, and intensity of the lighting in the background scene. You MUST generate realistic shadows cast by each subject onto the background.
- Color Grading: The final image MUST have a unified color grade. Subjects cannot look "warmer" or "cooler" than their environment.
- Perspective & Scale: Position and scale subjects consistently with the background's perspective.
- Edge Blending: Meticulously refine subject edges to eliminate harsh cutout artifacts.

**COMPOSITION SPECIFICATIONS:**
- Character Position: ${settings.characterPosition}
- Character Size: ${settings.characterSize}% of scene height
- Blending Mode: ${settings.blendingMode}
- Lighting Style: ${settings.lightingStyle}

**OUTPUT:** A single, high-resolution, photorealistic composite image where all subjects are seamlessly integrated into the background scene.`
            }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
        });
        
        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imageResponsePart?.inlineData) throw new Error("Image compositing failed.");
        return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
    }, { circuitName: 'compositeImages' }));
};

/**
 * Detects individual subjects within a pre-segmented cutout image.
 * @param {string} cutoutBase64 - The base64 cutout image (with transparency).
 * @returns {Promise<DetectedSubject[]>} A promise resolving to an array of detected subjects.
 */
export const detectSubjectsInCutout = async (cutoutBase64: string): Promise<DetectedSubject[]> => {
    return apiSerializer.add(() => safeApiCall(async () => {
        const imagePart = base64ToPart(cutoutBase64);
        const prompt = `
            Analyze this image with a transparent background. It contains one or more pre-segmented people.
            Your task is to identify each individual person and provide a JSON array.
            For each person, provide:
            - 'id': A unique string identifier (e.g., "subject_1").
            - 'description': A brief, non-identifying description (e.g., "person on the left with red shirt").
            - 'boundingBox': A normalized bounding box [y_min, x_min, y_max, x_max] for that individual person.
            
            Return ONLY the raw JSON array. If no one is found, return an empty array.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        });

        return JSON.parse(response.text);
    }, { circuitName: 'detectSubjects' }));
};

/**
 * Generates a unified wallpaper scene by integrating character cutouts into a new background,
 * all in a single, powerful API call.
 * @param {Part[]} characterImageParts - An array of character image Parts.
 * @param {string} prompt - The detailed prompt for the scene.
 * @returns {Promise<GenerateContentResponse>} The raw response from the Gemini API.
 */
export const generateUnifiedWallpaperScene = async (
    characterImageParts: Part[],
    prompt: string
): Promise<GenerateContentResponse> => {
    return apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...characterImageParts, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
    }), { circuitName: 'unifiedWallpaper' }));
};

/**
 * Adds a speech bubble with text to an image within a specified bounding box.
 * @param {string} base64Image - The base64 source image.
 * @param {string} text - The text for the speech bubble.
 * @param {string} style - The style of the bubble ('standard', 'cloud', 'spiky', 'retro').
 * @param {object} box - The normalized bounding box for the bubble.
 * @returns {Promise<string>} The new image data URL with the speech bubble.
 */
export const generateAndPlaceSpeechBubble = async (
    base64Image: string,
    text: string,
    style: string,
    box: { x: number; y: number; width: number; height: number; }
): Promise<string> => {
    return apiSerializer.add(() => safeApiCall(async () => {
        const imagePart = base64ToPart(base64Image);
        const prompt = `
            Place a speech bubble on this image with the text "${text}".
            - Bubble Style: ${style}
            - Placement: The bubble should approximately fill the bounding box defined by [y_min:${box.y}, x_min:${box.x}, y_max:${box.y + box.height}, x_max:${box.x + box.width}].
            - Pointer: The bubble's tail should point towards the most likely speaker in or near the box.
            - Readability: Ensure the text is clear and legible.
            - Integration: The bubble should match the artistic style of the image.
            Return only the modified image.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
        });

        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imageResponsePart?.inlineData) throw new Error("Speech bubble generation failed.");
        return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
    }, { circuitName: 'addSpeechBubble' }));
};


/**
 * Performs a generic AI-powered edit on an image based on a text prompt.
 * @param {string} base64Image - The source image data URL.
 * @param {string} prompt - The prompt describing the edit.
 * @param {boolean} isVectorization - Whether the task is to convert to SVG.
 * @returns {Promise<GenerateContentResponse>} The raw response from the Gemini API.
 */
export const performGenericEdit = async (
    base64Image: string,
    prompt: string,
    isVectorization: boolean
): Promise<GenerateContentResponse> => {
    const imagePart = base64ToPart(base64Image);
    const model = isVectorization ? 'gemini-2.5-flash' : 'gemini-2.5-flash-image-preview';
    const config = isVectorization
        ? { responseMimeType: "text/plain" as const }
        : { responseModalities: [Modality.IMAGE, Modality.TEXT] as Modality[] };

    return apiSerializer.add(() => safeApiCall(() => ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
        config,
    }), { circuitName: 'genericEdit' }));
};

/**
 * Generates creative wallpaper prompt suggestions based on a user-provided theme.
 * @param {string} theme - The theme provided by the user (e.g., 'lonely astronaut').
 * @returns {Promise<string[]>} A promise that resolves to an array of 3 prompt suggestions.
 */
export const generatePresetSuggestions = async (theme: string): Promise<string[]> => {
    const prompt = `
        You are a creative director brainstorming ideas for stunning wallpapers.
        Based on the theme "${theme}", generate 3 distinct, detailed, and evocative prompts for an AI image generator.
        Each prompt should be a single, descriptive paragraph.
        Return your answer as a valid JSON array of strings.
        Example: ["A lush jungle...", "A minimalist desert...", "A vibrant coral reef..."]
    `;
    return apiSerializer.add(() => safeApiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    }, { circuitName: 'suggestPresets' }));
};

/**
 * Generates a creative variation of an existing wallpaper preset prompt.
 * @param {WallpaperPreset} preset - The original preset to vary.
 * @returns {Promise<string>} A promise that resolves to a new, unique prompt string.
 */
export const regeneratePresetPrompt = async (preset: WallpaperPreset): Promise<string> => {
    const prompt = `
        You are a creative prompt engineer. Take this wallpaper prompt and generate a new, creative variation of it.
        Keep the core theme and subject, but change the mood, lighting, time of day, or composition to create a fresh take.

        Original Prompt: "${preset.prompt}"

        New Prompt:
    `;
    return apiSerializer.add(() => safeApiCall(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    }, { circuitName: 'regeneratePreset' }));
};
