export type SearchResultType = "series" | "chapter" | "profile" | "community";

export interface BaseSearchResult {
    id: string;
    title?: string;
    type: SearchResultType;
}

export interface SeriesResult extends BaseSearchResult {
    type: "series";
    title: string;
    description?: string | null;
    cover_url?: string | null;
    genre?: string | null;
    view_count?: number;
    is_completed?: boolean;
    is_explicit?: boolean;
    author_username?: string;
    chapter_count?: number;
}

export interface ChapterResult extends BaseSearchResult {
    type: "chapter";
    title: string;
    slug: string;
    summary?: string;
    chapter_number?: number;
    view_count?: number;
    series_title?: string;
    series_id?: string;
    series_slug?: string;
    series_cover?: string | null;
}

export interface ProfileResult extends BaseSearchResult {
    type: "profile";
    username: string;
    bio?: string | null;
    avatar_url?: string | null;
    series_count?: number;
}

export interface CommunityResult extends BaseSearchResult {
    type: "community";
    name: string;
    slug: string;
    description?: string | null;
    cover_color?: string;
    avatar_color?: string;
    is_private: boolean;
    created_at: string;
    member_count?: number;
    post_count?: number;
}

export type SearchResult =
    | SeriesResult
    | ChapterResult
    | ProfileResult
    | CommunityResult;
