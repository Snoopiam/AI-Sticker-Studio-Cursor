/**
 * @file components/FeedbackBin.tsx
 * @description A component that acts as the entry point to the user's collection. It displays
 * the number of saved items and opens the collection modal on click. It also serves as a
 * drop target for adding new items to the collection via drag-and-drop.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { GeneratedResult } from '../../types/types';
import { DRAG_AND_DROP_TYPE } from '../../constants';

export const FeedbackBin: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { feedbackBin } = state;
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleOpenCollection = () => {
        dispatch({ type: 'OPEN_COLLECTION_MODAL' });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const data = e.dataTransfer.getData(DRAG_AND_DROP_TYPE);
        if (data) {
            try {
                const result: GeneratedResult = JSON.parse(data);
                dispatch({ type: 'ADD_RESULTS_TO_COLLECTION', payload: [result] });
            } catch (error) {
                console.error("Failed to parse dropped data", error);
            }
        }
    };

    return (
        <div 
            className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${isDraggingOver ? 'scale-110' : 'scale-100'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <button
                onClick={handleOpenCollection}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-xl transition-colors ${isDraggingOver ? 'bg-purple-600 border-purple-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}
                title="Open My Collection"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918a4 4 0 01-1.343 1.262l-3.155 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M12.25 3.25a.75.75 0 00-1.06.04L6.939 7.54a2.5 2.5 0 00-.8 1.231l-1.022 2.556a.25.25 0 00.325.325l2.556-1.022a2.5 2.5 0 001.23-.8l4.25-4.25a.75.75 0 00-.04-1.06z" />
                </svg>
                <span className="font-bold text-white">My Collection</span>
                {feedbackBin.length > 0 && (
                    <span className="bg-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                        {feedbackBin.length}
                    </span>
                )}
            </button>
        </div>
    );
};