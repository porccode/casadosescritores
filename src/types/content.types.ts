/**
 * Tipos para o sistema de criação de conteúdo
 */

export type ContentType = "series" | "chapter";
export type ContentMode = "create" | "edit";

export interface BaseContentData {
  title: string;
  category?: string;
}

export interface SeriesData extends BaseContentData {
  description: string;
  coverUrl?: string;
  coverFile?: File | null;
}

export interface ChapterData extends BaseContentData {
  content: string;
  chapterNumber: number;
  seriesId: string;
  authorNote?: string;
}

export type ContentData = SeriesData | ChapterData;

export interface ContentSubmitResult {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    [key: string]: unknown;
  };
}

export interface NotificationData {
  type: "new_series" | "new_chapter";
  contentId: string;
  contentTitle: string;
  authorId: string;
  seriesId?: string;
  seriesTitle?: string;
}

export interface ContentEditorProps {
  type: ContentType;
  mode: ContentMode;
  existingId?: string;
  seriesId?: string;
  initialData?: Partial<ContentData>;
  onSuccess?: (result: ContentSubmitResult) => void;
  onError?: (error: Error) => void;
}

export interface UseContentEditorReturn {
  // State
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  description: string;
  setDescription: (description: string) => void;
  category: string;
  setCategory: (category: string) => void;
  genres: string[];
  setGenres: (genres: string[]) => void;
  coverFile: File | null;
  setCoverFile: (file: File | null) => void;
  coverPreview: string;
  setCoverPreview: (url: string) => void;
  chapterNumber: number;
  setChapterNumber: (num: number) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
  expiresAt: string;
  setExpiresAt: (expires: string) => void;
  isExplicit: boolean;
  setIsExplicit: (isExplicit: boolean) => void;
  commentsEnabled: boolean;
  setCommentsEnabled: (enabled: boolean) => void;
  isAIGenerated: string;
  setIsAIGenerated: (value: string) => void;
  aiCoverGenerated: string;
  setAiCoverGenerated: (value: string) => void;
  copyrightType: string;
  setCopyrightType: (type: string) => void;
  publishedAt: string;
  setPublishedAt: (published: string) => void;
  authorNote: string;
  setAuthorNote: (note: string) => void;
  relatedSeriesId: string | null;
  setRelatedSeriesId: (id: string | null) => void;
  relatedTitle: string;
  setRelatedTitle: (title: string) => void;
  relatedUrl: string;
  setRelatedUrl: (url: string) => void;
  relatedBannerUrl: string;
  setRelatedBannerUrl: (url: string) => void;

  // Draft & Scheduling
  isDraft: boolean;
  setIsDraft: (isDraft: boolean) => void;
  isSchedulingEnabled: boolean;
  setIsSchedulingEnabled: (enabled: boolean) => void;

  // Series Specific (Universal Editor)
  seriesTitle: string;
  setSeriesTitle: (title: string) => void;
  seriesDescription: string;
  setSeriesDescription: (desc: string) => void;
  seriesCategory: string;
  setSeriesCategory: (category: string) => void;

  // Loading states
  isLoading: boolean;
  setLoadingState: (loading: boolean) => void;
  isSaving: boolean;
  isPublishing: boolean;
  isFirstChapterCreation: boolean;
  setIsFirstChapterCreation: (value: boolean) => void;

  // Messages
  error: string | null;
  setError: (error: string | null) => void;
  success: string | null;
  setSuccess: (success: string | null) => void;

  // Actions
  handleSubmit: (overrideIsDraft?: boolean) => Promise<ContentSubmitResult>;
  handleDelete: () => Promise<void>;
  validateForm: () => boolean;
  resetForm: () => void;
  uploadCover: (userId: string) => Promise<string | null>;

  // Stats
  wordCount: number;
  charCount: number;
  readingTime: number;
  loadedSeriesId: string | null;
  loadedAuthorId: string | null;
  type: ContentType;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}
