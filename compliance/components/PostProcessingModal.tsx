/**
 * @file components/PostProcessingModal.tsx
 * @description A modal component that provides a suite of AI-powered tools for editing
 * and enhancing a generated sticker. This includes background removal, vectorization,
 * and adding speech bubbles.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeneratedResult, Settings } from '../../types/types';
import { useAppContext } from '../../context/AppContext';
import { AiCore } from './StickerPreview';
import { isApiKeySet, generateAndPlaceSpeechBubble, performGenericEdit } from '../../utils/services/geminiService';
import { CREDIT_COSTS, RASTERIZE_RESOLUTION } from '../../constants';

/**
 * @interface PostProcessingModalProps
 * @description Defines the props for the PostProcessingModal component.
 */
interface PostProcessingModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: GeneratedResult;
}

/**
 * Converts an SVG data URL to a PNG data URL. This is necessary because some AI editing
 * functions require a raster image (PNG/JPEG) as input.
 * @param {string} svgDataUrl - The `data:image/svg+xml;base64,...` string.
 * @returns {Promise<string>} A promise that resolves with the PNG data URL.
 */
const rasterizeSvg = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Rasterize at a reasonably high resolution to maintain quality.
            const targetWidth = RASTERIZE_RESOLUTION;
            const scale = targetWidth / (img.naturalWidth || targetWidth);
            canvas.width = targetWidth;
            canvas.height = (img.naturalHeight || targetWidth) * scale;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get 2D canvas context for rasterization.'));
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load SVG image for rasterization.'));
        };
        img.src = svgDataUrl;
    });
};

/**
 * @component PostProcessingModal
 * @description The main component for the post-processing studio. It manages local state for
 * undo/redo, pan/zoom, and the various editing tools.
 */
export const PostProcessingModal: React.FC<PostProcessingModalProps> = ({ isOpen, onClose, result }) => {
    const { state, dispatch } = useAppContext();
    const { credits, simpleMode, error } = state;
    const modalRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    
    // Local state for managing the editing session's history (undo/redo).
    const [history, setHistory] = useState<GeneratedResult[]>([result]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');

    const [activeTool, setActiveTool] = useState<string | null>(null);
    
    // State for the streamlined speech bubble tool.
    const [isDrawingBubble, setIsDrawingBubble] = useState(false);
    const drawingStartPoint = useRef({ x: 0, y: 0 });
    const [drawingRect, setDrawingRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [bubbleStyle, setBubbleStyle] = useState<'standard' | 'cloud' | 'spiky' | 'retro'>('standard');

    // State for pan and zoom functionality.
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const currentResult = history[historyIndex];

    /**
     * Calculates the optimal scale to fit the image within the container view, then resets pan.
     */
    const handleFitToScreen = useCallback(() => {
        if (imageContainerRef.current && imageRef.current && imageRef.current.naturalWidth > 0) {
            const container = imageContainerRef.current;
            const image = imageRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const imageWidth = image.naturalWidth;
            const imageHeight = image.naturalHeight;
    
            if (imageWidth === 0 || imageHeight === 0 || containerWidth === 0 || containerHeight === 0) return;
    
            // Calculate scale based on both width and height, and take the minimum.
            const scaleX = (containerWidth - 20) / imageWidth; // -20 for padding
            const scaleY = (containerHeight - 20) / imageHeight;
            
            // Don't scale up beyond 100% of the image's natural size.
            let newScale = Math.min(scaleX, scaleY, 1);
            
            setScale(newScale);
            setPan({ x: 0, y: 0 });
        }
    }, []);

    // Reset the modal's state whenever a new result is passed in.
    useEffect(() => {
        if (result) {
            setHistory([result]);
            setHistoryIndex(0);
            setIsProcessing(false);
            dispatch({ type: 'CLEAR_ERROR' });
            setActiveTool(null);
            setScale(1);
            setPan({x: 0, y: 0});
        }
    }, [result, dispatch]);
    
    // Add/remove resize listener for fit-to-screen functionality.
    useEffect(() => {
        if (isOpen) {
             window.addEventListener('resize', handleFitToScreen);
             return () => window.removeEventListener('resize', handleFitToScreen);
        }
    }, [isOpen, handleFitToScreen]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) setHistoryIndex(prev => prev - 1);
    }, [historyIndex]);
    
    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) setHistoryIndex(prev => prev + 1);
    }, [historyIndex, history.length]);

    // Add/remove keyboard shortcuts for Escape and Undo/Redo.
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'Escape') onClose();
                if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
                    event.preventDefault();
                    if (!event.shiftKey) handleUndo(); else handleRedo();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, handleUndo, handleRedo]);

    /**
     * Adds a new result to the local history stack, clearing any "redo" states.
     * @param {GeneratedResult} newResult - The new image result after an edit.
     */
    const updateHistory = (newResult: GeneratedResult) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newResult);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    /**
     * A generic function to perform an AI-powered edit. It handles loading states,
     * credit deduction, API calls, and history updates.
     * @param {string} prompt - The text prompt to send to the Gemini API.
     * @param {string} message - The loading message to display to the user.
     * @param {boolean} [isVectorization=false] - A flag to indicate if this is a vectorization task, which uses a different model and response handling.
     */
    const performEdit = async (prompt: string, message: string, isVectorization: boolean = false) => {
        const cost = CREDIT_COSTS.POST_PROCESSING_EDIT;
        if (isProcessing || !isApiKeySet || credits < cost) {
            if (credits < cost) dispatch({ type: 'GENERATION_ERROR', payload: 'Insufficient credits for this edit.' });
            return;
        }

        setIsProcessing(true);
        dispatch({ type: 'CLEAR_ERROR' });
        setProcessingMessage(message);
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: `Post-processing: ${message}` } });
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Post-processing edit', metadata: { editType: message } } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Edit cost: -${cost} credit.` } });

        try {
            let imageDataUrl = currentResult.dataUrl;
            // If the current image is an SVG but the task isn't vectorization, we need to rasterize it first.
            if (currentResult.type === 'svg' && !isVectorization) {
                setProcessingMessage('Rasterizing vector image for edit...');
                imageDataUrl = await rasterizeSvg(currentResult.dataUrl);
                setProcessingMessage(message);
            }

            const response = await performGenericEdit(imageDataUrl, prompt, isVectorization);

            let newResult: GeneratedResult;
            if (isVectorization) {
                // Handle SVG response, which is plain text.
                const svgText = response.text.replace(/```svg\n|```/g, '').trim();
                const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;
                newResult = { ...currentResult, id: crypto.randomUUID(), type: 'svg', dataUrl, prompt: `${currentResult.prompt}\n[Vectorized]` };
            } else {
                // Handle image response.
                const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
                if (!imageResponsePart?.inlineData) throw new Error("Image edit failed: No image data in response.");
                const dataUrl = `data:${imageResponsePart.inlineData.mimeType};base64,${imageResponsePart.inlineData.data}`;
                newResult = { ...currentResult, id: crypto.randomUUID(), dataUrl, prompt: `${currentResult.prompt}\n[Edited with prompt: ${prompt}]` };
            }
            updateHistory(newResult);
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Edit successful.' } });
        } catch (e: any) {
            console.error(e);
            const errorMessage = `Failed to perform edit. ${e instanceof Error ? e.message : 'An unknown error occurred.'}`;
            dispatch({ type: 'GENERATION_ERROR', payload: errorMessage });
            // Refund credits on failure.
            dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed edit refund' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Edit failed.' } });
            dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credit.` } });
        } finally {
            setIsProcessing(false);
            setActiveTool(null);
        }
    };
    
    /** Saves the final edited result to the global state and closes the modal. */
    const handleSaveAndClose = () => {
        dispatch({ type: 'UPDATE_EDITING_RESULT', payload: currentResult });
        onClose();
    };
    
    /** Initiates a download of the currently displayed image. */
    const handleDownload = () => {
        // This function reuses the global download utility for consistent filename generation.
        const link = document.createElement('a');
        link.href = currentResult.dataUrl;
        
        const slugify = (text: string = '') => text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '').substring(0, 50);

        const extension = currentResult.type === 'svg' ? 'svg' : 'png';
        let fileName = `sticker-studio-edit-${result.id.substring(0, 8)}`; // fallback

        const shortId = currentResult.id.substring(0, 6);
        const settings = currentResult.settings as Partial<Settings>;
        const style = slugify(settings.style || 'sticker');
        const expression = slugify(currentResult.sourceExpression || 'custom-edit');
        const subject = slugify(settings.subject || 'character');
        const mainPart = settings.mode === 'text-to-image' ? subject : expression;
        fileName = `${style}_${mainPart}_edit_${shortId}`;

        link.download = `${fileName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Pan and Zoom Handlers ---

    const handleWheel = (e: React.WheelEvent) => {
        if (activeTool === 'speech') return; // Disable zoom while drawing
        e.preventDefault();
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        setScale(Math.max(0.1, Math.min(newScale, 10)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // If the speech tool is active, start drawing a rectangle.
        if (activeTool === 'speech') {
            const rect = imageRef.current?.getBoundingClientRect();
            if (!rect) return;
            setIsDrawingBubble(true);
            const x = (e.clientX - rect.left) / scale - (pan.x / scale);
            const y = (e.clientY - rect.top) / scale - (pan.y / scale);
            drawingStartPoint.current = { x, y };
            setDrawingRect({ x, y, width: 0, height: 0 });
            return;
        }
        // Otherwise, start panning the image.
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawingBubble) {
            // Update the drawing rectangle dimensions.
            const rect = imageRef.current?.getBoundingClientRect();
            if (!rect) return;
            const currentX = (e.clientX - rect.left) / scale - (pan.x / scale);
            const currentY = (e.clientY - rect.top) / scale - (pan.y / scale);
            const startX = drawingStartPoint.current.x;
            const startY = drawingStartPoint.current.y;
            setDrawingRect({
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: Math.abs(currentX - startX),
                height: Math.abs(currentY - startY),
            });
        } else if (isPanning) {
            // Update the pan position.
            e.preventDefault();
            setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        }
    };

    /**
     * Handles the mouse up event. If drawing a speech bubble, it finalizes the drawing,
     * prompts the user for text, and then calls the AI to generate the bubble.
     */
    const handleMouseUp = async (e: React.MouseEvent) => {
        if (isDrawingBubble && drawingRect && drawingRect.width > 10 && drawingRect.height > 10) {
            const text = prompt('Enter speech bubble text:');
            if (text) {
                const cost = CREDIT_COSTS.POST_PROCESSING_EDIT;
                if (!isApiKeySet || credits < cost) {
                    if (credits < cost) dispatch({ type: 'GENERATION_ERROR', payload: 'Insufficient credits for this edit.' });
                } else {
                    setIsProcessing(true);
                    setProcessingMessage('Generating & placing bubble...');
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'info', message: 'Generating speech bubble.' } });
                    dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: -cost, reason: 'Add speech bubble', metadata: { text } } });
                    dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'credit', message: `Bubble cost: -${cost} credit.` } });

                    try {
                        // Normalize the drawn rectangle coordinates relative to the image size.
                        const { naturalWidth, naturalHeight } = imageRef.current!;
                        const normalizedBox = {
                            x: drawingRect.x / naturalWidth,
                            y: drawingRect.y / naturalHeight,
                            width: drawingRect.width / naturalWidth,
                            height: drawingRect.height / naturalHeight,
                        };
                        
                        const newDataUrl = await generateAndPlaceSpeechBubble(currentResult.dataUrl, text, bubbleStyle, normalizedBox);
                        const newResult: GeneratedResult = { ...currentResult, id: crypto.randomUUID(), dataUrl: newDataUrl };
                        updateHistory(newResult);
                        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Speech bubble applied.' } });
                    } catch (err: any) {
                         dispatch({ type: 'GENERATION_ERROR', payload: `Failed to generate bubble. ${err instanceof Error ? err.message : 'An unknown error occurred.'}` });
                         dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: cost, reason: 'Failed speech bubble refund' } });
                         dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'error', message: 'Bubble generation failed.' } });
                         dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: `Refunded ${cost} credit.` } });
                    } finally {
                        setIsProcessing(false);
                        setActiveTool(null);
                    }
                }
            }
        }
        // Reset drawing and panning states.
        setIsDrawingBubble(false);
        setDrawingRect(null);
        setIsPanning(false);
    };

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 10));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));

    if (!isOpen) return null;

    // A helper component for creating consistent tool buttons.
    const ToolButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isActive: boolean, disabled?: boolean, title?: string }> = ({ icon, label, onClick, isActive, disabled = false, title }) => (
        <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg text-gray-200 transition-all border-2 text-center w-full ${isActive ? 'bg-purple-600/30 border-purple-500' : 'bg-gray-700/50 border-transparent hover:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={disabled} title={title}>
            <div className="w-7 h-7">{icon}</div>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );

    const hasEnoughCreditsForEdit = credits >= CREDIT_COSTS.POST_PROCESSING_EDIT;
    const isVector = currentResult.type === 'svg';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
            <div ref={modalRef} tabIndex={-1} className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] p-4 flex flex-col outline-none" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 id="edit-modal-title" className="text-xl font-bold text-white font-heading">Post-Processing Studio</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 rounded-md disabled:opacity-50 text-gray-300 hover:enabled:bg-gray-600/50" title="Undo (Ctrl+Z)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg></button>
                            <button onClick={() => { setHistory([result]); setHistoryIndex(0); handleFitToScreen(); }} disabled={history.length <= 1 && historyIndex === 0} className="p-1.5 rounded-md disabled:opacity-50 text-gray-300 hover:enabled:bg-gray-600/50" title="Reset"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 102 0V3a1 1 0 00-1-1zM4 5a1 1 0 00-1 1v1a1 1 0 102 0V6a1 1 0 00-1-1zm12 0a1 1 0 00-1 1v1a1 1 0 102 0V6a1 1 0 00-1-1zM10 18a1 1 0 001-1v-1a1 1 0 10-2 0v1a1 1 0 001 1zM4 13a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zm12 0a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" /><path d="M10 5a5 5 0 100 10 5 5 0 000-10zM8 10a2 2 0 114 0 2 2 0 01-4 0z" /></svg></button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-md disabled:opacity-50 text-gray-300 hover:enabled:bg-gray-600/50" title="Redo (Ctrl+Shift+Z)"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a7 7 0 107 7v-2a1 1 0 112 0v2a9 9 0 11-9-9h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close edit modal"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                </div>
                {/* Main Content Area */}
                <div className="flex-grow flex gap-4 min-h-0">
                    {/* Toolbar */}
                    <div className="w-24 flex-shrink-0 flex flex-col gap-2">
                         <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19,3H5C3.9,3,3,3.9,3,5V19C3,20.1,3.9,21,5,21H19C20.1,21,21,20.1,21,19V5C21,3.9,20.1,3,19,3M19,19H5L19,5V19Z" /></svg>} label="Remove BG" onClick={() => performEdit('CRITICAL TASK: Perform a studio-quality, precision background removal. Your ONLY goal is to perfectly isolate the main subject(s) from the background. The output MUST have a transparent alpha channel. Preserve all details like hair. Do not alter the subject.', 'Removing background...')} isActive={false} disabled={!isApiKeySet || !hasEnoughCreditsForEdit || isVector} title={isVector ? 'Rasterize first' : !hasEnoughCreditsForEdit ? `Needs ${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit` : `Remove Background (${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit)`}/>
                         <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M20,2H4A2,2 0 0,0 2,4V16A2,2 0 0,0 4,18H18L22,22V4A2,2 0 0,0 20,2Z" /></svg>} label="Add Bubble" onClick={() => setActiveTool(activeTool === 'speech' ? null : 'speech')} isActive={activeTool === 'speech'} disabled={!isApiKeySet || !hasEnoughCreditsForEdit || isVector} title={isVector ? 'Rasterize first' : !hasEnoughCreditsForEdit ? `Needs ${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit` : `Add Speech Bubble (${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit)`}/>
                         <ToolButton icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9.78,18.65L12.55,15.88L15.32,18.65L16.27,17.7L13.5,14.93L16.27,12.16L15.32,11.21L12.55,13.97L9.78,11.21L8.83,12.16L11.6,14.93L8.83,17.7L9.78,18.65M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>} label="Vectorize" onClick={() => performEdit('Convert this image into a clean, simplified SVG format. Use flat colors and bold outlines. Ensure the output is valid SVG code.', 'Vectorizing...', true)} isActive={false} disabled={!isApiKeySet || !hasEnoughCreditsForEdit || isVector} title={!hasEnoughCreditsForEdit ? `Needs ${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit` : `Vectorize (${CREDIT_COSTS.POST_PROCESSING_EDIT} Credit)`}/>
                    </div>

                    {/* Tool Options Panel */}
                    <div className="w-64 flex-shrink-0 bg-gray-900/50 rounded-lg p-3 flex flex-col gap-3">
                       {activeTool === 'speech' ? (
                           <div className="flex flex-col gap-3 h-full overflow-y-auto">
                                <h4 className="text-sm font-bold text-gray-200">Add Speech Bubble</h4>
                                <p className="text-xs text-gray-400">Click and drag on the image to define the bubble area. You'll be prompted for text on release.</p>
                                <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => setBubbleStyle('standard')} className={`p-2 flex flex-col items-center rounded-md ${bubbleStyle === 'standard' ? 'bg-purple-600/50 ring-1 ring-purple-500' : 'bg-gray-700/50'}`}><svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M20,2H4A2,2 0 0,0 2,4V16A2,2 0 0,0 4,18H18L22,22V4A2,2 0 0,0 20,2Z" /></svg><span className="text-xs mt-1">Standard</span></button>
                                     <button onClick={() => setBubbleStyle('cloud')} className={`p-2 flex flex-col items-center rounded-md ${bubbleStyle === 'cloud' ? 'bg-purple-600/50 ring-1 ring-purple-500' : 'bg-gray-700/50'}`}><svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M19.5,13.5A2.5,2.5 0 0,1 22,16A2.5,2.5 0 0,1 19.5,18.5H13.5A2.5,2.5 0 0,1 11,16A2.5,2.5 0 0,1 13.5,13.5H19.5M19.5,9.5A4.5,4.5 0 0,1 24,14A4.5,4.5 0 0,1 19.5,18.5H13.5A4.5,4.5 0 0,1 9,14A4.5,4.5 0 0,1 13.5,9.5H19.5M10,7.5A2,2 0 0,1 12,9.5A2,2 0 0,1 10,11.5A2,2 0 0,1 8,9.5A2,2 0 0,1 10,7.5M6.5,11.5A1,1 0 0,1 7.5,12.5A1,1 0 0,1 6.5,13.5A1,1 0 0,1 5.5,12.5A1,1 0 0,1 6.5,11.5Z" /></svg><span className="text-xs mt-1">Thought</span></button>
                                     <button onClick={() => setBubbleStyle('spiky')} className={`p-2 flex flex-col items-center rounded-md ${bubbleStyle === 'spiky' ? 'bg-purple-600/50 ring-1 ring-purple-500' : 'bg-gray-700/50'}`}><svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12,2L1,12H9V22H15V12H23L12,2Z" /></svg><span className="text-xs mt-1">Shout</span></button>
                                     <button onClick={() => setBubbleStyle('retro')} className={`p-2 flex flex-col items-center rounded-md ${bubbleStyle === 'retro' ? 'bg-purple-600/50 ring-1 ring-purple-500' : 'bg-gray-700/50'}`}><svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13L12,22L11,18H4A2,2 0 0,1 2,16V4A2,2 0 0,1 4,2M5,5V7H19V5H5M5,9V11H19V9H5M5,13V15H19V13H5Z" /></svg><span className="text-xs mt-1">Retro</span></button>
                                </div>
                           </div>
                       ) : (
                           <div className="text-center text-xs text-gray-400 p-4">
                               <p className="font-semibold text-gray-300 mb-2">Select a tool to begin editing.</p>
                               <p>Each major edit costs {CREDIT_COSTS.POST_PROCESSING_EDIT} credit.</p>
                           </div>
                       )}
                    </div>

                    {/* Image Preview Area */}
                    <div className="flex-1 bg-gray-950 rounded-lg relative overflow-hidden flex flex-col min-h-0">
                         {isProcessing && (
                            <div className="absolute inset-0 z-20 bg-gray-950/50 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                                <AiCore isProcessing={true} />
                                <p className="mt-4 text-sm text-white font-semibold">{processingMessage}</p>
                            </div>
                        )}
                        {error && (
                             <div className="absolute inset-0 z-20 bg-red-900/20 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                                <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-md">
                                    <h3 className="text-lg font-bold text-red-200">Edit Failed</h3>
                                    <p className="text-xs text-red-200/80 mt-2">{error}</p>
                                    <button onClick={() => dispatch({ type: 'CLEAR_ERROR' })} className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                        <div
                            ref={imageContainerRef}
                            className={`flex-1 relative overflow-hidden ${activeTool === 'speech' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <div className="absolute w-full h-full flex items-center justify-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transition: isPanning ? 'none' : 'transform 0.1s ease-out' }}>
                                <img
                                    ref={imageRef}
                                    src={currentResult.dataUrl}
                                    alt={`Image being edited: ${currentResult.sourceExpression || 'Custom creation'}`}
                                    className="max-w-full max-h-full object-contain shadow-lg"
                                    onLoad={handleFitToScreen}
                                    style={{ pointerEvents: 'none' }}
                                />
                                {isDrawingBubble && drawingRect && (
                                     <div
                                        className="absolute border-2 border-dashed border-blue-400 bg-blue-500/20"
                                        style={{
                                            left: drawingRect.x,
                                            top: drawingRect.y,
                                            width: drawingRect.width,
                                            height: drawingRect.height,
                                            transformOrigin: 'top left'
                                        }}
                                     />
                                )}
                            </div>
                        </div>
                        {/* Zoom Controls */}
                        <div className="absolute top-2 right-2 z-10 bg-gray-900/50 rounded-lg p-1 flex flex-col gap-1">
                             <button onClick={handleZoomIn} title="Zoom In" className="p-1 text-gray-300 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                             <button onClick={handleZoomOut} title="Zoom Out" className="p-1 text-gray-300 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                             <button onClick={handleFitToScreen} title="Fit to Screen" className="p-1 text-gray-300 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0015.5 2h-11zM10 6a.75.75 0 01.75.75v1.5a.75.75 0 001.5 0v-1.5A2.25 2.25 0 0010 4.5h-1.5a.75.75 0 000 1.5H10zM6.5 10a.75.75 0 01.75-.75h1.5a.75.75 0 000-1.5h-1.5A2.25 2.25 0 004.5 10v1.5a.75.75 0 001.5 0V10zM10 13.5a.75.75 0 01-.75-.75v-1.5a.75.75 0 00-1.5 0v1.5A2.25 2.25 0 0010 15.5h1.5a.75.75 0 000-1.5H10zM13.5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 000 1.5h1.5A2.25 2.25 0 0015.5 10v-1.5a.75.75 0 00-1.5 0V10z" clipRule="evenodd" /></svg></button>
                        </div>
                        {/* Footer Actions */}
                        <div className="flex-shrink-0 flex justify-end items-center gap-3 p-3 bg-gray-900/50">
                            <button onClick={handleDownload} className="text-sm font-semibold text-gray-300 hover:text-white">Download</button>
                            <button onClick={handleSaveAndClose} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md">Save & Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};