/**
 * @file components/GroupPhotoSuccessDialog.tsx
 * @description A dialog that appears after a user successfully saves a group photo to their
 * character library. It provides a shortcut to navigate directly to the Wallpaper Studio.
 */

import React from 'react';
import { useAppContext } from '../../context/AppContext';

/**
 * @component GroupPhotoSuccessDialog
 * @description Renders a success message when a group photo is saved.
 */
export const GroupPhotoSuccessDialog: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { groupPhotoSuccessInfo } = state;

    if (!groupPhotoSuccessInfo) return null;

    /**
     * Navigates the user to the Wallpaper Studio and closes the dialog.
     */
    const handleGoToWallpapers = () => {
        dispatch({ type: 'SET_APP_MODE', payload: 'wallpapers' });
        dispatch({ type: 'HIDE_GROUP_PHOTO_SUCCESS' });
    };

    /**
     * Closes the dialog without changing the application mode.
     */
    const handleClose = () => {
        dispatch({ type: 'HIDE_GROUP_PHOTO_SUCCESS' });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in" onClick={handleClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white font-heading mt-4">Group Photo Saved!</h2>
                <p className="text-sm text-gray-300 my-4">
                    The photo '<span className="font-semibold text-purple-300">{groupPhotoSuccessInfo.characterName}</span>' has been saved to your Character Library. You can now select it in the Wallpaper Studio.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <button onClick={handleClose} className="text-sm font-semibold text-gray-300 hover:text-white py-2 px-4 rounded-md bg-gray-600 hover:bg-gray-700">
                        Stay Here
                    </button>
                    <button 
                        onClick={handleGoToWallpapers}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        Go to Wallpaper Studio
                    </button>
                </div>
            </div>
        </div>
    );
};