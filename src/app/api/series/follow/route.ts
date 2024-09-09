import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

import { createNotification } from "@/services/notifications";

/**
 * Series Follow API.
 *
 * Handles following and unfollowing series for chapter notifications.
 * Reuses the same patterns from the user follow API (/api/follow).
 */

export async function POST(request: NextRequest) {
    try {
        const rateLimitResponse = await rateLimitMiddleware(request, 'follow_actions');
        if (rateLimitResponse) return rateLimitResponse;

        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const { seriesId, action } = await request.json();

        if (!seriesId || !['follow', 'unfollow'].includes(action)) {
            return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        }

        const supabase = createAdminSupabaseClient();

        if (action === 'follow') {
            const { data: existing } = await supabase
                .from("series_follows")
                .select("id")
                .eq("user_id", user.id)
                .eq("series_id", seriesId)
                .maybeSingle();

            if (existing) {
                return NextResponse.json({ success: true, alreadyFollowing: true });
            }

            const { error: followError } = await supabase
                .from("series_follows")
                .insert({ user_id: user.id, series_id: seriesId });

            if (followError) throw followError;

            // Disparar notificação para o autor da série
            try {
                const { data: seriesData } = await supabase
                    .from("series")
                    .select("title, author_id")
                    .eq("id", seriesId)
                    .single();

                if (seriesData && seriesData.author_id && seriesData.author_id !== user.id) {
                    const { data: actorProfile } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", user.id)
                        .single();

                    await createNotification({
                        target_user_id: seriesData.author_id,
                        actor_id: user.id,
                        type: 'series_follow',
                        related_id: seriesId,
                        additional_data: {
                            series_id: seriesId,
                            series_title: seriesData.title,
                            username: actorProfile?.username || "Usuário"
                        }
                    });
                }
            } catch (notifErr) {
                console.warn("[SeriesFollow] Erro ao enviar notificação (não crítico):", notifErr);
            }
        } else {
            const { error: unfollowError } = await supabase
                .from("series_follows")
                .delete()
                .eq("user_id", user.id)
                .eq("series_id", seriesId);

            if (unfollowError) throw unfollowError;
        }

        return NextResponse.json({ success: true, action });
    } catch (error: any) {
        console.error("Erro na API de Series Follow:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/** GET: Check follow status + count */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get("seriesId");

        if (!seriesId) {
            return NextResponse.json({ error: "seriesId obrigatório" }, { status: 400 });
        }

        const supabase = createAdminSupabaseClient();
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        // Count followers
        const { count } = await supabase
            .from("series_follows")
            .select("*", { count: "exact", head: true })
            .eq("series_id", seriesId);

        // Check if current user follows
        let isFollowing = false;
        if (user) {
            const { data: follow } = await supabase
                .from("series_follows")
                .select("id")
                .eq("user_id", user.id)
                .eq("series_id", seriesId)
                .maybeSingle();

            isFollowing = !!follow;
        }

        return NextResponse.json({ count: count || 0, isFollowing });
    } catch (error: any) {
        console.error("Erro ao buscar follow de série:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
