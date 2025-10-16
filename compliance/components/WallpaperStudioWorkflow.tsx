/**
 * @file components/WallpaperStudioWorkflow.tsx
 * @description The main UI component for creating wallpapers. It allows users to select characters from their library,
 * write a custom prompt, choose from presets, and adjust advanced composition settings before generating.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext, useBulkCachedImages } from '../../context/AppContext';
import { WALLPAPER_SIZES, WALLPAPER_PRESETS, BLENDING_MODES, LIGHTING_STYLES, QUALITY_LEVELS } from '../../constants/wallpaperPresets';
import type { Character, WallpaperPreset, WallpaperSettings, ViewerImage, GeneratedResult } from '../../types/types';
import { isApiKeySet, generatePresetSuggestions, regeneratePresetPrompt } from '../../utils/services/geminiService';
import { CharacterSheet } from './CharacterSheet';
import { useGeneration } from '../../hooks/useGeneration';
import { useCharacterCreation } from '../../hooks/useCharacterCreation';
import { useImageInputHandler } from '../../hooks/useImageInputHandler';
import { hasTransparency } from '../../utils/imageUtils';
import { DRAG_AND_DROP_TYPE } from '../../constants';
import { downloadResult } from '../../utils/stateManager';
import { AiCore } from './StickerPreview';

/**
 * @interface WallpaperWorkflowProps
 * @description Defines the props for the WallpaperStudioWorkflow. Instead of individual callbacks,
 * it now accepts the entire objects returned by the core application hooks to reduce prop drilling.
 * It also accepts relevant state slices to enable memoization.
 */
interface WallpaperWorkflowProps {
    generation: ReturnType<typeof useGeneration>;
    characterCreation: ReturnType<typeof useCharacterCreation>;
    feedbackBin: GeneratedResult[];
    characterLibrary: Character[];
    wallpaperSettings: WallpaperSettings;
    isLoading: boolean;
    credits: number;
    isCreatingCharacter: boolean;
    simpleMode: boolean;
    transferredCharacter: (Character & { imageDataUrl: string }) | null;
    recentGenerations: GeneratedResult[];
}

/**
 * @component Section
 * @description A collapsible UI section component for organizing the control panel.
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
 * @description A standardized layout component for form elements.
 */
const FormField: React.FC<{ label: string; htmlFor?: string; children: React.ReactNode; helpText?: React.ReactNode; className?: string }> = ({ label, htmlFor, children, helpText, className = '' }) => (
    <div className={className}>
        <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        {children}
        {helpText && <div className="text-xs text-gray-400 mt-1.5 space-y-1">{helpText}</div>}
    </div>
);

/**
 * @component CharacterThumbnail
 * @description Renders a single character's image from the cache for the selection grid, with a proper loading skeleton.
 */
const CharacterThumbnail: React.FC<{ char: Character; imageData: string | null }> = ({ char, imageData }) => {
    if (!imageData) {
        return <div className="w-full h-full object-cover rounded-lg bg-gray-700 animate-pulse" aria-label={`Loading image for ${char.name}`} />;
    }
    return (
        <img src={imageData} alt={char.name} className="w-full h-full object-cover rounded-lg" />
    );
};


/**
 * @component CharacterGridItem
 * @description Renders a single item in the character selection grid. This component is purely presentational
 * and receives its image data as a prop for better performance with `useBulkCachedImages`.
 */
const CharacterGridItem: React.FC<{
    char: Character;
    imageData: string | null;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onViewSheet: (char: Character) => void;
    onViewLarger: (char: Character, imageData: string) => void;
}> = ({ char, imageData, isSelected, onToggle, onViewSheet, onViewLarger }) => {
    return (
        <div className="relative aspect-square rounded-lg group">
            <button onClick={() => onToggle(char.id)} className="w-full h-full">
                <CharacterThumbnail char={char} imageData={imageData} />
                <div className={`absolute inset-0 transition-all rounded-lg ${isSelected ? 'bg-purple-600/50 ring-2 ring-purple-400' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}></div>
                {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                )}
            </button>
            <button onClick={() => onViewSheet(char)} className="absolute top-1 left-1 p-1 bg-gray-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600" title="View Character Sheet"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C3.732 4.943 9.522 3 10 3s6.268 1.943 9.542 7c-3.274 5.057-9.064 7-9.542 7S3.732 15.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg></button>
            {imageData && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewLarger(char, imageData);
                    }}
                    className="absolute bottom-1 right-1 p-1 bg-gray-900/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
                    title="View Larger"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9zm4.5-2.5a.75.75 0 01.75.75v.008a.75.75 0 01-1.5 0v-.008a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
            <p className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white text-xs text-center truncate">{char.name}</p>
        </div>
    );
};


/**
 * @component WallpaperStudioWorkflowComponent
 * @description The main component for the Wallpaper Studio UI. It orchestrates the entire workflow.
 * @param {WallpaperWorkflowProps} props - The props containing all necessary action handlers and state slices.
 */
const WallpaperStudioWorkflowComponent: React.FC<WallpaperWorkflowProps> = (props) => {
    const { 
        generation, characterCreation, feedbackBin,
        characterLibrary, wallpaperSettings, isLoading, credits, isCreatingCharacter, simpleMode, transferredCharacter, recentGenerations
    } = props;
    const { state, dispatch } = useAppContext();
    const { isPreAnalyzing } = state;
    
    const [activeCategory, setActiveCategory] = useState<WallpaperPreset['category'] | '⭐ Recommended'>('Cars');
    const [searchTerm, setSearchTerm] = useState('');
    const [presetGenTheme, setPresetGenTheme] = useState('');
    const [isGeneratingPreset, setIsGeneratingPreset] = useState(false);
    const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
    const [isRefreshingPresetId, setIsRefreshingPresetId] = useState<string | null>(null);
    const [sheetCharacter, setSheetCharacter] = useState<Character | null>(null);

    // Use the new bulk hook for efficient image loading
    const characterImageIds = useMemo(() => characterLibrary.map(c => c.imageId), [characterLibrary]);
    const { images: characterImages, isLoading: areImagesLoading } = useBulkCachedImages(characterImageIds);


    /**
     * Callback for the image input hook. It checks for transparency to decide whether to use
     * the free sticker import flow or the paid character creation flow.
     */
    const onImageLoaded = useCallback(async (imageData: string) => {
        const isTransparent = await hasTransparency(imageData);
        if(isTransparent) {
            characterCreation.importStickerCharacter(imageData);
        } else {
            characterCreation.createCharacter(imageData, 'New Character');
        }
    }, [characterCreation]);

    const imageInput = useImageInputHandler({ 
        onImageLoaded,
        onError: (e) => dispatch({ type: 'GENERATION_ERROR', payload: e.message }),
    });

    const handleCollectionDrop = (e: React.DragEvent) => {
        const data = e.dataTransfer.getData(DRAG_AND_DROP_TYPE);
        if (data) {
            try {
                const result: GeneratedResult = JSON.parse(data);
                if (result.characterId && characterLibrary.some(c => c.id === result.characterId)) {
                    handleCharacterToggle(result.characterId);
                } else {
                    dispatch({ type: 'GENERATION_ERROR', payload: 'The dropped item must be a saved character to be used in a wallpaper.'});
                }
            } catch (error) {
                console.error("Failed to parse dropped item", error);
            }
        }
    };

    /** Dispatches an action to update a specific wallpaper setting. Memoized for performance. */
    const handleSettingChange = useCallback((field: keyof WallpaperSettings, value: any) => {
        dispatch({ type: 'SET_WALLPAPER_SETTING', payload: { [field]: value } });
    }, [dispatch]);

    /**
     * This effect handles the special workflow where a character is "transferred" from the sticker studio.
     * It automatically selects the character and sets the wallpaper prompt based on the character's analysis.
     */
    useEffect(() => {
        if (transferredCharacter) {
            handleCharacterToggle(transferredCharacter.id, true); // Force select
            const newPrompt = `A wallpaper featuring ${transferredCharacter.name}, in a style matching '${transferredCharacter.style}', with a mood of '${transferredCharacter.mood}'.`;
            handleSettingChange('customPrompt', newPrompt);
            dispatch({ type: 'CLEAR_TRANSFERRED_CHARACTER' });
        }
    }, [transferredCharacter, dispatch]); // Dependency array deliberately minimal to only run on transfer

    const handleCharacterToggle = (id: string, forceSelect?: boolean) => {
        const currentSelection = wallpaperSettings.selectedCharacterIds;
        let newSelection;
        if (forceSelect) {
            newSelection = [...new Set([...currentSelection, id])];
        } else {
            newSelection = currentSelection.includes(id)
                ? currentSelection.filter(charId => charId !== id)
                : [...currentSelection, id];
        }
        handleSettingChange('selectedCharacterIds', newSelection);
    };
    
    const handleUpdateCharacter = useCallback((updatedChar: Character) => {
        dispatch({ type: 'UPDATE_CHARACTER', payload: updatedChar });
    }, [dispatch]);

    const handleViewCharacterSheet = useCallback((char: Character) => {
        setSheetCharacter(char);
    }, []);
    
    const handleViewLarger = useCallback((char: Character, imageData: string) => {
        const viewerImage: ViewerImage = {
            id: char.id,
            dataUrl: imageData,
            type: 'image',
            prompt: `Character: ${char.name}`
        };
        dispatch({ type: 'OPEN_VIEWER', payload: { images: [viewerImage], startIndex: 0 } });
    }, [dispatch]);
    

    const handleSelectPreset = (preset: WallpaperPreset) => {
        handleSettingChange('selectedPresetId', preset.id);
        handleSettingChange('customPrompt', preset.prompt);
    };

    const handleRefreshPreset = async (preset: WallpaperPreset) => {
        if (isRefreshingPresetId) return;
        setIsRefreshingPresetId(preset.id);
        try {
            const newPrompt = await regeneratePresetPrompt(preset);
            handleSettingChange('customPrompt', newPrompt);
            handleSettingChange('selectedPresetId', null); // It's now a custom prompt
        } catch (e: any) {
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Failed to refresh preset.' });
        } finally {
            setIsRefreshingPresetId(null);
        }
    };
    
    const handleGenerateSuggestions = async () => {
        if (!presetGenTheme.trim() || isGeneratingPreset) return;
        setIsGeneratingPreset(true);
        try {
            const suggestions = await generatePresetSuggestions(presetGenTheme);
            setPromptSuggestions(suggestions);
        } catch (e: any) {
            dispatch({ type: 'GENERATION_ERROR', payload: e.message || 'Failed to generate suggestions.' });
        } finally {
            setIsGeneratingPreset(false);
        }
    };

    /**
     * Memoized value that filters the wallpaper presets based on the current category and search term.
     */
    const filteredPresets = useMemo(() => {
        let presets = WALLPAPER_PRESETS;
        if (activeCategory === '⭐ Recommended') {
            const recommendedIds = new Set(characterLibrary
                .filter(c => wallpaperSettings.selectedCharacterIds.includes(c.id))
                .flatMap(c => c.recommendedPresets || []));
            presets = WALLPAPER_PRESETS.filter(p => recommendedIds.has(p.id));
        } else {
            presets = WALLPAPER_PRESETS.filter(p => p.category === activeCategory);
        }
        if (searchTerm) {
            return presets.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.prompt.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return presets;
    }, [activeCategory, searchTerm, characterLibrary, wallpaperSettings.selectedCharacterIds]);

    const isGenerating = isLoading || isCreatingCharacter || isPreAnalyzing || imageInput.isProcessing;
    
    const isReadyToGenerate = (!!wallpaperSettings.customPrompt || !!wallpaperSettings.selectedPresetId) && !isGenerating;

    return (
        <div className="flex flex-col h-full">
            {sheetCharacter && (
                <CharacterSheet 
                    character={sheetCharacter} 
                    onClose={() => setSheetCharacter(null)} 
                    onUpdate={handleUpdateCharacter} 
                    feedbackBin={feedbackBin} 
                />
            )}
            <div className="flex-1 overflow-y-auto" onPaste={isGenerating ? undefined : imageInput.handlePaste}>

                <Section title="1. Select Characters">
                    <div data-tour-id="character-library" className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {areImagesLoading && characterLibrary.length > 0 ? (
                            // FIX: Replaced `Array.from({ length })` which can be incorrectly typed as `unknown[]`.
                            // Using `[...Array(length)]` creates a correctly typed `undefined[]` array for mapping.
                            [...Array(Math.min(characterLibrary.length, 10))].map((_, index) => (
                                <div key={index} className="relative aspect-square rounded-lg bg-gray-700 animate-pulse"></div>
                            ))
                        ) : characterLibrary.length > 0 ? (
                            characterLibrary.map(char => (
                                <CharacterGridItem
                                    key={char.id}
                                    char={char}
                                    imageData={characterImages.get(char.imageId) || null}
                                    isSelected={wallpaperSettings.selectedCharacterIds.includes(char.id)}
                                    onToggle={handleCharacterToggle}
                                    onViewSheet={handleViewCharacterSheet}
                                    onViewLarger={handleViewLarger}
                                />
                            ))
                        ) : (
                             <div className="col-span-full text-center text-xs text-gray-400 py-4 bg-gray-900/50 rounded-lg">
                                No characters in your library yet.
                            </div>
                        )}
                    </div>
                    <div 
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
                        className={`mt-2 flex items-center justify-center p-3 border-2 border-dashed rounded-md transition-colors ${isGenerating ? 'cursor-not-allowed bg-gray-700/50' : 'cursor-pointer'} ${imageInput.isDragging ? 'border-purple-500 bg-purple-900/20' : 'border-gray-600 hover:border-gray-500'}`}
                    >
                         <input ref={imageInput.fileInputRef} type="file" onChange={imageInput.handleFileChange} accept="image/*,.heic,.heif" className="hidden" disabled={isGenerating}/>
                         {isCreatingCharacter || isPreAnalyzing || imageInput.isProcessing ? (
                            <AiCore isProcessing={true} className="w-20 h-20" />
                         ) : (
                            <div className="text-center">
                                <p className="text-xs text-gray-200 font-semibold">Import Character / Photo</p>
                                <p className="text-[10px] text-gray-400">Upload a photo to create a character, or a transparent sticker to import for free.</p>
                            </div>
                         )}
                    </div>
                </Section>
                
                <Section title="2. Background Scene">
                    <FormField label="Custom Prompt" helpText="Describe the scene you want to create. Be descriptive!">
                         <textarea 
                            data-tour-id="wallpaper-prompt"
                            value={wallpaperSettings.customPrompt} 
                            onChange={e => handleSettingChange('customPrompt', e.target.value)} 
                            rows={4} 
                            placeholder="e.g., A mystical, ancient forest with massive, moss-covered trees. Ethereal sunbeams pierce through the dense canopy..." 
                            className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" 
                        />
                    </FormField>
                     <FormField
                        label="Smart Context Adaptation"
                        helpText="When enabled, the AI will intelligently re-light and blend your characters into the generated background for a more realistic composition. This uses a more advanced (and powerful) generation pipeline."
                    >
                        <button
                            id="smart-adaptation-toggle"
                            role="switch"
                            aria-checked={wallpaperSettings.useSmartContextAdaptation}
                            onClick={() => handleSettingChange('useSmartContextAdaptation', !wallpaperSettings.useSmartContextAdaptation)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${wallpaperSettings.useSmartContextAdaptation ? 'bg-purple-600' : 'bg-gray-600'}`}
                        >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wallpaperSettings.useSmartContextAdaptation ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </FormField>
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-200 mb-2">✨ AI Prompt Assistant</h4>
                        <div className="flex gap-2">
                             <input type="text" value={presetGenTheme} onChange={e => setPresetGenTheme(e.target.value)} placeholder="Enter a theme, e.g., 'lonely astronaut'" className="flex-grow bg-gray-700 border border-gray-600 rounded-md text-sm" />
                             <button onClick={handleGenerateSuggestions} disabled={!isApiKeySet || isGeneratingPreset} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm py-1.5 px-3 rounded-md disabled:opacity-50">Suggest</button>
                        </div>
                         {promptSuggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {promptSuggestions.map((prompt, i) => (
                                    <button key={i} onClick={() => handleSettingChange('customPrompt', prompt)} className="w-full text-left text-xs p-2 bg-gray-700/50 hover:bg-gray-700 rounded-md transition-colors">{prompt}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </Section>
                 {recentGenerations.length > 0 && (
                    <Section title="Recent Generations">
                        <div className="flex overflow-x-auto space-x-3 -mx-4 px-4 pb-2">
                            {recentGenerations.map(gen => (
                                <div key={gen.id} className="relative w-24 h-24 flex-shrink-0 group">
                                    <img src={gen.dataUrl} alt="Recent generation thumbnail" className="w-full h-full object-cover rounded-md" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        {/* Fix: Replaced incorrect 'ADD_TO_FEEDBACK_BIN' action with 'ADD_RESULTS_TO_COLLECTION' and wrapped payload in an array. */}
                                        <button onClick={() => dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [gen] })} title="Pin to Collection" className="p-1.5 bg-gray-800/80 rounded-full text-white hover:bg-purple-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918a4 4 0 01-1.343 1.262l-3.155 1.262a.5.5 0 01-.65-.65z" /><path d="M12.25 3.25a.75.75 0 00-1.06.04L6.939 7.54a2.5 2.5 0 00-.8 1.231l-1.022 2.556a.25.25 0 00.325.325l2.556-1.022a2.5 2.5 0 001.23-.8l4.25-4.25a.75.75 0 00-.04-1.06z" /></svg>
                                        </button>
                                        <button onClick={() => downloadResult(gen)} title="Download" className="p-1.5 bg-gray-800/80 rounded-full text-white hover:bg-green-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
                <Section title="Preset Browser" initiallyCollapsed>
                    <div className="flex flex-col gap-4">
                         <input type="text" placeholder="Search presets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm" />
                        <div className="flex flex-wrap gap-2">
                             {(['⭐ Recommended', ...new Set(WALLPAPER_PRESETS.map(p => p.category))] as const).map(cat => (
                                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-2.5 py-1 text-xs font-semibold rounded-full ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{cat}</button>
                            ))}
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 -mr-4 pr-4">
                            {filteredPresets.map(preset => (
                                <div key={preset.id} className={`p-2 rounded-md transition-colors flex justify-between items-center ${wallpaperSettings.selectedPresetId === preset.id ? 'bg-purple-800/50' : 'hover:bg-gray-700/50'}`}>
                                    <button onClick={() => handleSelectPreset(preset)} className="text-left flex-grow">
                                        <p className="text-sm font-semibold text-gray-200">{preset.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{preset.prompt}</p>
                                    </button>
                                    <button onClick={() => handleRefreshPreset(preset)} className="ml-2 p-1 text-gray-400 hover:text-white flex-shrink-0" title="Get a new variation">
                                         {isRefreshingPresetId === preset.id ? (
                                            <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a5.002 5.002 0 008.057 4.287 1 1 0 111.885.666A7.002 7.002 0 014.101 17.9V15a1 1 0 112 0v5a1 1 0 01-1 1H1a1 1 0 110-2h2.091a5.002 5.002 0 00-3.999-6.238 1 1 0 01.666-1.886z" clipRule="evenodd" /></svg>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>
                <Section title="3. Advanced Composition" initiallyCollapsed={simpleMode}>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Size"><select value={wallpaperSettings.size.name} onChange={e => handleSettingChange('size', WALLPAPER_SIZES.find(s => s.name === e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{WALLPAPER_SIZES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></FormField>
                        <FormField label="Quality"><select value={wallpaperSettings.qualityLevel} onChange={e => handleSettingChange('qualityLevel', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{QUALITY_LEVELS.map(q => <option key={q} value={q}>{q}</option>)}</select></FormField>
                        <FormField label="Character Position"><select value={wallpaperSettings.characterPosition} onChange={e => handleSettingChange('characterPosition', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{['Center', 'Left', 'Right', 'Bottom', 'Multiple', 'Floating', 'Scattered'].map(p => <option key={p} value={p}>{p}</option>)}</select></FormField>
                        <FormField label="Lighting Style"><select value={wallpaperSettings.lightingStyle} onChange={e => handleSettingChange('lightingStyle', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{LIGHTING_STYLES.map(l => <option key={l} value={l}>{l}</option>)}</select></FormField>
                         <FormField label="Blending Mode"><select value={wallpaperSettings.blendingMode} onChange={e => handleSettingChange('blendingMode', e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm">{BLENDING_MODES.map(b => <option key={b} value={b}>{b}</option>)}</select></FormField>
                    </div>
                     <FormField label="Character Size" helpText="How prominent the characters are in the scene.">
                        <input type="range" min="10" max="100" step="5" value={wallpaperSettings.characterSize} onChange={e => handleSettingChange('characterSize', parseInt(e.target.value))} className="w-full" />
                         <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                            <span className="text-[10px]">🧍‍♂️ Small</span>
                            <span className="text-sm">🧍 Medium</span>
                            <span className="text-lg">🧍‍♂️ Large</span>
                        </div>
                    </FormField>
                </Section>
            </div>
            <div className="p-4 bg-gray-900/50 flex items-center justify-between flex-shrink-0 border-t border-gray-700/50">
                <button 
                    onClick={() => {
                        const newPrompt = `A stunning wallpaper featuring a lonely astronaut floating in a colorful nebula.`;
                        handleSettingChange('customPrompt', newPrompt);
                    }}
                    className="text-sm font-semibold text-purple-400 hover:text-purple-300"
                    title="Get a creative AI-powered suggestion"
                >
                    Inspire Me
                </button>
                <button
                    data-tour-id="wallpaper-generate"
                    onClick={generation.generateWallpaper}
                    disabled={!isReadyToGenerate}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Working...' : 'Generate Wallpaper'}
                </button>
            </div>
        </div>
    );
};

const propsAreEqual = (prevProps: Readonly<WallpaperWorkflowProps>, nextProps: Readonly<WallpaperWorkflowProps>) => {
  return (
    prevProps.characterLibrary === nextProps.characterLibrary &&
    prevProps.wallpaperSettings === nextProps.wallpaperSettings &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.credits === nextProps.credits &&
    prevProps.isCreatingCharacter === nextProps.isCreatingCharacter &&
    prevProps.simpleMode === nextProps.simpleMode &&
    prevProps.transferredCharacter === nextProps.transferredCharacter &&
    prevProps.feedbackBin === nextProps.feedbackBin &&
    prevProps.recentGenerations === nextProps.recentGenerations
  );
};

export default React.memo(WallpaperStudioWorkflowComponent, propsAreEqual);
