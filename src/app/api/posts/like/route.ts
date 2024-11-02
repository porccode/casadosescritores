import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createNotification } from "@/services/notifications";

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'likes');
        if (rateLimitResponse) return rateLimitResponse;

        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const body = await request.json();
        const { postId } = body;

        if (!postId) {
            return NextResponse.json({ error: "postId é obrigatório" }, { status: 400 });
        }

        // Verificar se já curtiu
        const { data: existingLike } = await (authSupabase
            .from("post_likes" as any)
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .single() as any);

        if (existingLike) {
            // Remover like
            await (authSupabase
                .from("post_likes" as any)
                .delete()
                .eq("post_id", postId)
                .eq("user_id", user.id) as any);
        } else {
            // Adicionar like
            const { error } = await (authSupabase
                .from("post_likes" as any)
                .insert({ post_id: postId, user_id: user.id } as any) as any);

            if (!error) {
                // Notificar autor do post
                const { data: post } = await (authSupabase
                    .from("posts" as any)
                    .select("author_id, content")
                    .eq("id", postId)
                    .single() as any);

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

        // ✅ Gamificação: Premiar XP por curtir post
        let xpAwarded = false;
        if (!existingLike) {
            const { grantXP } = await import("@/services/xp");
            const xpResult = await grantXP(user.id, 'POST_LIKE', postId);
            xpAwarded = xpResult.awarded;
        }

        return NextResponse.json({
            success: true,
            isLiked: !existingLike,
            xpAwarded
        });

    } catch (error) {
        console.error("Erro na API de post like:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
