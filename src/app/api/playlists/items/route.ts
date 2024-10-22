import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { SAVED_CHAPTERS_PLAYLIST_NAME, getOrCreateSavedChaptersPlaylist } from "@/lib/playlist-service";

import { createNotification } from "@/services/notifications";

/**
 * Playlist Items API.
 * 
 * Handles adding/removing items from playlists and awards XP.
 */

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'playlists');
        if (rateLimitResponse) return rateLimitResponse;

        const supabase = createAdminSupabaseClient();

        // Get current user
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabase.auth.getUser(token);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        let { playlistId, contentId, contentType, action } = body;

        if (!playlistId || !contentId || !contentType) {
            return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        }

        // Resolve special playlist IDs
        if (playlistId === "saved_chapters") {
            playlistId = await getOrCreateSavedChaptersPlaylist(supabase, user.id);
        }

        // Validate contentType
        const allowedTypes = ["story", "series", "chapter"];
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json({ error: "Tipo de conteúdo inválido" }, { status: 400 });
        }

        const columnName = contentType === "story" ? "story_id"
            : contentType === "series" ? "series_id"
                : "chapter_id";

        // Check ownership of playlist
        const { data: playlist, error: pError } = await supabase
            .from("playlists")
            .select("name, user_id, is_public")
            .eq("id", playlistId)
            .single();

        if (pError || !playlist) {
            return NextResponse.json({ error: "Playlist não encontrada" }, { status: 404 });
        }

        if (playlist.user_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Check if item already exists
        const { data: existing } = await supabase
            .from("reading_list_items")
            .select("id")
            .eq("playlist_id", playlistId)
            .eq(columnName, contentId)
            .maybeSingle();

        if (action === "remove" || (action === "toggle" && existing)) {
            if (!existing) return NextResponse.json({ success: true, removed: false });

            const { error: dError } = await supabase
                .from("reading_list_items")
                .delete()
                .eq("id", existing.id);

            if (dError) throw dError;

            return NextResponse.json({ success: true, removed: true });
        } else {
            // Add item
            if (existing) return NextResponse.json({ success: true, added: false });

            const { error: iError } = await supabase
                .from("reading_list_items")
                .insert({
                    user_id: user.id,
                    playlist_id: playlistId,
                    [columnName]: contentId
                } as any);

            if (iError) throw iError;

            // Disparar notificação para o autor da obra (se não for o próprio usuário)
            try {
                let contentAuthorId: string | null = null;
                let contentTitle = "";
                let targetSeriesId: string | null = null;

                if (contentType === "series") {
                    const { data: seriesData } = await supabase
                        .from("series")
                        .select("title, author_id")
                        .eq("id", contentId)
                        .single();
                    if (seriesData) {
                        contentAuthorId = seriesData.author_id;
                        contentTitle = seriesData.title;
                        targetSeriesId = contentId;
                    }
                } else if (contentType === "story") {
                    const { data: storyData } = await supabase
                        .from("stories")
                        .select("title, author_id")
                        .eq("id", contentId)
                        .single();
                    if (storyData) {
                        contentAuthorId = storyData.author_id;
                        contentTitle = storyData.title;
                    }
                } else if (contentType === "chapter") {
                    const { data: chapterData } = await supabase
                        .from("chapters")
                        .select("title, author_id, series_id")
                        .eq("id", contentId)
                        .single();
                    if (chapterData) {
                        contentAuthorId = chapterData.author_id;
                        contentTitle = chapterData.title;
                        targetSeriesId = chapterData.series_id;
                        if (chapterData.series_id) {
                            const { data: sData } = await supabase
                                .from("series")
                                .select("title")
                                .eq("id", chapterData.series_id)
                                .single();
                            if (sData) contentTitle = sData.title;
                        }
                    }
                }

                if (contentAuthorId && contentAuthorId !== user.id) {
                    const { data: actorProfile } = await supabase
                        .from("profiles")
                        .select("username")
                        .eq("id", user.id)
                        .single();

                    await createNotification({
                        target_user_id: contentAuthorId,
                        actor_id: user.id,
                        type: 'playlist_add',
                        related_id: playlistId,
                        additional_data: {
                            series_id: targetSeriesId || undefined,
                            series_title: contentTitle,
                            playlist_name: playlist.name,
                            playlist_id: playlistId,
                            playlist_is_private: !playlist.is_public,
                            username: actorProfile?.username || "Usuário"
                        }
                    });
                }
            } catch (notifErr) {
                console.warn("[Playlists] Erro ao enviar notificação de playlist (não crítico):", notifErr);
            }

            return NextResponse.json({
                success: true,
                added: true,
                xpAwarded: false,
                xpAmount: 0
            });
        }

    } catch (error: any) {
        console.error("Error in playlist items API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
