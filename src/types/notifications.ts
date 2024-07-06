
export type NotificationType =
    | 'comment'
    | 'reply'
    | 'like'
    | 'follow'
    | 'new_chapter'
    | 'new_story'
    | 'series_comment'
    | 'series_like'
    | 'series_follow'
    | 'post_like'
    | 'post_reply'
    | 'post_repost'
    | 'mention'
    | 'post_mention'
    | 'suggestion'
    | 'playlist_add'
    | 'community_post_like'
    | 'community_post_comment'
    | 'community_comment'
    | 'community_invite'
    | 'community_request'
    | 'community_post_created'
    | 'message'
    | 'system';

export interface NotificationPayload {
    target_user_id: string;
    actor_id: string;
    type: NotificationType;
    content?: string;
    related_id?: string; // ID do objeto principal (SeriesID, PostID)
    additional_data?: {
        username?: string; // Username do ator (cache)
        series_title?: string;
        chapter_title?: string;
        post_content_preview?: string;
        comment_text_preview?: string;
        message?: string; // Para sugestões ou warnings
        [key: string]: any;
    };
}
