/**
 * @file components/ConfirmationDialog.tsx
 * @description A modal component that asks the user to confirm an action, especially one that costs credits.
 * It displays the cost of the action and the user's remaining credit balance.
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';

/**
 * @interface ConfirmationDialogProps
 * @description Defines the props for the ConfirmationDialog component.
 */
interface ConfirmationDialogProps {
    /** Callback function to execute when the user confirms the action. */
    onConfirm: () => void;
    /** Callback function to execute when the user cancels the action. */
    onCancel: () => void;
}

/**
 * @component ConfirmationDialog
 * @description Renders a confirmation modal. It retrieves the details for the confirmation
 * (title, message, cost) from the global application state.
 * @param {ConfirmationDialogProps} props - The component props for handling confirmation and cancellation.
 */
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ onConfirm, onCancel }) => {
    const { state } = useAppContext();
    const { confirmationRequest, credits } = state;

    if (!confirmationRequest) return null;

    const { title, message, cost } = confirmationRequest;
    const remainingCredits = credits - cost;
    const hasCost = cost > 0;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={onCancel}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white font-heading">{title}</h2>
                <p className="text-sm text-gray-300 my-4">{message}</p>
                
                {hasCost && (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Current Credits:</span>
                            <span className="font-semibold text-white">{credits}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Action Cost:</span>
                            <span className="font-semibold text-red-400">-{cost}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-600 pt-2">
                            <span className="text-gray-400">Remaining Credits:</span>
                            <span className={`font-semibold ${remainingCredits < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {remainingCredits}
                            </span>
                        </div>
                    </div>
                )}

                {hasCost && remainingCredits < 0 && (
                    <p className="text-xs text-red-400 bg-red-900/50 p-2 rounded-md mt-4">You do not have enough credits to perform this action.</p>
                )}

                <div className="flex justify-center gap-4 mt-6">
                    <button onClick={onCancel} className="text-sm font-semibold text-gray-300 hover:text-white py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-700">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={hasCost && remainingCredits < 0}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
                    >
                        {hasCost ? `Proceed (${cost} credits)` : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};