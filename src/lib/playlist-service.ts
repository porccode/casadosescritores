import { SupabaseClient } from "@supabase/supabase-js";

export const SAVED_CHAPTERS_PLAYLIST_NAME = "Capítulos Salvos";

export async function toggleContentSavedAPI(
    contentId: string,
    contentType: "story" | "series" | "chapter",
    accessToken: string
) {
    const response = await fetch("/api/playlists/items", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            playlistId: "saved_chapters", // O backend deve identificar se for o default
            contentId: contentId,
            contentType: contentType,
            action: "toggle"
        })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Erro ao salvar");
    return result;
}

export async function getOrCreateSavedChaptersPlaylist(
    supabase: SupabaseClient,
    userId: string
) {
    // Try to find the playlist
    const { data: existingPlaylist, error: findError } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", userId)
        .eq("name", SAVED_CHAPTERS_PLAYLIST_NAME)
        .maybeSingle();

    if (findError) {
        console.error("Error finding saved chapters playlist:", findError);
        throw findError;
    }

    if (existingPlaylist) {
        return existingPlaylist.id;
    }

    // Create it if it doesn't exist
    const { data: newPlaylist, error: createError } = await supabase
        .from("playlists")
        .insert({
            user_id: userId,
            name: SAVED_CHAPTERS_PLAYLIST_NAME,
            is_public: true,
        })
        .select("id")
        .single();

    if (createError) {
        console.error("Error creating saved chapters playlist:", createError);
        throw createError;
    }

    return newPlaylist.id;
}

export async function isContentSaved(
    supabase: SupabaseClient,
    userId: string,
    contentId: string
) {
    const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", userId)
        .eq("name", SAVED_CHAPTERS_PLAYLIST_NAME)
        .maybeSingle();

    if (playlistError || !playlist) return false;

    const columnName = "chapter_id";

    const { data, error } = await supabase
        .from("reading_list_items")
        .select("id")
        .eq("playlist_id", playlist.id)
        .eq(columnName, contentId)
        .maybeSingle();

    if (error) return false;
    return !!data;
}

export async function toggleContentSaved(
    supabase: SupabaseClient,
    userId: string,
    contentId: string
) {
    const playlistId = await getOrCreateSavedChaptersPlaylist(supabase, userId);
    const columnName = "chapter_id";

    // Check if already saved
    const { data: existing, error: checkError } = await supabase
        .from("reading_list_items")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq(columnName, contentId)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
        // Remove
        const { error: deleteError } = await supabase
            .from("reading_list_items")
            .delete()
            .eq("id", existing.id);

        if (deleteError) throw deleteError;
        return false; // Not saved anymore
    } else {
        // Add
        const { error: insertError } = await supabase
            .from("reading_list_items")
            .insert({
                user_id: userId,
                playlist_id: playlistId,
                [columnName]: contentId,
            });

        if (insertError) throw insertError;
        return true; // Now saved
    }
}

// ============================================
// ARCHIVED PLAYLIST
// ============================================

export const ARCHIVED_PLAYLIST_NAME = "Arquivados";

export async function getOrCreateArchivedPlaylist(
    supabase: SupabaseClient,
    userId: string
) {
    // Try to find the playlist
    const { data: existingPlaylist, error: findError } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", userId)
        .eq("name", ARCHIVED_PLAYLIST_NAME)
        .maybeSingle();

    if (findError) {
        console.error("Error finding archived playlist:", findError);
        throw findError;
    }

    if (existingPlaylist) {
        return existingPlaylist.id;
    }

    // Create it if it doesn't exist
    const { data: newPlaylist, error: createError } = await supabase
        .from("playlists")
        .insert({
            user_id: userId,
            name: ARCHIVED_PLAYLIST_NAME,
            is_public: false, // Archived content is private by default
        })
        .select("id")
        .single();

    if (createError) {
        console.error("Error creating archived playlist:", createError);
        throw createError;
    }

    return newPlaylist.id;
}

export async function isContentArchived(
    supabase: SupabaseClient,
    userId: string,
    contentId: string
) {
    const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", userId)
        .eq("name", ARCHIVED_PLAYLIST_NAME)
        .maybeSingle();

    if (playlistError || !playlist) return false;

    const columnName = "series_id";

    const { data, error } = await supabase
        .from("reading_list_items")
        .select("id")
        .eq("playlist_id", playlist.id)
        .eq(columnName, contentId)
        .maybeSingle();

    if (error) return false;
    return !!data;
}

export async function toggleContentArchived(
    supabase: SupabaseClient,
    userId: string,
    contentId: string
) {
    const playlistId = await getOrCreateArchivedPlaylist(supabase, userId);
    const columnName = "series_id";

    // Check if already archived
    const { data: existing, error: checkError } = await supabase
        .from("reading_list_items")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq(columnName, contentId)
        .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
        // Remove from archive
        const { error: deleteError } = await supabase
            .from("reading_list_items")
            .delete()
            .eq("id", existing.id);

        if (deleteError) throw deleteError;
        return false; // Not archived anymore
    } else {
        // Add to archive
        const { error: insertError } = await supabase
            .from("reading_list_items")
            .insert({
                user_id: userId,
                playlist_id: playlistId,
                [columnName]: contentId,
            });

        if (insertError) throw insertError;
        return true; // Now archived
    }
}
