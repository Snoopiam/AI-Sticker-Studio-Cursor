/**
 * @file components/TextInputModal.tsx
 * @description A generic, reusable modal component for capturing text input from the user.
 * It replaces the native `window.prompt()` to provide a consistent, themed UX.
 */

import React, { useState, useEffect } from 'react';
import { TextInputRequest } from '../../types/types';

/**
 * @interface TextInputModalProps
 * @description Defines the props for the TextInputModal component.
 */
interface TextInputModalProps {
    isOpen: boolean;
    request: TextInputRequest;
    onConfirm: (value: string) => void;
    onCancel: () => void;
}

/**
 * @component TextInputModal
 * @description The main component for the generic text input modal.
 */
export const TextInputModal: React.FC<TextInputModalProps> = ({ isOpen, request, onConfirm, onCancel }) => {
    const [value, setValue] = useState(request.initialValue || '');

    // Reset local state if the request changes while the modal is open
    useEffect(() => {
        setValue(request.initialValue || '');
    }, [request]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onCancel}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white font-heading">{request.title}</h2>
                <p className="text-sm text-gray-300 my-4">{request.message}</p>
                
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md text-sm text-white p-2 text-center focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                />

                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={onCancel} className="text-sm font-semibold text-gray-300 hover:text-white py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-700">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        {request.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};