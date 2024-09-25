import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const SERIES_COVER_FIELDS = "title, cover_url, genre, is_explicit";

/**
 * GET /api/recent-content?limit=12&offset=0
 * Retorna conteúdo recente paginado, enriquecido com cover_url, genre e status +18.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const limit  = Math.min(parseInt(searchParams.get("limit")  || "12"), 30);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createServerSupabaseClient();

    const { data: items, error } = await (supabase.rpc as any)(
        "get_recent_content",
        { p_limit: limit, p_offset: offset }
    );

    if (error) {
        return NextResponse.json({ items: [], hasMore: false }, { status: 500 });
    }

    const list = (items as any[]) || [];
    if (list.length === 0) {
        return NextResponse.json({ items: [], hasMore: false });
    }

    // Buscar covers e is_explicit para as séries retornadas
    const seriesTitles = [...new Set(list.map((i: any) => i.series_title).filter(Boolean))] as string[];
    let coverMap: Record<string, { cover_url: string | null; genre: string | null; is_explicit: boolean }> = {};

    if (seriesTitles.length > 0) {
        const { data: seriesMeta } = await supabase
            .from("series_with_author" as any)
            .select(SERIES_COVER_FIELDS)
            .in("title", seriesTitles)
            .limit(30);
        if (seriesMeta) {
            for (const s of seriesMeta as any[]) {
                coverMap[s.title] = {
                    cover_url: s.cover_url,
                    genre: s.genre,
                    is_explicit: s.is_explicit || false,
                };
            }
        }
    }

    const enriched = list.map((item: any) => ({
        ...item,
        cover_url: item.series_title ? coverMap[item.series_title]?.cover_url ?? null : null,
        genre:     item.series_title ? coverMap[item.series_title]?.genre     ?? null : null,
        is_explicit: item.series_title ? (coverMap[item.series_title]?.is_explicit ?? false) : (item.is_explicit ?? false),
    }));

    return NextResponse.json({
        items: enriched,
        hasMore: list.length === limit,
    });
}
