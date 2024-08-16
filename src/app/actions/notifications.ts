'use server';

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createNotification } from "@/services/notifications";
import { NotificationType } from "@/types/notifications";

export async function createNotificationAction({
    userId,
    targetId,
    type,
    content
}: {
    userId: string;
    targetId: string;
    type: string;
    content: string;
}) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    try {
        await createNotification({
            target_user_id: userId,
            actor_id: user.id, // The actor is the current user
            // @ts-ignore - Compatibility with legacy string type vs strict union
            type: type as NotificationType,
            related_id: targetId === userId ? undefined : targetId, // Best guess mapping
            additional_data: {
                message: content
            }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

interface NotifyFollowersParams {
    authorId: string;
    contentType: 'story' | 'series' | 'chapter';
    contentId: string;
    contentTitle: string;
    seriesId?: string;
    seriesTitle?: string;
}

export async function notifyFollowersAction(params: NotifyFollowersParams) {
    const adminSupabase = createAdminSupabaseClient();
    const { authorId, contentType, contentId, contentTitle, seriesId, seriesTitle } = params;

    try {
        // 1. Get Author Followers
        const { data: authorFollowers, error: followersError } = await adminSupabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', authorId);

        if (followersError) throw followersError;

        // 2. Get Series Followers (se for capítulo e tiver seriesId)
        let seriesFollowerIds: string[] = [];
        if (contentType === 'chapter' && seriesId) {
            const { data: seriesFollowers } = await adminSupabase
                .from('series_follows')
                .select('user_id')
                .eq('series_id', seriesId)
                .eq('notify_new_chapter', true);

            if (seriesFollowers) {
                seriesFollowerIds = seriesFollowers.map(f => f.user_id);
            }
        }

        // 3. Unir e deduplicar (sem incluir o próprio autor)
        const authorFollowerIds = (authorFollowers || []).map(f => f.follower_id);
        const allFollowerIds = [...new Set([...authorFollowerIds, ...seriesFollowerIds])]
            .filter(id => id !== authorId);

        if (allFollowerIds.length === 0) return { success: true, count: 0 };

        // 4. Get Author Username
        const { data: author } = await adminSupabase
            .from('profiles')
            .select('username')
            .eq('id', authorId)
            .single();

        // 5. Prepare Payloads
        const notificationType = contentType === 'chapter' ? 'new_chapter' : 'new_story';
        const additionalData: any = {
            username: author?.username
        };

        if (contentType === 'story') {
            additionalData.story_id = contentId;
            additionalData.story_title = contentTitle;
        } else if (contentType === 'series') {
            additionalData.series_id = contentId;
            additionalData.series_title = contentTitle;
            additionalData.story_title = `Série: ${contentTitle}`;
        } else if (contentType === 'chapter') {
            additionalData.chapter_id = contentId;
            additionalData.chapter_title = contentTitle;
            additionalData.series_id = seriesId;
            additionalData.series_title = seriesTitle;
        }

        const notifications = allFollowerIds.map(followerId => ({
            target_user_id: followerId,
            actor_id: authorId,
            type: notificationType,
            is_read: false,
            additional_data: additionalData,
            related_id: contentId
        }));

        // 6. Batch Insert
        const { error: insertError } = await adminSupabase
            .from('notifications')
            .insert(notifications);

        if (insertError) throw insertError;

        return { success: true, count: allFollowerIds.length };

    } catch (error: any) {
        console.error("[notifyFollowersAction] Error:", error);
        return { success: false, error: error.message };
    }
}
