/**
 * @file identityPreservation.ts
 * @description Advanced identity lock system with validation and auto-retry
 * Fixes identity consistency issues by using neutral reference faces and validation scoring
 */

import { GoogleGenAI, Part, Modality, Type, GenerateContentResponse } from "@google/genai";
import { ai, base64ToPart } from './geminiService';
import { apiSerializer } from '../apiSerializer';
import { safeApiCall } from '../apiUtils';
import type { BiometricProfile, IdentityAnchor, ValidationResult } from '../../types/types';

// ==================== CORE FUNCTIONS ====================

/**
 * Creates a complete identity anchor from a source image
 * This is the entry point for Identity Lock V2
 */
export const createIdentityAnchor = async (sourceImageBase64: string): Promise<IdentityAnchor> => {
    const neutralFace = await generateNeutralReference(sourceImageBase64);
    const biometricProfile = await extractBiometricProfile(sourceImageBase64, neutralFace);
    const identityFingerprint = await createIdentityFingerprint(biometricProfile);
    
    return {
        sourceImageBase64,
        biometricProfile,
        neutralFaceBase64: neutralFace,
        identityFingerprint
    };
};

/**
 * Generates a neutral, forward-facing reference portrait
 * This creates a "forensic faceprint" free from expression and pose
 */
const generateNeutralReference = async (sourceImageBase64: string): Promise<string> => {
    return apiSerializer.add(async () => {
        const imagePart = base64ToPart(sourceImageBase64);
        
        const prompt = `CRITICAL: Create neutral identity reference.

Generate perfectly forward-facing portrait with:
- Neutral expression (no smile, no emotion)
- Even studio lighting
- Clear focus on facial features
- Remove accessories (glasses, hats, jewelry)
- Plain background

PRESERVE EXACTLY:
- Bone structure, face shape
- Eye color, shape, spacing
- Nose structure
- Lip shape and fullness
- Skin tone
- Hair style and color
- Permanent features (moles, dimples, scars)

IGNORE: Current expression, lighting, camera angle, temporary elements

This is forensic identity capture for biometric matching.`;

        const response = await safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { 
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                temperature: 0.1
            }
        }), { circuitName: 'neutralReference', rateLimitTokens: 2 }) as GenerateContentResponse;

        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imageResponsePart?.inlineData) {
            throw new Error("Failed to generate neutral reference");
        }

        return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
    });
};

/**
 * Extracts comprehensive biometric profile from source and neutral images
 * Uses dual-image analysis for higher accuracy
 */
const extractBiometricProfile = async (
    sourceImageBase64: string, 
    neutralImageBase64: string
): Promise<BiometricProfile> => {
    return apiSerializer.add(async () => {
        const sourcePart = base64ToPart(sourceImageBase64);
        const neutralPart = base64ToPart(neutralImageBase64);

        const prompt = `Forensic facial analysis. Analyze BOTH images (original + neutral reference).

Extract PERMANENT FEATURES ONLY. Output exact JSON:
{
  "bone_structure": {
    "face_shape": "oval/round/square/heart/diamond/oblong/triangular",
    "jawline": "prominence + angle description",
    "cheekbones": "height + prominence description",
    "chin": "shape + projection description",
    "forehead": "height + width description"
  },
  "eye_biometrics": {
    "iris_color": "precise color (not just 'brown')",
    "eye_shape": "almond/round/hooded/upturned/downturned",
    "pupillary_distance": "wide-set/average/close-set",
    "eyelid_type": "monolid/single/double/hooded",
    "eyebrow_shape": "shape, thickness"
  },
  "nose_structure": {
    "bridge_width": "narrow/medium/wide",
    "bridge_height": "flat/low/medium/high",
    "nostril_shape": "round/oval/narrow, flared/neutral",
    "tip_shape": "bulbous/pointed/rounded/upturned",
    "overall_size": "small/medium/large"
  },
  "mouth_features": {
    "lip_fullness": {
      "upper": "thin/medium/full",
      "lower": "thin/medium/full"
    },
    "cupids_bow": "undefined/subtle/moderate/pronounced",
    "mouth_width": "narrow/medium/wide"
  },
  "distinctive_features": {
    "dimples": "none/location description",
    "hair_style": "EXACT style, length, cut, texture, color",
    "earrings": "none/type, which ear, size",
    "tattoos": "none/exact location and design",
    "piercings": "none/exact location",
    "markers": "moles/freckles/scars with locations"
  },
  "skin_tone": {
    "base": "fair/medium/tan/deep with description",
    "undertones": "cool/warm/neutral"
  }
}`;

        const response = await safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [sourcePart, neutralPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1
            }
        }), { circuitName: 'extractBiometric', rateLimitTokens: 1 }) as GenerateContentResponse;

        return JSON.parse(response.text);
    });
};

/**
 * Creates a compact identity fingerprint from biometric profile
 * This is used in generation prompts for precise identity matching
 */
const createIdentityFingerprint = async (profile: BiometricProfile): Promise<string> => {
    return apiSerializer.add(async () => {
        const prompt = `Convert this biometric profile into compact identity fingerprint (max 150 words):

${JSON.stringify(profile, null, 2)}

Create fingerprint that:
1. Prioritizes MOST distinctive features
2. Uses precise, measurable language
3. Emphasizes features surviving style transformation
4. Mentions hair, dimples, tattoos, earrings if present

Single paragraph format.`;

        const response = await safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.2 }
        }), { circuitName: 'createFingerprint', rateLimitTokens: 1 }) as GenerateContentResponse;

        return response.text.trim();
    });
};

/**
 * Generates a single image with identity lock constraints
 * Uses dual-image anchoring for maximum consistency
 */
export const generateWithIdentityLock = async (
    identityAnchor: IdentityAnchor,
    targetExpression: string,
    visualStyle: string,
    additionalPrompt: string = ''
): Promise<string> => {
    return apiSerializer.add(async () => {
        const neutralPart = base64ToPart(identityAnchor.neutralFaceBase64);
        const sourcePart = base64ToPart(identityAnchor.sourceImageBase64);

        const prompt = `🔒 IDENTITY-LOCKED GENERATION

=== PRIORITY ORDER ===
1. FACIAL IDENTITY (must match exactly)
2. Target expression
3. Visual style

=== IDENTITY ANCHOR ===
${identityAnchor.identityFingerprint}

=== TASK ===
Expression: ${targetExpression}
Style: ${visualStyle}
${additionalPrompt}

=== MANDATORY CONSTRAINTS ===
Generated image MUST maintain:
- Exact bone structure
- Precise eye characteristics  
- Identical nose structure
- Same lip shape
- Skin tone consistency
${identityAnchor.biometricProfile.distinctive_features.dimples !== 'none' ? '- CRITICAL: Dimples when appropriate' : ''}
${identityAnchor.biometricProfile.distinctive_features.hair_style !== 'none' ? '- CRITICAL: Exact hair style' : ''}
${identityAnchor.biometricProfile.distinctive_features.earrings !== 'none' ? '- CRITICAL: Earrings visible' : ''}
${identityAnchor.biometricProfile.distinctive_features.tattoos !== 'none' ? '- CRITICAL: Tattoos in exact locations' : ''}

=== STYLE RULES ===
- Apply style to CLOTHING/BACKGROUND/EFFECTS only
- Facial features stay photorealistic-accurate
- If style conflicts with identity, IDENTITY WINS

OUTPUT: Transparent background, professional quality`;

        const response = await safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [neutralPart, sourcePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                temperature: 0.3
            }
        }), { circuitName: 'identityLockedGen', rateLimitTokens: 3 }) as GenerateContentResponse;

        const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (!imageResponsePart?.inlineData) {
            throw new Error("Generation failed");
        }

        return `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
    });
};

/**
 * Validates generated image against identity anchor
 * Returns similarity score (0-100) and validation status
 */
export const validateIdentity = async (
    identityAnchor: IdentityAnchor,
    generatedImageBase64: string
): Promise<ValidationResult> => {
    return apiSerializer.add(async () => {
        const referencePart = base64ToPart(identityAnchor.neutralFaceBase64);
        const generatedPart = base64ToPart(generatedImageBase64);

        const prompt = `Forensic facial comparison. Compare these images (should be SAME person):

IMAGE 1: Neutral reference (ground truth)
IMAGE 2: Generated stylized image

IDENTITY TO VERIFY:
${identityAnchor.identityFingerprint}

Analyze: face shape, eyes, nose, mouth, distinctive features, proportions

SCORING:
95-100: Perfect match
85-94: Strong match, minor deviations
70-84: Recognizable but notable differences
<70: Identity not preserved (FAILED)

OUTPUT JSON:
{
  "similarityScore": <0-100>,
  "isValid": <true if >= 85>,
  "issues": [<specific problems>],
  "analysis": "<brief explanation>"
}`;

        const response = await safeApiCall(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [referencePart, generatedPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        similarityScore: { type: Type.NUMBER },
                        isValid: { type: Type.BOOLEAN },
                        issues: { type: Type.ARRAY, items: { type: Type.STRING } },
                        analysis: { type: Type.STRING }
                    }
                }
            }
        }), { circuitName: 'validateIdentity', rateLimitTokens: 1 }) as GenerateContentResponse;

        return JSON.parse(response.text);
    });
};

/**
 * Generates with validation and auto-retry on failure
 * This is the recommended function for single-image generation
 */
export const generateWithValidation = async (
    identityAnchor: IdentityAnchor,
    targetExpression: string,
    visualStyle: string,
    additionalPrompt: string = '',
    maxRetries: number = 2
): Promise<{ image: string; validation: ValidationResult; attempts: number }> => {
    let attempts = 0;

    while (attempts <= maxRetries) {
        attempts++;
        
        const generated = await generateWithIdentityLock(
            identityAnchor,
            targetExpression,
            visualStyle,
            additionalPrompt
        );

        const validation = await validateIdentity(identityAnchor, generated);

        if (validation.isValid || attempts > maxRetries) {
            return { image: generated, validation, attempts };
        }

        console.log(`Attempt ${attempts} failed (score: ${validation.similarityScore}). Retrying...`);
    }

    throw new Error("Generation failed after max retries");
};

/**
 * Generates a complete sticker pack with validation
 * This is the main entry point for sticker pack generation
 */
export const generateStickerPack = async (
    identityAnchor: IdentityAnchor,
    expressions: Array<{ name: string; description: string }>,
    visualStyle: string,
    onProgress?: (message: string, current: number, total: number) => void,
    maxRetries?: number
): Promise<Array<{ image: string; expression: string; validation: ValidationResult; attempts: number }>> => {
    const results = [];

    for (let i = 0; i < expressions.length; i++) {
        const exp = expressions[i];
        
        if (onProgress) {
            onProgress(`Generating ${exp.name}...`, i + 1, expressions.length);
        }

        const result = await generateWithValidation(
            identityAnchor,
            exp.description,
            visualStyle,
            '',
            maxRetries
        );

        results.push({
            image: result.image,
            expression: exp.name,
            validation: result.validation,
            attempts: result.attempts
        });

        if (!result.validation.isValid) {
            console.warn(`⚠️ Identity issues in "${exp.name}":`, result.validation.issues);
        }
    }

    return results;
};

export default {
    createIdentityAnchor,
    generateWithIdentityLock,
    validateIdentity,
    generateWithValidation,
    generateStickerPack
};