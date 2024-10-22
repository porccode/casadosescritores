import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createNotification } from "@/services/notifications";

// POST: Add item to playlist
// DELETE: Remove item from playlist
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: playlistId } = await params;
        const body = await request.json();
        const { story_id, series_id, chapter_id } = body;

        if (!story_id && !series_id && !chapter_id) {
            return NextResponse.json({ error: "Nenhum conteúdo especificado" }, { status: 400 });
        }

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

        // Check playlist ownership + get metadata for notification
        const { data: playlist } = await supabase
            .from("playlists")
            .select("user_id, name, is_public")
            .eq("id", playlistId)
            .single();

        if (!playlist || playlist.user_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Insert item
        const { data, error } = await supabase
            .from("reading_list_items")
            .insert({
                user_id: user.id,
                playlist_id: playlistId,
                story_id: story_id || null,
                series_id: series_id || null,
                chapter_id: chapter_id || null
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // ─── Notificar o autor do conteúdo adicionado ─────────────────────────────
        try {
            let contentAuthorId: string | null = null;
            let additionalData: Record<string, any> = {
                playlist_id: playlistId,
                playlist_name: playlist.name,
                playlist_is_private: !playlist.is_public,
            };

            if (series_id) {
                const { data: series } = await supabase
                    .from("series")
                    .select("author_id, title")
                    .eq("id", series_id)
                    .single();
                if (series) {
                    contentAuthorId = series.author_id;
                    additionalData.series_id = series_id;
                    additionalData.series_title = series.title;
                }
            } else if (story_id) {
                const { data: story } = await supabase
                    .from("stories")
                    .select("author_id, title")
                    .eq("id", story_id)
                    .single();
                if (story) {
                    contentAuthorId = story.author_id;
                    additionalData.story_id = story_id;
                    additionalData.story_title = story.title;
                }
            } else if (chapter_id) {
                const { data: chapter } = await supabase
                    .from("chapters")
                    .select("author_id, title")
                    .eq("id", chapter_id)
                    .single();
                if (chapter) {
                    contentAuthorId = chapter.author_id;
                    additionalData.chapter_id = chapter_id;
                    additionalData.chapter_title = chapter.title;
                }
            }

            // Só notifica se o autor for diferente de quem adicionou à playlist
            if (contentAuthorId && contentAuthorId !== user.id) {
                await createNotification({
                    target_user_id: contentAuthorId,
                    actor_id: user.id,
                    type: "playlist_add",
                    related_id: playlistId,
                    additional_data: additionalData,
                });
            }
        } catch (notifError) {
            // Não falhar a request por erro de notificação
            console.error("[playlist_add] Erro ao enviar notificação:", notifError);
        }
        // ─────────────────────────────────────────────────────────────────────────

        return NextResponse.json({ item: data }, { status: 201 });
    } catch (error: any) {
        console.error("Error adding item to playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: playlistId } = await params;
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("item_id");

        if (!itemId) {
            return NextResponse.json({ error: "item_id é obrigatório" }, { status: 400 });
        }

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

        // Check playlist ownership
        const { data: playlist } = await supabase
            .from("playlists")
            .select("user_id")
            .eq("id", playlistId)
            .single();

        if (!playlist || playlist.user_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Delete item
        const { error } = await supabase
            .from("reading_list_items")
            .delete()
            .eq("id", itemId)
            .eq("playlist_id", playlistId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error removing item from playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
