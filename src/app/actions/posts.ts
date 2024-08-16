'use server';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createNotification } from "@/services/notifications";
import { revalidatePath } from "next/cache";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

export async function createPostAction(content: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized", xpBlocked: false };

    if (content.length > 240) {
        return { success: false, error: "O post deve ter no máximo 240 caracteres.", xpBlocked: false };
    }

    const { data: post, error } = await (supabase
        .from("posts" as any)
        .insert({
            author_id: user.id,
            content: content.trim(),
        } as any)
        .select(`*, author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name)`)
        .single() as any);

    if (error) return { success: false, error: error.message, xpBlocked: false };

    // ✅ Detectar menções e notificar
    const mentions = content.match(/@(\w+)/g);
    if (mentions && mentions.length > 0) {
        const uniqueMentionedUsernames = [...new Set(mentions.map(m => m.substring(1)))];
        const { data: mentionedUsers } = await supabase
            .from("profiles")
            .select("id, username")
            .in("username", uniqueMentionedUsernames) as any;

        if (mentionedUsers) {
            for (const mUser of mentionedUsers) {
                if (mUser.id !== user.id) {
                    await createNotification({
                        target_user_id: mUser.id,
                        actor_id: user.id,
                        type: 'post_mention',
                        related_id: post.id,
                        additional_data: {
                            post_content_preview: post.content.substring(0, 50)
                        }
                    });
                }
            }
        }
    }

    // ✅ Gamificação: Premiar XP por publicar post
    const { grantXP } = await import("@/services/xp");
    const xpResult = await grantXP(user.id, 'POST_PUBLISH', post.id);

    return { success: true, post, xpAwarded: xpResult.awarded, xpBlocked: !xpResult.awarded };
}

export async function togglePostLikeAction(postId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized", xpAwarded: false, xpBlocked: false };

    // Verificar se já curtiu
    const { data: existingLike } = await supabase
        .from("post_likes" as any)
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single() as any;

    if (existingLike) {
        // Remover like
        await supabase
            .from("post_likes" as any)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
    } else {
        // Adicionar like
        const { error } = await supabase
            .from("post_likes" as any)
            .insert({ post_id: postId, user_id: user.id } as any);

        if (!error) {
            // Notificar autor do post
            const { data: post } = await supabase
                .from("posts" as any)
                .select("author_id, content")
                .eq("id", postId)
                .single() as any;

            if (post && post.author_id !== user.id) {
                await createNotification({
                    target_user_id: post.author_id,
                    actor_id: user.id,
                    type: 'post_like',
                    related_id: postId,
                    additional_data: {
                        post_content_preview: post.content.substring(0, 50)
                    }
                });
            }
        }
    }
    revalidatePath(`/post/${postId}`);

    // ✅ Gamificação: Premiar XP por curtir post
    let xpAwarded = false;
    if (!existingLike) {
        const { grantXP } = await import("@/services/xp");
        const xpResult = await grantXP(user.id, 'POST_LIKE', postId);
        xpAwarded = xpResult.awarded;
    }

    return { success: true, isLiked: !existingLike, xpAwarded, xpBlocked: !xpAwarded && !existingLike };
}

export async function repostAction(postId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized", xpAwarded: false, xpBlocked: false };

    const { data: existingRepost } = await supabase
        .from("post_reposts" as any)
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .single() as any;

    if (existingRepost) {
        await supabase
            .from("post_reposts" as any)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
    } else {
        const { error } = await supabase
            .from("post_reposts" as any)
            .insert({ post_id: postId, user_id: user.id } as any);

        if (!error) {
            const { data: post } = await supabase
                .from("posts" as any)
                .select("author_id, content")
                .eq("id", postId)
                .single() as any;

            if (post && post.author_id !== user.id) {
                await createNotification({
                    target_user_id: post.author_id,
                    actor_id: user.id,
                    type: 'post_repost',
                    related_id: postId,
                    additional_data: {
                        post_content_preview: post.content.substring(0, 50)
                    }
                });
            }
        }
    }
    revalidatePath(`/post/${postId}`);

    // ✅ Gamificação: Premiar XP por repostar
    let xpAwarded = false;
    if (!existingRepost) {
        const { grantXP } = await import("@/services/xp");
        const xpResult = await grantXP(user.id, 'POST_REPOST', postId);
        xpAwarded = xpResult.awarded;
    }

    return { success: true, isReposted: !existingRepost, xpAwarded, xpBlocked: !xpAwarded && !existingRepost };
}

export async function togglePostPinAction(postId: string) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Verificar se o usuário é ADMIN
    const { data: profile } = await supabase
        .from("profiles")
        .select(ADMIN_ACCESS_PROFILE_SELECT)
        .eq("id", user.id)
        .single();

    if (!isAdminRole(profile)) {
        return { success: false, error: "Apenas administradores podem fixar posts." };
    }

    // Buscar o post atual para saber o estado de is_pinned
    const { data: post, error: fetchError } = await supabase
        .from("posts" as any)
        .select("is_pinned")
        .eq("id", postId)
        .single() as any;
        
    if (fetchError || !post) return { success: false, error: fetchError?.message || "Post não encontrado" };

    const newPinnedStatus = !post.is_pinned;

    // Atualizar no banco
    const { error: updateError } = await (supabase as any)
        .from("posts")
        .update({ is_pinned: newPinnedStatus })
        .eq("id", postId);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/');
    revalidatePath(`/post/${postId}`);
    return { success: true, isPinned: newPinnedStatus };
}
