/**
 * @file components/CollectionModal.tsx
 * @description A full-featured modal for managing the user's collection of saved results.
 * It includes a gallery view, search/filter, bulk actions, and drag-and-drop functionality.
 */

import React, { useState, useMemo, useCallback } from 'react';
import JSZip from 'jszip';
import { useAppContext } from '../../context/AppContext';
import { DRAG_AND_DROP_TYPE } from '../../constants';
import type { GeneratedResult, Settings, ViewerImage, CollectionItem } from '../../types/types';
import { downloadCollectionAsZip } from '../../utils/stateManager';

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CollectionItemDisplay: React.FC<{
    item: CollectionItem;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onView: (item: CollectionItem) => void;
}> = ({ item, isSelected, onToggleSelect, onView }) => {
    
    const handleDragStart = (e: React.DragEvent) => {
        if (item.metadata.success === false) {
            e.preventDefault();
            return;
        }
        // We still need to drag the original GeneratedResult for compatibility with drop zones
        const originalItem = (window as any).__FEEDBACK_BIN_MAP.get(item.id);
        if (originalItem) {
            e.dataTransfer.setData(DRAG_AND_DROP_TYPE, JSON.stringify(originalItem));
            e.dataTransfer.effectAllowed = 'copy';
        }
    };
    
    const isFailed = item.metadata.success === false;

    return (
        <div 
            className={`relative aspect-square rounded-lg group ${isFailed ? 'cursor-not-allowed' : 'cursor-pointer'} bg-gray-800`}
            draggable={!isFailed}
            onDragStart={handleDragStart}
        >
            <div className="absolute top-2 left-2 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="h-5 w-5 rounded text-purple-600 bg-gray-700 border-gray-500 focus:ring-purple-500"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div onClick={() => onView(item)}>
                {isFailed ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 border-2 border-dashed border-red-500/50 rounded-lg p-2 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500/80" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-xs font-semibold text-red-400/80 mt-2">Generation Failed</p>
                    </div>
                ) : item.type === 'image' || item.type === 'wallpaper' ? (
                    <img src={item.dataUrl} alt={item.metadata.expression || 'Collection item'} className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <video src={item.dataUrl} loop autoPlay muted playsInline className="w-full h-full object-cover rounded-lg" />
                )}
            </div>
            {!isFailed && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="text-xs text-center text-white p-1 bg-black/50 rounded">{item.metadata.expression || item.type}</p>
                </div>
            )}
        </div>
    );
};


export const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppContext();
    const { feedbackBin } = state;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | GeneratedResult['type']>('all');
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [showFailed, setShowFailed] = useState(false);

    // Map GeneratedResult[] from global state to the structured CollectionItem[] for UI use.
    const collectionItems = useMemo((): CollectionItem[] => {
        const itemMap = new Map<string, GeneratedResult>();
        const items = feedbackBin.map(result => {
            itemMap.set(result.id, result);
            const settings = (result.settings || {}) as Partial<Settings>;
            return {
                id: result.id,
                type: result.type as CollectionItem['type'],
                dataUrl: result.dataUrl,
                metadata: {
                    expression: result.sourceExpression,
                    style: settings.style,
                    dateAdded: result.timestamp || new Date().toISOString(),
                    settings: settings,
                    success: result.success,
                    errorMessage: result.errorMessage,
                },
            };
        });
        // A bit of a hack to make the original item available for drag-and-drop
        (window as any).__FEEDBACK_BIN_MAP = itemMap;
        return items;
    }, [feedbackBin]);

    const filteredItems = useMemo(() => {
        return collectionItems.filter(item => {
            if (!showFailed && item.metadata.success === false) return false;
            const typeMatch = filterType === 'all' || item.type === filterType;
            const searchTermMatch = searchTerm === '' || 
                (item.metadata.expression && item.metadata.expression.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.metadata.style && item.metadata.style.toLowerCase().includes(searchTerm.toLowerCase()));
            return typeMatch && searchTermMatch;
        });
    }, [collectionItems, searchTerm, filterType, showFailed]);

    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);
    
    const handleSelectAll = () => {
        if (selectedIds.length === filteredItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map(item => item.id));
        }
    };
    
    const handleViewItem = useCallback((item: CollectionItem) => {
        const originalResult = feedbackBin.find(fb => fb.id === item.id);
        if (!originalResult) return;

        if (originalResult.success === false) {
            alert(`Generation Failed:\n\n${originalResult.errorMessage || 'No error details available.'}`);
            return;
        }

        const viewerImage: ViewerImage = {
            id: originalResult.id,
            dataUrl: originalResult.dataUrl,
            type: originalResult.type,
            settings: originalResult.settings,
            prompt: originalResult.prompt,
            sourceExpression: originalResult.sourceExpression,
        };
        const itemIndex = feedbackBin.findIndex(fb => fb.id === item.id);
        dispatch({ type: 'OPEN_VIEWER', payload: { images: feedbackBin.filter(i => i.success !== false), startIndex: itemIndex >= 0 ? itemIndex : 0 }});
    }, [dispatch, feedbackBin]);
    
    const handleDeleteSelected = () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`)) {
            selectedIds.forEach(id => dispatch({ type: 'REMOVE_FROM_FEEDBACK_BIN', payload: id }));
            setSelectedIds([]);
        }
    };
    
    const handleDownloadSelected = async () => {
        const itemsToDownload = feedbackBin.filter(item => selectedIds.includes(item.id) && item.success !== false);
        if (itemsToDownload.length > 0) {
            await downloadCollectionAsZip(itemsToDownload);
        }
    };

    const handleCopyAllData = () => {
        const reportParts: string[] = [];
        reportParts.push(`# AI STICKER STUDIO - GENERATION HISTORY EXPORT`);
        reportParts.push(`Generated: ${new Date().toISOString()}`);
        reportParts.push(`Total Items: ${feedbackBin.length}`);
        reportParts.push(`\n---\n`);

        feedbackBin.forEach((item, index) => {
            const title = item.sourceExpression || item.type;
            const status = item.success === false ? 'FAILED' : 'Success';
            reportParts.push(`## Item ${index + 1}: ${title} [${status}]`);
            reportParts.push(`- **ID**: ${item.id}`);
            reportParts.push(`- **Type**: ${item.type}`);
            if (item.timestamp) reportParts.push(`- **Timestamp**: ${item.timestamp}`);
            if (item.creditCost) reportParts.push(`- **Cost**: ${item.creditCost.toFixed(2)} credits`);
            if (item.operationType) reportParts.push(`- **Operation**: ${item.operationType}`);
            if (item.generationTimeMs) reportParts.push(`- **Time**: ${(item.generationTimeMs / 1000).toFixed(2)}s`);
            if (item.modelUsed) reportParts.push(`- **Model**: \`${item.modelUsed}\``);
            if (item.sourceExpression) reportParts.push(`- **Expression**: ${item.sourceExpression}`);
            if (item.attempts) reportParts.push(`- **Attempts**: ${item.attempts}`);
            if (item.validation) {
                const validationStatus = item.validation.isValid ? `Valid (Score: ${item.validation.similarityScore}%)` : `Invalid (Score: ${item.validation.similarityScore}%, Issues: ${item.validation.issues.join(', ') || 'N/A'})`;
                reportParts.push(`- **Validation**: ${validationStatus}`);
            }
            if(item.success === false && item.errorMessage) {
                reportParts.push(`- **ERROR**: ${item.errorMessage}`);
            }
            reportParts.push(`\n### Prompt`);
            reportParts.push(`${item.prompt}`);
            reportParts.push(`\n### Settings`);
            reportParts.push('```json');
            reportParts.push(JSON.stringify(item.settings, null, 2));
            reportParts.push('```');
            reportParts.push(`\n---\n`);
        });

        navigator.clipboard.writeText(reportParts.join('\n')).then(() => {
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2500);
        }).catch(err => {
            console.error('Failed to copy data', err);
            alert('Failed to copy data. Please check console for errors.');
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onClose} role="dialog">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700/50">
                    <h2 className="text-xl font-bold text-white font-heading">Generation History ({feedbackBin.length})</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <div className="p-4 border-b border-gray-700/50 flex flex-col md:flex-row gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search by expression or style..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:flex-grow bg-gray-700 border border-gray-600 rounded-md text-sm text-white px-3 py-1.5 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                             <label htmlFor="show-failed-toggle" className="text-sm font-medium text-gray-300 cursor-pointer">Show Failed</label>
                             <button
                                id="show-failed-toggle"
                                role="switch"
                                aria-checked={showFailed}
                                onClick={() => setShowFailed(!showFailed)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${showFailed ? 'bg-purple-600' : 'bg-gray-600'}`}>
                                 <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showFailed ? 'translate-x-5' : 'translate-x-0'}`} />
                             </button>
                        </div>
                        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded-md text-sm text-white px-3 py-1.5 focus:ring-purple-500 focus:border-purple-500">
                            <option value="all">All Types</option>
                            <option value="image">Stickers</option>
                            <option value="wallpaper">Wallpapers</option>
                            <option value="video">Animated</option>
                        </select>
                        <button onClick={handleSelectAll} className="text-sm font-semibold text-purple-300 hover:text-white">
                            {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? 'Select None' : 'Select All'}
                        </button>
                    </div>
                </div>
                <main className="flex-grow p-4 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredItems.map(item => (
                                <CollectionItemDisplay key={item.id} item={item} isSelected={selectedIds.includes(item.id)} onToggleSelect={handleToggleSelect} onView={handleViewItem}/>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-16">
                             <p className="font-semibold text-gray-300 mb-2">No Items Match Your Filters</p>
                             <p>Try adjusting your search or filter settings.</p>
                        </div>
                    )}
                </main>
                <footer className="p-4 bg-gray-900/50 flex justify-between items-center border-t border-gray-700/50">
                    <p className="text-sm text-gray-400">{selectedIds.length} item(s) selected</p>
                    <div className="flex items-center gap-4">
                        <button onClick={handleCopyAllData} className="text-sm font-semibold text-teal-400 hover:text-teal-300 disabled:opacity-50" disabled={feedbackBin.length === 0}>
                             {copyStatus === 'copied' ? '✓ Copied!' : 'Copy All Data'}
                        </button>
                        <button onClick={handleDeleteSelected} disabled={selectedIds.length === 0} className="text-sm font-semibold text-red-400 hover:text-red-300 disabled:opacity-50">Delete Selected</button>
                        <button onClick={handleDownloadSelected} disabled={selectedIds.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">Download Selected</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};