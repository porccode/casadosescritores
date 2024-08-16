"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { sanitizeSlug } from "@/lib/utils";
import { getOrCreateArchivedPlaylist } from "@/lib/playlist-service";

export async function archiveSeries(seriesId: string, archive: boolean) {
    if (!seriesId) return { error: "ID da série é obrigatório" };

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) return { error: "Não autenticado" };

    const supabase = createAdminSupabaseClient();

    const { data: series, error: seriesError } = await supabase
        .from("series")
        .select("author_id, title, slug, genre, is_completed")
        .eq("id", seriesId)
        .single();

    if (seriesError || !series) return { error: "Série não encontrada" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .single();

    const isAuthor = series.author_id === user.id;
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

    if (!isAuthor && !isAdmin) return { error: "Sem permissão para arquivar esta série" };

    let authorUsername = "";
    if (series.author_id) {
        const { data: authorProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", series.author_id)
            .single();
        authorUsername = authorProfile?.username || "";
    }

    try {
        const playlistId = await getOrCreateArchivedPlaylist(supabase, series.author_id);
        if (archive) {
            await supabase.from("reading_list_items").insert({
                user_id: series.author_id,
                playlist_id: playlistId,
                series_id: seriesId,
            });
        } else {
            await supabase.from("reading_list_items").delete()
                .eq("playlist_id", playlistId)
                .eq("series_id", seriesId);
        }
    } catch (err) {
        console.error("Erro ao gerenciar playlist de arquivamento:", err);
    }

    const { error: updateError } = await supabase
        .from("series")
        .update({ is_archived: archive })
        .eq("id", seriesId);

    if (updateError) return { error: "Erro ao arquivar série" };

    try {
        const { count: publishedChaptersCount } = await supabase
            .from("chapters")
            .select("id", { count: "exact", head: true })
            .eq("series_id", seriesId)
            .eq("is_draft", false);

        const publishedChapters = publishedChaptersCount || 0;
        const baseXP = 100 + (50 * publishedChapters) + (series.is_completed ? 200 : 0);
        const xpAmount = archive ? -baseXP : baseXP;

        await (supabase.rpc as any)("grant_xp", {
            p_user_id: series.author_id,
            p_amount: xpAmount,
            p_role: "writer",
            p_action_type: archive ? "series_archive" : "series_unarchive",
            p_entity_id: seriesId
        });
    } catch (xpErr) {
        console.error("Exceção ao calcular XP no arquivamento:", xpErr);
    }

    revalidatePath("/");
    revalidatePath("/series");
    if (series.slug) revalidatePath(`/series/${series.slug}`);
    if (authorUsername) revalidatePath(`/profile/${authorUsername}`);
    if (series.genre) revalidatePath(`/explorar/${sanitizeSlug(series.genre)}`);

    return { success: true, is_archived: archive };
}

export async function deleteSeries(seriesId: string) {
    if (!seriesId) return { error: "ID da série é obrigatório" };

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(seriesId)) return { error: "Formato de ID inválido" };

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) return { error: "Não autenticado" };

    const supabase = createAdminSupabaseClient();

    const { data: series, error: seriesError } = await supabase
        .from("series")
        .select("author_id, title, slug, genre")
        .eq("id", seriesId)
        .single();

    if (seriesError || !series) return { error: "Série não encontrada" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, role")
        .eq("id", user.id)
        .single();

    const isAuthor = series.author_id === user.id;
    const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

    if (!isAuthor && !isAdmin) return { error: "Apenas o autor ou administradores podem excluir esta série" };

    let authorUsername = "";
    if (series.author_id) {
        const { data: authorProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", series.author_id)
            .single();
        authorUsername = authorProfile?.username || "";
    }

    await supabase.from("chapters").delete().eq("series_id", seriesId);
    await supabase.from("comments").delete().eq("series_id", seriesId);

    const { error: deleteError } = await supabase
        .from("series")
        .delete()
        .eq("id", seriesId);

    if (deleteError) return { error: "Erro ao excluir série" };

    revalidatePath("/");
    revalidatePath("/series");
    if (series.slug) revalidatePath(`/series/${series.slug}`);
    if (authorUsername) revalidatePath(`/profile/${authorUsername}`);
    if (series.genre) revalidatePath(`/explorar/${sanitizeSlug(series.genre)}`);

    return { success: true, message: `Série excluída com sucesso` };
}
