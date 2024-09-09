import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        const { seriesId, archive } = await request.json();

        if (!seriesId) {
            return NextResponse.json(
                { error: "ID da série é obrigatório" },
                { status: 400 }
            );
        }

        // Get current user from session
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        // Use factory centralizado para bypass RLS
        const supabase = createAdminSupabaseClient();

        // Check if user owns the series or is admin
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id, title, slug, genre, is_completed")
            .eq("id", seriesId)
            .single();

        if (seriesError || !series) {
            return NextResponse.json(
                { error: "Série não encontrada" },
                { status: 404 }
            );
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, is_admin")
            .eq("id", user.id)
            .single();

        const isAuthor = series.author_id === user.id;
        const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: "Sem permissão para arquivar esta série" },
                { status: 403 }
            );
        }

        // Buscar username do autor para revalidar seu perfil
        let authorUsername = "";
        if (series.author_id) {
            const { data: authorProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", series.author_id)
                .single();
            authorUsername = authorProfile?.username || "";
        }

        // 1. Sync with "Arquivados" playlist (Reading List)
        // This ensures the work appears in the profile's archived section
        try {
            const { getOrCreateArchivedPlaylist } = await import("@/lib/playlist-service");
            const playlistId = await getOrCreateArchivedPlaylist(supabase, series.author_id);

            if (archive) {
                // Add to playlist
                const { error: insertError } = await supabase
                    .from("reading_list_items")
                    .insert({
                        user_id: series.author_id,
                        playlist_id: playlistId,
                        series_id: seriesId,
                    });

                // Ignore unique constraint error if already there
                if (insertError && insertError.code !== "23505") {
                    console.error("Erro ao adicionar à playlist arquivados:", insertError);
                }
            } else {
                // Remove from playlist
                const { error: deleteError } = await supabase
                    .from("reading_list_items")
                    .delete()
                    .eq("playlist_id", playlistId)
                    .eq("series_id", seriesId);

                if (deleteError) {
                    console.error("Erro ao remover da playlist arquivados:", deleteError);
                }
            }
        } catch (playlistErr) {
            console.error("Erro ao gerenciar playlist de arquivamento:", playlistErr);
            // We continue anyway, the main update is the is_archived flag
        }

        // 2. Update the series
        const { error: updateError } = await supabase
            .from("series")
            .update({ is_archived: archive })
            .eq("id", seriesId);

        if (updateError) {
            console.error("Erro ao arquivar:", updateError);
            return NextResponse.json(
                { error: "Erro ao arquivar série" },
                { status: 500 }
            );
        }

        // 3. Deduct/Restore XP
        try {
            // Count published chapters of the series
            const { count: publishedChaptersCount } = await supabase
                .from("chapters")
                .select("id", { count: "exact", head: true })
                .eq("series_id", seriesId)
                .eq("is_draft", false);

            const publishedChapters = publishedChaptersCount || 0;
            // WORK_PUBLISH (+100) + CHAPTER_PUBLISH (+50 * chapter count) + WORK_FINISH (+200 if completed)
            const baseXP = 100 + (50 * publishedChapters) + (series.is_completed ? 200 : 0);
            const xpAmount = archive ? -baseXP : baseXP;

            const { error: xpError } = await (supabase.rpc as any)("grant_xp", {
                p_user_id: series.author_id,
                p_amount: xpAmount,
                p_role: "writer",
                p_action_type: archive ? "series_archive" : "series_unarchive",
                p_entity_id: seriesId
            });

            if (xpError) {
                console.error("Erro ao atualizar XP no arquivamento:", xpError);
            }
        } catch (xpErr) {
            console.error("Exceção ao calcular/conceder XP no arquivamento:", xpErr);
        }

        // Revalidar caminhos no Next.js para refletir o arquivamento/desarquivamento instantaneamente
        try {
            const { revalidatePath } = await import("next/cache");
            const { sanitizeSlug } = await import("@/lib/utils");

            revalidatePath("/");
            revalidatePath("/series");
            
            if (series.slug) {
                revalidatePath(`/series/${series.slug}`);
            }
            if (authorUsername) {
                revalidatePath(`/profile/${authorUsername}`);
            }
            if (series.genre) {
                const categorySlug = sanitizeSlug(series.genre);
                revalidatePath(`/explorar/${categorySlug}`);
            }
        } catch (revalError) {
            console.error("Erro ao revalidar caminhos após arquivamento da série:", revalError);
        }

        return NextResponse.json({
            success: true,
            is_archived: archive,
            message: archive ? "Série arquivada com sucesso" : "Série desarquivada com sucesso"
        });

    } catch (error: any) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}
