/**
 * @file components/StickerStudioWorkflow.tsx
 * @description The main UI component for the sticker creation workflow. It orchestrates all the steps
 * including input mode selection, identity lock/calibration, expression selection, and style configuration.
 */

import React, { useState } from 'react';
import { useAppContext, useCachedImage } from '../../context/AppContext';
import { EXPRESSIONS, STYLES, PALETTES, LINE_STYLES, SHADING_STYLES, COMPOSITIONS, RESOLUTIONS, STYLE_COMPATIBILITY, ANIMATION_STYLES, CREDIT_COSTS, PACK_SIZES, DRAG_AND_DROP_TYPE } from '../../constants';
import type { Expression, Settings, Style, LineStyle, ShadingStyle, TextInputRequest, AnimationStyle, Palette, Composition, OutputResolution, ExpressionCategory, CalibrationStep, GeneratedResult } from '../../types/types';
import { IdentityTemplateEditor } from './IdentityTemplateEditor';
import { SpeechBubbleIcon } from '../../constants/expressionIcons';
import { useGeneration } from '../../hooks/useGeneration';
import { useCalibration } from '../../hooks/useCalibration';
import { useCharacterCreation } from '../../hooks/useCharacterCreation';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useImageInputHandler } from '../../hooks/useImageInputHandler';
import { AnimationStyleGallery } from './AnimationStyleGallery';
import { AiCore } from './StickerPreview';

/**
 * @interface StickerStudioWorkflowProps
 * @description Defines the props for the StickerStudioWorkflow. Instead of individual callbacks,
 * it now accepts the entire objects returned by the core application hooks, reducing prop drilling.
 * It also accepts relevant state slices to enable memoization.
 */
interface StickerStudioWorkflowProps {
    generation: ReturnType<typeof useGeneration>;
    calibration: ReturnType<typeof useCalibration>;
    characterCreation: ReturnType<typeof useCharacterCreation>;
    imageUpload: ReturnType<typeof useImageUpload>;
    settings: Settings;
    isLoading: boolean;
    isCalibrating: boolean;
    isPreAnalyzing: boolean;
    calibrationStep: CalibrationStep;
    calibrationWarning: string | null;
    validatedIdentityAnchorImageId: string | null;
    verificationImageId: string | null;
    credits: number;
    simpleMode: boolean;
}

/**
 * @component Section
 * @description A collapsible UI section component for organizing the control panel.
 * @param {object} props - Component props.
 * @param {string} props.title - The title displayed in the section header.
 * @param {React.ReactNode} props.children - The content of the section.
 * @param {React.ReactNode} [props.extraHeaderContent] - Optional content to display next to the title.
 * @param {boolean} [props.initiallyCollapsed=false] - Whether the section should be collapsed by default.
 */
const Section: React.FC<{ title: string; children: React.ReactNode; extraHeaderContent?: React.ReactNode; initiallyCollapsed?: boolean }> = ({ title, children, extraHeaderContent, initiallyCollapsed = false }) => {
    const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
    return (
        <div className="py-4 border-b border-gray-700/50 last:border-b-0">
            <div className="flex justify-between items-center px-4 mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h3 className="text-lg font-bold font-heading">{title}</h3>
                <div className="flex items-center gap-2">
                    {extraHeaderContent}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </div>
            </div>
            {!isCollapsed && <div className="px-4 space-y-4 fade-in">{children}</div>}
        </div>
    );
};

/**
 * @component FormField
 * @description A standardized layout component for form elements, including a label, input, and optional help text.
 * @param {object} props - Component props.
 * @param {string} props.label - The label for the form field.
 * @param {string} [props.htmlFor] - The `for` attribute for the label.
 * @param {React.ReactNode} props.children - The input element(s).
 * @param {string} [props.helpText] - Optional descriptive text below the input.
 * @param {string} [props.className] - Optional additional CSS classes.
 */
const FormField: React.FC<{ label: string; htmlFor?: string; children: React.ReactNode; helpText?: React.ReactNode; className?: string }> = ({ label, htmlFor, children, helpText, className = '' }) => (
    <div className={className}>
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        {children}
        {helpText && <p className="text-xs text-gray-400 mt-1.5">{helpText}</p>}
    </div>
);

/**
 * @component StickerStudioWorkflow
 * @description The main component for the Sticker Studio UI.
 * @param {StickerStudioWorkflowProps} props - The props containing all necessary action handlers and state slices.
 */
const StickerStudioWorkflowComponent: React.FC<StickerStudioWorkflowProps> = (props) => {
    const { 
        generation, calibration, characterCreation, imageUpload,
        settings, isLoading, isCalibrating, isPreAnalyzing, calibrationStep, calibrationWarning, 
        validatedIdentityAnchorImageId, verificationImageId, credits, simpleMode 
    } = props;
    
    // Dispatch is still needed for local UI actions that don't come from hooks.
    const { dispatch } = useAppContext();
    
    const [animationGalleryOpen, setAnimationGalleryOpen] = useState(false);
    const uploadedImageSrc = useCachedImage(settings.uploadedImageId);
    const verificationImageSrc = useCachedImage(verificationImageId);
    const validatedAnchorImageSrc = useCachedImage(validatedIdentityAnchorImageId);
    const calibrationOk = calibrationStep === 'confirmed';

    const imageInput = useImageInputHandler({
        onImageLoaded: imageUpload.uploadImage,
        onError: (e) => dispatch({ type: 'GENERATION_ERROR', payload: e.message })
    });

    const handleCollectionDrop = (e: React.DragEvent) => {
        const data = e.dataTransfer.getData(DRAG_AND_DROP_TYPE);
        if (data) {
            try {
                const result: GeneratedResult = JSON.parse(data);
                const resultSettings = result.settings as Partial<Settings>;

                if (result.type === 'image' && resultSettings.identityAnchorImageId && resultSettings.identityTemplate) {
                    dispatch({
                        type: 'SET_SETTING', payload: {
                            mode: 'image-to-image',
                            uploadedImageId: resultSettings.identityAnchorImageId,
                            identityAnchorImageId: resultSettings.identityAnchorImageId,
                            identityTemplate: resultSettings.identityTemplate,
                            poseDescription: resultSettings.poseDescription,
                        }
                    });
                    dispatch({ type: 'SET_CALIBRATION_STEP', payload: 'confirmed' });
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Identity loaded from collection item.` } });
                } else {
                     dispatch({ type: 'GENERATION_ERROR', payload: 'The dropped item is not a valid character reference.'});
                }
            } catch (error) {
                console.error("Failed to parse dropped item", error);
            }
        }
    };

    const handleSettingChange = (field: keyof Settings, value: any) => {
        dispatch({ type: 'SET_SETTING', payload: { [field]: value } });
    };

// FIX: This function contained unintentionally pasted code that caused a syntax error. It has been restored to its correct implementation.
    const handleExpressionToggle = (expName: string) => {
        let newSelection = [...settings.selectedExpressions];
        const wasPoseOnly = settings.selectedExpressions.length === 1 && settings.selectedExpressions[0] === '(Pose from image)';
        
        if (newSelection.includes(expName)) {
            newSelection = newSelection.filter(name => name !== expName);
        } else {
            if (settings.outputFormat === 'animated' || expName === '(Pose from image)') {
                newSelection = [expName];
            } else {
                newSelection.push(expName);
            }
        }
        
        const isPoseOnly = newSelection.length === 1 && newSelection[0] === '(Pose from image)';
        
        // Add user notification for automatic pack size changes
        if (wasPoseOnly && !isPoseOnly && newSelection.length > 1) {
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Pack size automatically set to 4 for multi-expression pack.' } });
        }
        
        handleSettingChange('selectedExpressions', newSelection);
    };
    
    const handleRandomize = () => {
        dispatch({ type: 'RANDOMIZE_PROMPT' });
    };

    const handleAddSpeechBubble = (expName: string) => {
        const request: TextInputRequest = {
            title: `Add Speech Bubble to "${expName}"`,
            message: 'Enter the text you want the character to say. Leave it blank to remove the bubble.',
            initialValue: settings.speechBubbles?.[expName] || '',
            confirmText: 'Set Text',
            actionType: 'add-speech-bubble',
            context: { expName }
        };
        dispatch({ type: 'OPEN_TEXT_INPUT_MODAL', payload: request });
    };

    const isGenerating = isLoading || isCalibrating || isPreAnalyzing || imageInput.isProcessing;
    
    // Cost calculation for the generate button's text display
    const isPoseOnly = settings.selectedExpressions.length === 1 && settings.selectedExpressions[0] === '(Pose from image)';
    const cost = settings.outputFormat === 'animated' 
        ? CREDIT_COSTS.ANIMATED_STICKER 
        : (isPoseOnly ? 1 : settings.packSize);

    const hasEnoughForGeneration = credits >= cost;
    const isReadyToGenerate = (settings.mode === 'text-to-image' || (settings.mode === 'image-to-image' && calibrationOk)) && settings.selectedExpressions.length > 0;
    
    let generateButtonTitle = '';
    if (isGenerating) {
        generateButtonTitle = 'An operation is already in progress.';
    } else if (settings.mode === 'image-to-image' && !calibrationOk) {
        generateButtonTitle = 'Please upload and calibrate an image first.';
    } else if (settings.selectedExpressions.length === 0) {
        generateButtonTitle = 'Please select at least one expression.';
    } else if (!hasEnoughForGeneration) {
        generateButtonTitle = `Insufficient credits. This generation requires ${cost} credits.`;
    }

    const availableShadingStyles = STYLE_COMPATIBILITY[settings.style]?.shading || [];
    const availableLineStyles = STYLE_COMPATIBILITY[settings.style]?.lines || [];

     const groupedExpressions = EXPRESSIONS.reduce((acc, exp) => {
        const category = exp.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(exp);
        return acc;
    }, {} as Record<ExpressionCategory, Expression[]>);

    return (
        <div className="flex flex-col h-full">
            {animationGalleryOpen && <AnimationStyleGallery isOpen={animationGalleryOpen} onClose={() => setAnimationGalleryOpen(false)} currentStyle={settings.animationStyle} />}
            <div className="flex-1 overflow-y-auto" data-tour-id="control-panel" onPaste={isGenerating ? undefined : imageInput.handlePaste}>
                
                <Section title="1. Input Mode">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleSettingChange('mode', 'image-to-image')} className={`p-3 rounded-lg text-center font-semibold ${settings.mode === 'image-to-image' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>From Image</button>
                        <button onClick={() => handleSettingChange('mode', 'text-to-image')} className={`p-3 rounded-lg text-center font-semibold ${settings.mode === 'text-to-image' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>From Text</button>
                    </div>
                </Section>
                
                <Section title="2. Subject & Identity">
                    {settings.mode === 'image-to-image' ? (
                        <div className="space-y-4">
                            <div
                                data-tour-id="upload-area"
                                onClick={isGenerating ? undefined : imageInput.handleClick}
                                onDragOver={isGenerating ? undefined : imageInput.handleDragOver}
                                onDragLeave={isGenerating ? undefined : imageInput.handleDragLeave}
                                onDrop={(e) => {
                                    if (isGenerating) return;
                                    if (e.dataTransfer.types.includes(DRAG_AND_DROP_TYPE)) {
                                        handleCollectionDrop(e);
                                    } else {
                                        imageInput.handleDrop(e);
                                    }
                                }}
                                className={`relative flex items-center justify-center p-4 border-2 border-dashed rounded-md transition-colors min-h-[160px] ${isGenerating ? 'cursor-not-allowed bg-gray-700/50' : 'cursor-pointer'} ${imageInput.isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                            >
                                <input
                                    ref={imageInput.fileInputRef}
                                    type="file"
                                    onChange={imageInput.handleFileChange}
                                    accept="image/*,.heic,.heif"
                                    className="hidden"
                                    disabled={isGenerating}
                                />
                                {isPreAnalyzing || imageInput.isProcessing ? (
                                    <AiCore isProcessing={true} className="w-24 h-24" />
                                ) : uploadedImageSrc ? (
                                    <img src={uploadedImageSrc} alt="User-uploaded photo for calibration" className="max-h-36 rounded-md" />
                                ) : (
                                    <div className="text-center pointer-events-none">
                                        <p className="text-sm text-gray-200 font-semibold">Click, Paste, or Drag & Drop</p>
                                        <p className="text-xs text-gray-400">Upload a photo or drop a character from your collection.</p>
                                    </div>
                                )}
                            </div>

                             {calibrationStep === 'awaiting-verification' && verificationImageSrc && validatedAnchorImageSrc && (
                                <div className="p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                                    <h4 className="font-semibold text-blue-200 text-sm mb-2">Approve Identity Lock</h4>
                                    <p className="text-xs text-blue-200/80 mb-3">The AI has created a neutral "faceprint" of the person. Does this accurately represent their core features? It may not match the original expression.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="text-center"><p className="text-xs font-semibold mb-1">Your Photo</p><img src={validatedAnchorImageSrc} className="rounded" alt="Your original uploaded photo for comparison"/></div>
                                        <div className="text-center"><p className="text-xs font-semibold mb-1">AI Faceprint</p><img src={verificationImageSrc} className="rounded" alt="AI-generated neutral faceprint for verification"/></div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={calibration.rejectVerification} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 rounded-md text-sm">Reject</button>
                                        <button onClick={calibration.approveVerification} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 rounded-md text-sm">Approve</button>
                                    </div>
                                </div>
                            )}

                             <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                                <p className="text-sm font-semibold">Identity Lock Status:</p>
                                {isPreAnalyzing || imageInput.isProcessing ? <span className="text-sm font-semibold text-purple-300 animate-pulse">Processing...</span> : 
                                 isCalibrating ? <span className="text-sm font-semibold text-purple-300 animate-pulse">Calibrating...</span> :
                                 calibrationOk ? <span className="text-sm font-bold text-green-400">✓ Locked</span> :
                                 <span className="text-sm font-semibold text-yellow-400">Not Calibrated</span>
                                }
                            </div>

                            {calibrationOk && settings.identityAnchor && (
                                <FormField label="Identity Lock Strength">
                                    <select 
                                        value={settings.identityLockStrength || 'standard'} 
                                        onChange={e => handleSettingChange('identityLockStrength', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm"
                                    >
                                        <option value="off">Off (Faster, V1 System)</option>
                                        <option value="standard">Standard (Recommended)</option>
                                        <option value="maximum">Maximum (Up to 3 attempts)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Standard uses validation with 1 attempt. Maximum retries up to 3 times for perfect consistency.
                                    </p>
                                </FormField>
                            )}

                            {calibrationWarning && (
                                <div className="p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-xs text-yellow-200/80">
                                    <h4 className="font-semibold text-yellow-200 mb-1">{calibrationWarning.split('|')[0]}</h4>
                                    {calibrationWarning.split('|').slice(1).map((line, i) => <p key={i}>{line}</p>)}
                                </div>
                            )}
                            
                            {settings.identityTemplate && <IdentityTemplateEditor template={settings.identityTemplate} onChange={(t) => handleSettingChange('identityTemplate', t)} />}
                            
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <FormField label="Subject">
                                <input type="text" value={settings.subject} onChange={e => handleSettingChange('subject', e.target.value)} placeholder="e.g., A wizard cat" className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" />
                            </FormField>
                            <FormField label="Key Characteristics">
                                <input type="text" value={settings.keyCharacteristics} onChange={e => handleSettingChange('keyCharacteristics', e.target.value)} placeholder="e.g., wearing a pointy hat, holding a wand" className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" />
                            </FormField>
                        </div>
                    )}
                </Section>
                 <Section title="3. Expression & Pose" initiallyCollapsed={settings.mode === 'text-to-image'}>
                    <FormField label="Select Expressions" helpText="Animated stickers can only have one expression at a time.">
                         <div data-tour-id="expression-grid" className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 max-h-48 overflow-y-auto -mr-4 pr-4">
                             {EXPRESSIONS.map(exp => (
                                <div key={exp.name} className="relative">
                                     <button 
                                        onClick={() => handleExpressionToggle(exp.name)} 
                                        className={`w-full aspect-square flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${settings.selectedExpressions.includes(exp.name) ? 'bg-purple-600/50 ring-2 ring-purple-500' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                                        title={exp.name}
                                    >
                                        <div className="w-6 h-6 text-gray-200">{exp.icon}</div>
                                        <p className="text-xs text-gray-300 mt-1 truncate">{exp.name}</p>
                                    </button>
                                     {settings.selectedExpressions.includes(exp.name) && exp.name !== '(Pose from image)' && (
                                        <button onClick={() => handleAddSpeechBubble(exp.name)} className={`absolute -top-1.5 -right-1.5 p-1 rounded-full ${settings.speechBubbles?.[exp.name] ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`} title="Add/Edit Speech Bubble">
                                            <SpeechBubbleIcon />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </FormField>
                </Section>
                <Section title="4. Style & Format" initiallyCollapsed={simpleMode}>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Output Format">
                            <select value={settings.outputFormat} onChange={e => handleSettingChange('outputFormat', e.target.value as 'static' | 'animated')} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">
                                <option value="static">Static (Image)</option>
                                <option value="animated">Animated (Video)</option>
                            </select>
                        </FormField>
                        <FormField label="Artistic Style">
                            <select value={settings.style} onChange={e => handleSettingChange('style', e.target.value as Style)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{STYLES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </FormField>
                        <FormField label="Color Palette">
                            <select value={settings.palette} onChange={e => handleSettingChange('palette', e.target.value as Palette)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{PALETTES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        </FormField>
                         <FormField label="Line Style">
                            <select value={settings.lineStyle} onChange={e => handleSettingChange('lineStyle', e.target.value as LineStyle)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" disabled={availableLineStyles.length <= 1}>{availableLineStyles.map(l => <option key={l} value={l}>{l}</option>)}</select>
                        </FormField>
                        <FormField label="Shading Style">
                            <select value={settings.shadingStyle} onChange={e => handleSettingChange('shadingStyle', e.target.value as ShadingStyle)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" disabled={availableShadingStyles.length <= 1}>{availableShadingStyles.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </FormField>
                        <FormField label="Composition">
                            <select value={settings.composition} onChange={e => handleSettingChange('composition', e.target.value as Composition)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{COMPOSITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </FormField>
                    </div>
                </Section>
                {settings.outputFormat === 'animated' ? (
                     <Section title="5. Animation Details" initiallyCollapsed={simpleMode}>
                        <FormField label="Animation Style">
                             <div className="flex gap-2">
                                 <select value={settings.animationStyle} onChange={e => handleSettingChange('animationStyle', e.target.value as AnimationStyle)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">
                                     {ANIMATION_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                     <option value="Custom">Custom Prompt</option>
                                 </select>
                                 <button onClick={() => setAnimationGalleryOpen(true)} className="text-sm font-semibold text-purple-400 hover:text-purple-300 flex-shrink-0">Examples</button>
                             </div>
                        </FormField>
                        {settings.animationStyle === 'Custom' && (
                             <FormField label="Custom Animation Prompt">
                                <input type="text" value={settings.customAnimationPrompt} onChange={e => handleSettingChange('customAnimationPrompt', e.target.value)} placeholder="e.g., Waving a tiny flag" className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" />
                            </FormField>
                        )}
                        <details className="mt-4 text-xs">
                            <summary className="cursor-pointer text-gray-400 font-semibold">Advanced Animation Settings</summary>
                            <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-gray-900/50 rounded-lg">
                                <FormField label="Speed">
                                    <select value={settings.animationSpeed} onChange={e => handleSettingChange('animationSpeed', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm"><option value="0.5x">0.5x</option><option value="1x">1x</option><option value="1.5x">1.5x</option><option value="2x">2x</option></select>
                                </FormField>
                                <FormField label="Loop Style">
                                    <select value={settings.animationLoopStyle} onChange={e => handleSettingChange('animationLoopStyle', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm"><option value="infinite">Infinite</option><option value="once">Once</option><option value="bounce">Bounce</option></select>
                                </FormField>
                                <FormField label="Easing Function" className="col-span-2">
                                    <select value={settings.animationEasing} onChange={e => handleSettingChange('animationEasing', e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md text-sm"><option value="linear">Linear</option><option value="ease-in">Ease-in</option><option value="ease-out">Ease-out</option><option value="ease-in-out">Ease-in-out</option></select>
                                </FormField>
                            </div>
                        </details>
                    </Section>
                ) : (
                    <Section title="5. Pack & Quality" initiallyCollapsed={simpleMode}>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField label="Pack Size" helpText={
                                <span className="flex items-start gap-1.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                    <span>If you select fewer expressions than the pack size, the AI will add random ones to complete the pack (e.g. select 2, pack size 4, you get 2 random).</span>
                                </span>
                            }>
                                <select value={settings.packSize} onChange={e => handleSettingChange('packSize', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" disabled={isPoseOnly}>{PACK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            </FormField>
                            <FormField label="Resolution (px)">
                                <select value={settings.resolution} onChange={e => handleSettingChange('resolution', parseInt(e.target.value) as OutputResolution)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
                            </FormField>
                        </div>
                    </Section>
                )}
            </div>
            {/* Action Footer */}
            <div className="p-4 bg-gray-900/50 flex items-center justify-between flex-shrink-0 border-t border-gray-700/50">
                <button 
                    onClick={handleRandomize}
                    className="text-sm font-semibold text-purple-400 hover:text-purple-300"
                    title="Get a creative AI-powered suggestion"
                >
                    Inspire Me
                </button>
                {isLoading && settings.outputFormat === 'animated' ? (
                    <button
                        onClick={generation.cancelGeneration}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        Cancel Generation
                    </button>
                ) : (
                    <button
                        data-tour-id="generate-button"
                        onClick={generation.generateStickers}
                        disabled={!isReadyToGenerate || !hasEnoughForGeneration || isGenerating}
                        title={generateButtonTitle}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Working...' : `Generate (${cost} ${cost === 1 ? 'Credit' : 'Credits'})`}
                    </button>
                )}
            </div>
        </div>
    );
};

// Fix: Add a named export to the component.
// This resolves the import error in ControlPanel.tsx.
// Also, implement React.memo for performance as noted in dev logs.
const propsAreEqual = (prevProps: StickerStudioWorkflowProps, nextProps: StickerStudioWorkflowProps) => {
    return (
        prevProps.settings === nextProps.settings &&
        prevProps.isLoading === nextProps.isLoading &&
        prevProps.isCalibrating === nextProps.isCalibrating &&
        prevProps.isPreAnalyzing === nextProps.isPreAnalyzing &&
        prevProps.calibrationStep === nextProps.calibrationStep &&
        prevProps.calibrationWarning === nextProps.calibrationWarning &&
        prevProps.validatedIdentityAnchorImageId === nextProps.validatedIdentityAnchorImageId &&
        prevProps.verificationImageId === nextProps.verificationImageId &&
        prevProps.credits === nextProps.credits &&
        prevProps.simpleMode === nextProps.simpleMode
    );
};

export const StickerStudioWorkflow = React.memo(StickerStudioWorkflowComponent, propsAreEqual);
