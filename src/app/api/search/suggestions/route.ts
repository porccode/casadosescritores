import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim() || query.length < 2) {
        return NextResponse.json({
            series: [],
            profiles: [],
            communities: []
        });
    }

    try {
        const supabase = await createServerSupabaseClient();

        // 1. Chamar a RPC search_content para Séries e Escritores (já traz ordenado por relevância e aplica filtros)
        const { data: searchData, error: searchError } = await (supabase.rpc as any)("search_content", {
            search_query: query,
            content_type: "all",
            p_limit: 3,
            p_offset: 0
        });

        if (searchError) {
            console.error("[Suggestions API] RPC search_content error:", searchError);
        }

        // 2. Buscar Comunidades correspondentes
        const { data: comms, error: commsError } = await supabase
            .from("communities" as any)
            .select("*")
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(3);

        if (commsError) {
            console.error("[Suggestions API] Communities query error:", commsError);
        }

        return NextResponse.json({
            series: (searchData?.series || []).map((s: any) => ({
                id: s.id,
                title: s.title,
                slug: s.slug,
                cover_url: s.cover_url,
                genre: s.genre,
                author_username: s.author_username
            })),
            profiles: (searchData?.profiles || []).map((p: any) => ({
                id: p.id,
                username: p.username,
                bio: p.bio,
                avatar_url: p.avatar_url
            })),
            communities: (comms || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                cover_color: c.cover_color,
                avatar_color: c.avatar_color
            }))
        });
    } catch (error) {
        console.error("[Suggestions API] Unhandled Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
