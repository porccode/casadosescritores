import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { validateAndSanitizeForm } from "@/lib/sanitize";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// GET: List playlists (own or public for other users)
// POST: Create new playlist
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("user_id");

        const supabase = createAdminSupabaseClient();

        // Get current user
        const authHeader = request.headers.get("authorization");
        let currentUserId: string | null = null;

        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user } } = await supabase.auth.getUser(token);
            currentUserId = user?.id || null;
        }

        // If requesting another user's playlists, only show public ones
        if (userId && userId !== currentUserId) {
            const { data, error } = await supabase
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
                .eq("user_id", userId)
                .eq("is_public", true)
                .order("created_at", { ascending: false });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ playlists: data });
        }

        // If requesting own playlists, show all
        if (currentUserId) {
            const targetUserId = userId || currentUserId;
            const isOwn = targetUserId === currentUserId;

            let query = supabase
                .from("playlists")
                .select(`
                    id,
                    name,
                    description,
                    is_public,
                    cover_url,
                    created_at,
                    user_id
                `)
                .eq("user_id", targetUserId)
                .order("created_at", { ascending: false });

            if (!isOwn) {
                query = query.eq("is_public", true);
            }

            const { data, error } = await query;

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ playlists: data });
        }

        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } catch (error: any) {
        console.error("Error fetching playlists:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'playlists');
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        // ✅ SEGURANÇA: Validar e sanitizar
        const validation = validateAndSanitizeForm(body, {
            name: { type: 'text', required: true, minLength: 1, maxLength: 50 },
            description: { type: 'text', maxLength: 500 }
        });

        if (!validation.isValid) {
            return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
        }

        const { name, description } = validation.sanitizedData;
        const { is_public } = body;
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

        const { data, error } = await supabase
            .from("playlists")
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description?.trim() || null,
                is_public: is_public || false
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }


        return NextResponse.json({ playlist: data }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating playlist:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
