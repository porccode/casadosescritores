/**
 * Home Page Type Definitions.
 * These interfaces represent the data structures returned by RPC functions
 * and Supabase queries specifically for the root home page.
 */

export interface TopUser {
    id: string;
    username: string;
    level: number;
    xp: number;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
}

export interface RecentContentItem {
    id: string;
    title: string;
    slug: string;
    created_at: string;
    type: 'chapter' | 'post' | 'announcement';
    author_name: string;
    author_username: string;
    author_avatar_url: string | null;
    series_title?: string;
    author_is_admin?: boolean;
    chapter_number?: number;
    is_pinned?: boolean;
    cover_url?: string | null;
    genre?: string | null;
    comment_count?: number;
    is_explicit?: boolean;
}

export interface MostCommentedItem {
    id: string;
    title: string;
    slug: string;
    comment_count: number;
    type: 'chapter';
    author_name: string;
    author_username: string;
    created_at: string;
    chapter_number?: number;
    series_title?: string;
    cover_url?: string | null;
    genre?: string | null;
    is_explicit?: boolean;
}

export interface FeaturedSeriesItem {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
    genre: string | null;
    genres?: string[] | null;
    view_count: number;
    views?: number;
    is_completed: boolean;
    is_explicit?: boolean;
    author_id: string;
    author_name: string;
    author_username?: string;
    author_first_name?: string;
    author_last_name?: string;
    created_at: string;
    updated_at?: string;
    chapter_count?: number;
    is_archived?: boolean;
}

export interface ReadingItem {
    seriesId: string;
    seriesTitle: string;
    seriesSlug: string;
    coverUrl: string;
    genre: string;
    chapterCount: number;
    isCompleted: boolean;
    authorName: string;
    lastReadChapterNumber: number;
    nextChapterSlug: string;
    nextChapterNumber: number;
    isUpToDate: boolean;
}

export type SeriesWithAuthorRaw = {
    id: string;
    title: string;
    slug: string;
    cover_url: string | null;
    genre: string | null;
    view_count: number;
    is_completed: boolean;
    is_explicit?: boolean;
    author_id: string;
    author_username: string;
    author_first_name: string | null;
    author_last_name: string | null;
    created_at: string;
    chapter_count: number;
    is_archived?: boolean;
};
