/**
 * @file utils/imageUtils.ts
 * @description Utility functions for image processing, such as detecting transparency.
 */

/**
 * Checks if a base64 image has significant transparency by checking pixels.
 * This is useful for detecting if an uploaded image is a sticker with a transparent background.
 * @param {string} dataUrl - The base64 data URL of the image.
 * @returns {Promise<boolean>} A promise that resolves to true if the image has transparency.
 */
export const hasTransparency = (dataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Use a smaller canvas for performance; we only need to sample pixels.
            const checkSize = Math.min(100, img.width, img.height);
            canvas.width = checkSize;
            canvas.height = checkSize;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(false);
                return;
            }
            ctx.drawImage(img, 0, 0, checkSize, checkSize);

            // Check pixels at corners for transparency
            const checkPoints = [
                { x: 0, y: 0 },
                { x: checkSize - 1, y: 0 },
                { x: 0, y: checkSize - 1 },
                { x: checkSize - 1, y: checkSize - 1 },
                { x: Math.floor(checkSize / 4), y: Math.floor(checkSize / 4) },
            ];

            for (const point of checkPoints) {
                try {
                    const pixelData = ctx.getImageData(point.x, point.y, 1, 1).data;
                    // Alpha channel is the 4th value (index 3). 255 is fully opaque.
                    if (pixelData[3] < 255) {
                        resolve(true); // Found a non-opaque pixel
                        return;
                    }
                } catch (e) {
                    console.error("Could not get pixel data to check transparency", e);
                    resolve(false); // Assume no transparency on error
                    return;
                }
            }
            // If we checked all points and found no transparency
            resolve(false);
        };
        img.onerror = () => {
            // If the image fails to load, it can't have transparency
            resolve(false);
        };
        img.src = dataUrl;
    });
};