/**
 * @file utils/imageCompression.ts
 * @description Utility functions for compressing images to reduce memory footprint
 * and improve IndexedDB performance.
 */

/**
 * Compresses a base64 image by resizing and adjusting quality.
 * @param {string} dataUrl - The source image as a base64 data URL
 * @param {number} maxWidth - Maximum width in pixels (default 1024)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<string>} Compressed image as base64 data URL
 */
export const compressImage = async (
    dataUrl: string,
    maxWidth: number = 1024,
    quality: number = 0.8
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            
            // Resize if needed
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG for compression (unless PNG transparency is needed)
            const mimeType = dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(mimeType, quality);
            
            resolve(compressed);
        };
        
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
    });
};