/**
 * @file components/CharacterSheet.tsx
 * @description A modal component that displays detailed information about a saved character.
 * It allows users to view and edit character properties and see a gallery of creations
 * featuring that character.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Character, GeneratedResult, Settings, WallpaperSettings } from '../../types/types';
import { useAppContext, useCachedImage } from '../../context/AppContext';

/**
 * @interface CharacterSheetProps
 * @description Defines the props for the CharacterSheet component.
 */
interface CharacterSheetProps {
    character: Character;
    onClose: () => void;
    onUpdate: (character: Character) => void;
    feedbackBin: GeneratedResult[]; // Passed in to build the character-specific gallery.
}

/**
 * @component CharacterImage
 * @description A small helper component to display a character's image from the cache,
 * showing a loading state while the image is being retrieved.
 * @param {{ character: Character }} props - The character to display.
 */
const CharacterImage: React.FC<{ character: Character }> = ({ character }) => {
    const imageData = useCachedImage(character.imageId);
    if (!imageData) return <div className="w-full rounded-lg bg-gray-700 animate-pulse aspect-square" />;
    return <img src={imageData} alt={character.name} className="w-full rounded-lg" />;
};

/**
 * @component CharacterSheetComponent
 * @description The main component for the character sheet modal. It manages local state for
 * editing character details and toggling between the details view and the gallery view.
 */
const CharacterSheetComponent: React.FC<CharacterSheetProps> = ({ character, onClose, onUpdate, feedbackBin }) => {
    const { dispatch } = useAppContext();
    const imageData = useCachedImage(character.imageId);
    const [isEditing, setIsEditing] = useState(false);
    // A local copy of the character object is used to manage changes during editing.
    const [editableCharacter, setEditableCharacter] = useState<Character>(character);
    const [activeTab, setActiveTab] = useState<'details' | 'gallery'>('details');

    // Reset the editable character if the character prop changes (e.g., opening a new sheet).
    useEffect(() => {
        setEditableCharacter(character);
    }, [character]);

    /**
     * Handles changes to input fields when in editing mode.
     * @param {keyof Character} field - The character property to update.
     * @param {string} value - The new value.
     */
    const handleInputChange = (field: keyof Character, value: string) => {
        setEditableCharacter(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Saves the changes made to the character and exits editing mode.
     * It also handles converting comma-separated tags from the input into a string array.
     */
    const handleSave = () => {
        const tagsArray = typeof editableCharacter.tags === 'string'
            ? (editableCharacter.tags as string).split(',').map(tag => tag.trim()).filter(Boolean)
            : editableCharacter.tags;
        
        onUpdate({ ...editableCharacter, tags: tagsArray });
        setIsEditing(false);
    };
    
    /**
     * Cancels the edit and reverts any changes.
     */
    const handleCancelEdit = () => {
        setEditableCharacter(character); // Revert changes to the original.
        setIsEditing(false);
    };

    /**
     * A memoized value that filters the global feedbackBin to find all generated results
     * that are associated with the current character.
     */
    const characterGallery = useMemo(() => {
        return feedbackBin.filter(item => {
            // For wallpapers, check if the character is in the list of selected characters.
            if (item.type === 'wallpaper') {
                return (item.settings as WallpaperSettings).selectedCharacterIds?.includes(character.id);
            }
            // For stickers, check if the character ID matches or if the identity anchor image matches.
            return item.characterId === character.id || (item.settings as Partial<Settings>).identityAnchorImageId === character.imageId;
        });
    }, [character, feedbackBin]);
    
    const commonInputClass = "bg-gray-700 text-white rounded p-1 text-sm w-full border border-gray-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500";

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
                    {isEditing ? (
                        <input type="text" value={editableCharacter.name} onChange={e => handleInputChange('name', e.target.value)} className="bg-gray-900 border border-gray-600 rounded-md text-xl font-bold text-white p-1" />
                    ) : (
                        <h2 className="text-xl font-bold text-white font-heading">{character.name}</h2>
                    )}
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleCancelEdit} className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-1 rounded-md">Cancel</button>
                                <button onClick={handleSave} className="text-sm font-semibold bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md">Save</button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-purple-400 hover:text-purple-300">Edit</button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                </div>
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-700/50">
                     <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'details' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>Details</button>
                     <button onClick={() => setActiveTab('gallery')} className={`px-4 py-2 text-sm font-semibold ${activeTab === 'gallery' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}>Gallery ({characterGallery.length})</button>
                </div>
                {/* Tab Content */}
                <div className="flex-grow p-4 overflow-y-auto">
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column: Image and Analysis */}
                            <div className="space-y-4">
                                {imageData ? (
                                    <button
                                        onClick={() => dispatch({ type: 'OPEN_VIEWER', payload: { images: [{ id: character.id, dataUrl: imageData, type: 'image' }], startIndex: 0 } })}
                                        className="w-full block"
                                        title="View larger"
                                    >
                                        <CharacterImage character={character} />
                                    </button>
                                ) : (
                                    <CharacterImage character={character} />
                                )}
                                <div className="p-3 bg-gray-900/50 rounded-lg">
                                    <h3 className="font-semibold text-gray-200 mb-2">Character Analysis</h3>
                                    <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm items-center">
                                        <span className="text-gray-400">Gender:</span> 
                                        {isEditing ? <input type="text" value={editableCharacter.gender || ''} onChange={e => handleInputChange('gender', e.target.value)} className={commonInputClass} /> : <span className="text-white">{character.gender || 'N/A'}</span>}
                                        
                                        <span className="text-gray-400">Age Group:</span> 
                                        {isEditing ? <input type="text" value={editableCharacter.ageGroup || ''} onChange={e => handleInputChange('ageGroup', e.target.value)} className={commonInputClass} /> : <span className="text-white">{character.ageGroup || 'N/A'}</span>}
                                        
                                        <span className="text-gray-400">Mood:</span> 
                                        {isEditing ? <input type="text" value={editableCharacter.mood || ''} onChange={e => handleInputChange('mood', e.target.value)} className={commonInputClass} /> : <span className="text-white">{character.mood || 'N/A'}</span>}
                                        
                                        <span className="text-gray-400">Style:</span> 
                                        {isEditing ? <input type="text" value={editableCharacter.style || ''} onChange={e => handleInputChange('style', e.target.value)} className={commonInputClass} /> : <span className="text-white">{character.style || 'N/A'}</span>}
                                        
                                        <span className="text-gray-400 col-span-2">Tags:</span>
                                        <div className="col-span-2">
                                            {isEditing ? (
                                                <input 
                                                    type="text" 
                                                    value={Array.isArray(editableCharacter.tags) ? editableCharacter.tags.join(', ') : editableCharacter.tags || ''} 
                                                    onChange={e => handleInputChange('tags', e.target.value)}
                                                    placeholder="e.g., sci-fi, armor, cool"
                                                    className={`${commonInputClass} mt-1`} />
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {(character.tags || []).length > 0 ? (
                                                        (character.tags || []).map(tag => <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>)
                                                    ) : (
                                                        <span className="text-xs text-gray-500">No tags</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Right Column: Identity Template and Metadata */}
                             <div className="space-y-4">
                                {character.identityTemplate && (
                                     <div className="p-3 bg-gray-900/50 rounded-lg">
                                        <h3 className="font-semibold text-gray-200 mb-2">Identity Template</h3>
                                        <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto max-h-48">
                                            {JSON.stringify(JSON.parse(character.identityTemplate), null, 2)}
                                        </pre>
                                    </div>
                                )}
                                 <div className="p-3 bg-gray-900/50 rounded-lg">
                                    <h3 className="font-semibold text-gray-200 mb-2">Metadata</h3>
                                     <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <span className="text-gray-400">ID:</span> <span className="text-white truncate" title={character.id}>{character.id.substring(0,8)}...</span>
                                        <span className="text-gray-400">Type:</span> <span className="text-white capitalize">{character.type || 'N/A'}</span>
                                        <span className="text-gray-400">Created:</span> <span className="text-white">{character.createdAt ? new Date(character.createdAt).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'gallery' && (
                        characterGallery.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {characterGallery.map(item => (
                                    <div key={item.id} className="relative group aspect-square">
                                        {item.type === 'image' || item.type === 'svg' || item.type === 'wallpaper' ? (
                                            <img src={item.dataUrl} alt={item.sourceExpression ? `Gallery item: ${item.sourceExpression}` : `Gallery item: ${item.type}`} className="w-full h-full object-cover rounded-md" />
                                        ) : (
                                            <video src={item.dataUrl} loop autoPlay muted playsInline className="w-full h-full object-cover rounded-md" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 p-8">
                                <p className="font-semibold text-gray-300 mb-2">No Gallery Items Found</p>
                                <p>Creations you save to "My Collection" that use this character will appear here.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export const CharacterSheet = React.memo(CharacterSheetComponent);