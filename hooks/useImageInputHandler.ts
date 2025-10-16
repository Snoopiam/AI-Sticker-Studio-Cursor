/**
 * @file hooks/useImageInputHandler.ts
 * @description A reusable custom hook to encapsulate all logic for handling image uploads,
 * including file input, drag-and-drop, paste, HEIC/HEIF conversion, and validation.
 */

import { useState, useRef, useCallback, ChangeEvent, DragEvent, ClipboardEvent, RefObject } from 'react';

/**
 * @interface UseImageInputHandlerOptions
 * @description Defines the options for the useImageInputHandler hook.
 */
interface UseImageInputHandlerOptions {
  /** Callback function executed with the base64 data URL of the successfully loaded and processed image. */
  onImageLoaded: (base64: string) => void;
  /** Optional callback for handling errors during file processing. */
  onError?: (error: Error) => void;
  /** Optional array of accepted image MIME types. Defaults to common web formats. */
  acceptedFormats?: string[];
}

/**
 * @interface UseImageInputHandlerReturn
 * @description Defines the return value of the useImageInputHandler hook.
 */
interface UseImageInputHandlerReturn {
  /** Memoized handler for file input change events. */
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Memoized handler for drop events. */
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  /** Memoized handler for dragover events to provide UI feedback. */
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  /** Memoized handler for dragleave events to reset UI feedback. */
  handleDragLeave: () => void;
  /** Memoized handler for paste events. */
  handlePaste: (e: ClipboardEvent) => void;
  /** Memoized handler to programmatically trigger the file input. */
  handleClick: () => void;
  /** Boolean flag indicating if a file is being dragged over the drop zone. */
  isDragging: boolean;
  /** Boolean flag indicating if a file is currently being processed (e.g., read or converted). */
  isProcessing: boolean;
  /** A ref object to be attached to the hidden file input element. */
  fileInputRef: RefObject<HTMLInputElement>;
}

const defaultAcceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

/**
 * @hook useImageInputHandler
 * @description A comprehensive hook for managing all user image input methods.
 * @param {UseImageInputHandlerOptions} options - Configuration options for the hook.
 * @returns {UseImageInputHandlerReturn} An object containing state and memoized event handlers.
 */
export const useImageInputHandler = (options: UseImageInputHandlerOptions): UseImageInputHandlerReturn => {
    const { onImageLoaded, onError, acceptedFormats = defaultAcceptedFormats } = options;
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * The core logic for processing a File object. It handles validation, HEIC/HEIF conversion,
     * and reading the file as a base64 data URL before calling the onImageLoaded callback.
     */
    const processFile = useCallback(async (file: File | null) => {
        if (!file) return;

        if (!acceptedFormats.includes(file.type) && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
            const err = new Error(`Invalid file type. Please upload one of: ${acceptedFormats.join(', ')}`);
            onError ? onError(err) : alert(err.message);
            return;
        }

        setIsProcessing(true);

        try {
            const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
            
            let blobToRead: Blob = file;

            if (isHeic) {
                if (!(window as any).heic2any) {
                    throw new Error('HEIC converter script is not available.');
                }
                const convertedBlob = await (window as any).heic2any({ blob: file, toType: "image/png" });
                blobToRead = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    onImageLoaded(event.target.result as string);
                } else {
                    throw new Error("Failed to read the processed file.");
                }
                setIsProcessing(false);
            };
            reader.onerror = () => {
                throw new Error("Error reading file.");
            };
            reader.readAsDataURL(blobToRead);

        } catch (error: any) {
            onError ? onError(error) : alert(error.message);
            setIsProcessing(false);
        }

    }, [onImageLoaded, onError, acceptedFormats]);


    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        processFile(e.target.files?.[0] || null);
    }, [processFile]);

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files?.[0] || null);
    }, [processFile]);
    
    const handlePaste = useCallback((e: ClipboardEvent) => {
        for (const item of Array.from(e.clipboardData.items)) {
            if (item.type.startsWith('image')) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    processFile(file);
                    return; // Process only the first image found
                }
            }
        }
    }, [processFile]);

    return {
        handleFileChange,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        handlePaste,
        handleClick,
        isDragging,
        isProcessing,
        fileInputRef,
    };
};