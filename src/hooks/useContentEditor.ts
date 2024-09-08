'use client';

import { useEditorState } from './editor/useEditorState';
import { useEditorStats } from './editor/useEditorStats';
import { useEditorMedia } from './editor/useEditorMedia';
import { useEditorPersistence } from './editor/useEditorPersistence';
import { useEffect } from 'react';
import { getMediaUrl } from '@/lib/utils';
import type {
  ContentType,
  ContentMode,
  ContentSubmitResult,
  UseContentEditorReturn,
} from '@/types/content.types';

/**
 * useContentEditor.
 * 
 * ARCHITECTURE:
 * - High-authority composer hook for the writing experience.
 * - Logic is decomposed into specialized internal slices for maintainability.
 * - Slices: State (Form), Stats (Text), Media (Covers), Persistence (API).
 */
export function useContentEditor(options: {
  type: ContentType;
  mode: ContentMode;
  existingId?: string;
  seriesId?: string;
  onSuccess?: (result: ContentSubmitResult) => void;
  onError?: (error: Error) => void;
}): UseContentEditorReturn {
  const { type, mode, existingId, seriesId, onSuccess, onError } = options;

  // 1. Core Form State & Validation
  const state = useEditorState({ type, mode, existingId, seriesId });

  // 2. Text Calculations
  const stats = useEditorStats(state.content);

  // 3. Media Orchestration
  const media = useEditorMedia();

  // 4. Persistence & Lifecycle
  const persistence = useEditorPersistence({
    state,
    media,
    type,
    mode,
    existingId
  });

  // 5. Sync Loaded Media
  useEffect(() => {
    if (state.coverUrl) {
      media.setCoverPreview(getMediaUrl(state.coverUrl));
    }
  }, [state.coverUrl]);

  return {
    // State Fields
    title: state.title,
    setTitle: state.setTitle,
    content: state.content,
    setContent: state.setContent,
    description: state.description,
    setDescription: state.setDescription,
    category: state.category,
    setCategory: state.setCategory,
    genres: state.genres,
    setGenres: state.setGenres,
    chapterNumber: state.chapterNumber,
    setChapterNumber: state.setChapterNumber,
    isPinned: state.isPinned,
    setIsPinned: state.setIsPinned,
    expiresAt: state.expiresAt,
    setExpiresAt: state.setExpiresAt,
    isExplicit: state.isExplicit,
    setIsExplicit: state.setIsExplicit,
    commentsEnabled: state.commentsEnabled,
    setCommentsEnabled: state.setCommentsEnabled,
    isAIGenerated: state.isAIGenerated,
    setIsAIGenerated: state.setIsAIGenerated,
    aiCoverGenerated: state.aiCoverGenerated,
    setAiCoverGenerated: state.setAiCoverGenerated,
    copyrightType: state.copyrightType,
    setCopyrightType: state.setCopyrightType,
    publishedAt: state.publishedAt,
    setPublishedAt: state.setPublishedAt,
    authorNote: state.authorNote,
    setAuthorNote: state.setAuthorNote,
    relatedSeriesId: state.relatedSeriesId,
    setRelatedSeriesId: state.setRelatedSeriesId,
    relatedTitle: state.relatedTitle,
    setRelatedTitle: state.setRelatedTitle,
    relatedUrl: state.relatedUrl,
    setRelatedUrl: state.setRelatedUrl,
    relatedBannerUrl: state.relatedBannerUrl,
    setRelatedBannerUrl: state.setRelatedBannerUrl,

    // Series Specific (Universal Editor)
    seriesTitle: state.seriesTitle,
    setSeriesTitle: state.setSeriesTitle,
    seriesDescription: state.seriesDescription,
    setSeriesDescription: state.setSeriesDescription,
    seriesCategory: state.seriesCategory,
    setSeriesCategory: state.setSeriesCategory,

    // Draft & Scheduling
    isDraft: state.isDraft,
    setIsDraft: state.setIsDraft,
    isSchedulingEnabled: state.isSchedulingEnabled,
    setIsSchedulingEnabled: state.setIsSchedulingEnabled,

    // Loading & Operation States
    isLoading: state.isLoading,
    setLoadingState: (val: boolean) => state.setIsLoading(val),
    isSaving: state.isSaving,
    isPublishing: state.isPublishing,
    isFirstChapterCreation: state.isFirstChapterCreation,
    setIsFirstChapterCreation: state.setIsFirstChapterCreation,

    // Messages & Feedback
    error: state.error,
    setError: state.setError,
    success: state.success,
    setSuccess: state.setSuccess,

    // Media Fields
    coverFile: media.coverFile,
    setCoverFile: media.setCoverFile,
    coverPreview: media.coverPreview,
    setCoverPreview: media.setCoverPreview,

    // Actions
    handleSubmit: persistence.handleSubmit,
    handleDelete: persistence.handleDelete,
    validateForm: state.validateForm,
    resetForm: state.resetForm,
    uploadCover: media.uploadCover,

    // Derived Metadata
    ...stats,
    loadedSeriesId: state.loadedSeriesId,
    loadedAuthorId: state.loadedAuthorId,
    type,
  } as UseContentEditorReturn;
}

export default useContentEditor;
