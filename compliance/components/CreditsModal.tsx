/**
 * @file components/CreditsModal.tsx
 * @description A modal component that displays information about the application,
 * its technologies, and provides a way for users to add test credits.
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';

/**
 * @interface CreditsModalProps
 * @description Defines the props for the CreditsModal component.
 */
interface CreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * @component CreditSection
 * @description A reusable component for a titled section within the credits modal.
 */
const CreditSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-bold text-purple-300 font-heading mb-2">{title}</h3>
        <div className="space-y-2 text-sm text-gray-300">
            {children}
        </div>
    </div>
);

/**
 * @component CreditItem
 * @description A reusable component for displaying a single credit item with a name and description.
 */
const CreditItem: React.FC<{ name: string, description: string }> = ({ name, description }) => (
     <div className="p-3 bg-gray-900/50 rounded-md">
        <p className="font-semibold text-white">{name}</p>
        <p className="text-xs text-gray-400">{description}</p>
    </div>
);

/**
 * @component CreditsModal
 * @description The main modal component for displaying application credits and information.
 * @param {CreditsModalProps} props - Component props.
 */
export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose }) => {
    const { dispatch } = useAppContext();

    if (!isOpen) return null;

    /**
     * Handles the action of adding test credits to the user's account.
     * This is intended for development and testing purposes.
     */
    const handleAddCredits = () => {
        dispatch({ type: 'CHANGE_CREDITS_BY', payload: { amount: 1000, reason: 'Test credit grant' } });
        dispatch({ type: 'ADD_LOG_ENTRY', payload: { type: 'success', message: 'Added 1000 test credits.' } });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="credits-modal-title"
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
                    <h2 id="credits-modal-title" className="text-xl font-bold text-white font-heading">About AI Sticker Studio</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <p className="text-center text-gray-300">This application was designed to explore the creative potential of generative AI and provide a fun, powerful tool for personal expression.</p>
                    
                    <CreditSection title="Testing & Development">
                        <div className="p-3 bg-gray-900/50 rounded-md flex items-center justify-between">
                            <p className="text-sm">Need more credits for testing?</p>
                            <button onClick={handleAddCredits} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-1 px-3 rounded-md">
                                Add 1000 Credits
                            </button>
                        </div>
                    </CreditSection>

                    <CreditSection title="Core Technology">
                        <CreditItem name="Google Gemini API" description="Powered by the incredible generative capabilities of the Google Gemini API for all image and text generation." />
                        <CreditItem name="React & TypeScript" description="Built with modern web technologies including React for the user interface and TypeScript for robust, type-safe code." />
                    </CreditSection>

                    <CreditSection title="Key Libraries">
                         <CreditItem name="Tailwind CSS" description="For rapid, utility-first styling and a consistent design system." />
                         <CreditItem name="JSZip" description="For creating downloadable ZIP archives of your sticker collections." />
                         <CreditItem name="gif.js" description="For generating client-side animated GIF previews." />
                         <CreditItem name="heic2any" description="For converting modern HEIC/HEIF image formats into web-friendly PNGs." />
                    </CreditSection>
                    
                    <CreditSection title="Assets">
                        <CreditItem name="Google Fonts" description="Typography provided by Google Fonts, featuring 'Exo 2' for headings and 'Inter' for UI text." />
                        <CreditItem name="Heroicons" description="Icons sourced from the beautiful and comprehensive Heroicons library." />
                    </CreditSection>
                </div>
                 <div className="p-4 border-t border-gray-700/50 text-center">
                    <button onClick={onClose} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-md">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};