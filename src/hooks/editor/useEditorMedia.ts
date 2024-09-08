"use client";

import { useState } from 'react';
import { compressImage, getMediaUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

/**
 * useEditorMedia.
 * 
 * Logic: Manages cover image state, previews, and upload orchestration.
 */

export function useEditorMedia() {
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState('');

    const uploadCover = async (userId: string): Promise<string | null> => {
        if (!coverFile) return coverPreview || null;

        try {
            // Compress for high-authority standards (1200px)
            const compressedFile = await compressImage(coverFile, 1200, 0.7);

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('userId', userId);

            const response = await apiClient.request<{ url: string }>('/api/upload', {
                method: 'POST',
                body: formData,
            });

            return response.url;
        } catch (err: any) {
            console.error('[useEditorMedia] Upload error:', err);
            throw new Error(err.message || 'Erro no upload da imagem');
        }
    };

    return {
        coverFile,
        setCoverFile,
        coverPreview,
        setCoverPreview,
        uploadCover,
        getMediaUrl
    };
}
