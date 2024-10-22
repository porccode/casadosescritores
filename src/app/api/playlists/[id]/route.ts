import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// GET: Get playlist details with items
// PUT: Update playlist
// DELETE: Delete playlist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabase = createAdminSupabaseClient();

        // Get current user
        const authHeader = request.headers.get("authorization");
        let currentUserId: string | null = null;

        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        // Fetch playlist
        const { data: playlist, error: playlistError } = await supabase
            .from("playlists")
            .select(`
                id,
                name,
                description,
                is_public,
                cover_url,
                created_at,
                user_id,
                profiles!inner(username, avatar_url)
            `)
            .eq("id", id)
            .single();

        if (playlistError || !playlist) {
            return NextResponse.json({ error: "Playlist não encontrada" }, { status: 404 });
        }

        // Check access
        const isOwner = currentUserId === playlist.user_id;
        if (!playlist.is_public && !isOwner) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Fetch items
        const { data: items, error: itemsError } = await supabase
            .from("reading_list_items")
            .select(`
                id,
                story_id,
                series_id,
                chapter_id,
                created_at,
                stories(id, title),
                series(id, title, cover_url),
                chapters(id, title, series:series_id(title))
            `)
            .eq("playlist_id", id)
            .order("created_at", { ascending: false });

        if (itemsError) {
            console.error("Error fetching playlist items:", itemsError);
        }

        return NextResponse.json({
            playlist,
            items: items || [],
            isOwner
        });
    } catch (error: any) {
        console.error("Error fetching playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, is_public } = body;

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

        // Check ownership
        const { data: playlist } = await supabase
            .from("playlists")
            .select("user_id")
            .eq("id", id)
            .single();

        if (!playlist || playlist.user_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Update
        const updateData: any = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (is_public !== undefined) updateData.is_public = is_public;

        const { data, error } = await supabase
            .from("playlists")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ playlist: data });
    } catch (error: any) {
        console.error("Error updating playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Check ownership
        const { data: playlist } = await supabase
            .from("playlists")
            .select("user_id")
            .eq("id", id)
            .single();

        if (!playlist || playlist.user_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // Delete (cascade will remove items)
        const { error } = await supabase
            .from("playlists")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
