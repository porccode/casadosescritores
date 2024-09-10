/**
 * Tipos para o Sistema de Visualização de Conteúdo
 */

// Autor/Perfil
export interface Author {
  id: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

// Capítulo para navegação
export interface ChapterNavigation {
  id: string;
  title: string;
  chapter_number: number;
  slug?: string;
}

// Item relacionado (história ou capítulo)
export interface RelatedItem {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  summary?: string;
  cover_url?: string | null;
  created_at?: string;
  view_count?: number;
  chapter_number?: number;
  profiles?: {
    username: string;
    avatar_url?: string | null;
  };
}

// Tipo de conteúdo
export type ContentType = 'story' | 'chapter' | 'announcement';

// Props do ContentViewer principal
export interface ContentViewerProps {
  // Dados comuns
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: Author | null;
  viewCount?: number;
  likeCount?: number;
  relatedItems?: RelatedItem[];
  userId?: string;
  contentType?: ContentType;
  tags?: string[];

  // Para stories
  subtitle?: string;
  category?: string;
  series?: any; // Adicionado para compatibilidade

  // Para chapters
  chapterNumber?: number;
  seriesId?: string;
  seriesTitle?: string;
  seriesSlug?: string;
  prevChapter?: ChapterNavigation | null;
  nextChapter?: ChapterNavigation | null;
  chapters?: any[]; // Adicionado para compatibilidade
  currentChapterIndex?: number; // Adicionado para compatibilidade
  authorNote?: string;
  commentsEnabled?: boolean;
}

// Props do ContentHeader
export interface ContentHeaderProps {
  title: string;
  subtitle?: string;
  author: Author | null;
  seriesId?: string;
  publishDate: string;
  contentType: ContentType;
  category?: string;
  viewCount?: number;
  readingTime?: number;
  content?: string;
  seriesTitle?: string;
  chapterNumber?: number;
  tags?: string[];
  isBookmarked?: boolean;
  onBookmark?: (bookmarked: boolean) => void;
}

// Props do ContentFooter
export interface ContentFooterProps {
  id: string;
  author: Author | null;
  contentType: ContentType;
  commentCount?: number;
  likeCount?: number;
  onLike?: () => void;
  isLiked?: boolean;
  contentUrl?: string;
  isAuthor?: boolean;
  isAdmin?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (bookmarked: boolean) => void;
  error?: string | null;
  announcementId?: string;
}

// Props do ContentNavigation
export interface ContentNavigationProps {
  prevChapter?: ChapterNavigation | null;
  nextChapter?: ChapterNavigation | null;
  seriesId?: string;
  seriesTitle?: string;
  currentChapterNumber?: number;
  isCompact?: boolean;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
}

// Props do RelatedContent
export interface RelatedContentProps {
  items: RelatedItem[];
  type?: ContentType;
}
