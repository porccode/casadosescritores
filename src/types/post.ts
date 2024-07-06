export interface PostAuthor {
    id: string;
    username: string;
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    is_admin?: boolean;
}

export interface Post {
    id: string;
    content: string;
    created_at: string;
    like_count: number;
    reply_count: number;
    repost_count: number;
    author: PostAuthor;
    isLiked?: boolean;
    isReposted?: boolean;
    is_pinned?: boolean | null;
    parent_id?: string | null;
    parent_author_username?: string | null;
}
