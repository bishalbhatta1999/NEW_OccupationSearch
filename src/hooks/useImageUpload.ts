import { useState } from 'react';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface ImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  maxDimensions?: { width: number; height: number };
}

interface UploadResult {
  url: string;
  error: string | null;
}

const defaultOptions: ImageUploadOptions = {
  maxSizeMB: 2,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxDimensions: { width: 2048, height: 2048 }
};

export function useImageUpload(path: string, options: ImageUploadOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opts = { ...defaultOptions, ...options };

  const validateImage = async (file: File): Promise<boolean> => {
    // Check file type
    if (!opts.allowedTypes?.includes(file.type)) {
      setError(`Invalid file type. Please upload a JPG, PNG or GIF file.`);
      return false;
    }

    // Check file size
    if (file.size > (opts.maxSizeMB || 2) * 1024 * 1024) {
      setError(`File size must be less than 2MB`);
      return false;
    }

    // Check dimensions
    if (opts.maxDimensions) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.width > opts.maxDimensions!.width || img.height > opts.maxDimensions!.height) {
            setError(`Image dimensions must be less than ${opts.maxDimensions!.width}x${opts.maxDimensions!.height}`);
            resolve(false);
          }
          resolve(true);
        };
        img.src = URL.createObjectURL(file);
      });
    }

    return true;
  };

  const uploadImage = async (file: File): Promise<UploadResult> => {
    setLoading(true);
    setError(null);
    let downloadUrl = '';

    try {
      const isValid = await validateImage(file);
      if (!isValid) {
        return { url: '', error: error || 'Image validation failed' };
      }

      // Convert to data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }).catch(() => {
        throw new Error('Failed to read file');
      });

      // Upload to Firebase Storage
      const imageRef = ref(storage, `${path}/${Date.now()}`);
      console.log('Uploading to:', imageRef.fullPath);
      
      await uploadString(imageRef, dataUrl, 'data_url');
      downloadUrl = await getDownloadURL(imageRef);
      console.log('Download URL:', downloadUrl);

      return { url: downloadUrl, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMessage);
      return { url: '', error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (url: string): Promise<void> => {
    try {
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  return {
    uploadImage,
    deleteImage,
    loading,
    error
  };
}