/**
 * @file components/AnimationStyleGallery.tsx
 * @description A modal component that displays example GIFs for each animation style,
 * helping users preview the effect before generating an animated sticker.
 */

import React from 'react';
import { AnimationStyle, ANIMATION_STYLES } from '../../constants';

/**
 * @interface AnimationStyleGalleryProps
 * @description Defines the props for the AnimationStyleGallery component.
 */
interface AnimationStyleGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: AnimationStyle;
}

/**
 * @component AnimationStyleGallery
 * @description The main component for the animation style gallery modal.
 */
export const AnimationStyleGallery: React.FC<AnimationStyleGalleryProps> = ({ isOpen, onClose, currentStyle }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="animation-gallery-title"
        >
            <div
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
                    <h2 id="animation-gallery-title" className="text-xl font-bold text-white font-heading">Animation Style Examples</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {ANIMATION_STYLES.map(style => (
                            <div key={style.id} className={`rounded-lg p-2 text-center transition-all ${style.id === currentStyle ? 'bg-purple-600/50 ring-2 ring-purple-400' : 'bg-gray-900/50'}`}>
                                <img src={style.exampleUrl} alt={`Example of ${style.label}`} className="w-full rounded-md aspect-square object-cover" />
                                <p className="text-sm font-semibold text-gray-200 mt-2">{style.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};