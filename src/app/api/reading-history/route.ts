import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

/**
 * GET /api/reading-history
 * Retorna as últimas séries lidas pelo usuário logado.
 * Usa xp_history (action_type = 'read_chapter') + join com chapters e series.
 * Retorna: até 6 séries distintas, com a capa, próximo capítulo a ler, e progresso.
 */
export async function GET() {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Buscar os últimos chapter_ids únicos lidos no xp_history
    const { data: xpRows, error: xpError } = await supabase
        .from("xp_history")
        .select("entity_id, created_at")
        .eq("user_id", user.id)
        .eq("action_type", "read_chapter")
        .order("created_at", { ascending: false })
        .limit(50); // pegar bastante para garantir diversidade de séries

    if (xpError || !xpRows || xpRows.length === 0) {
        return NextResponse.json({ items: [] });
    }

    // Extrair chapter_ids únicos (manter ordem cronológica reversa)
    const seenChapterIds = new Set<string>();
    const uniqueChapterIds: string[] = [];
    for (const row of ((xpRows as any[]) || [])) {
        if (row.entity_id && !seenChapterIds.has(row.entity_id)) {
            seenChapterIds.add(row.entity_id);
            uniqueChapterIds.push(row.entity_id);
        }
    }

    // Buscar informações dos capítulos incluindo series_id
    const { data: chaptersRaw, error: chaptersError } = await supabase
        .from("chapters" as any)
        .select("id, series_id, chapter_number, slug, title")
        .in("id", uniqueChapterIds.slice(0, 30))
        .order("chapter_number", { ascending: false });

    const chapters = chaptersRaw as unknown as Array<{ id: string; series_id: string; chapter_number: number; slug: string; title: string }> | null;

    if (chaptersError || !chapters || chapters.length === 0) {
        return NextResponse.json({ items: [] });
    }

    // Para cada série, pegar apenas o capítulo mais recente lido (máx 6 séries)
    const seriesMap = new Map<string, any>();
    for (const chapter of chapters as any[]) {
        if (chapter.series_id && !seriesMap.has(chapter.series_id)) {
            seriesMap.set(chapter.series_id, chapter);
        }
        if (seriesMap.size >= 6) break;
    }

    if (seriesMap.size === 0) {
        return NextResponse.json({ items: [] });
    }

    const seriesIds = Array.from(seriesMap.keys());

    // Buscar dados das séries
    const { data: seriesData, error: seriesError } = await supabase
        .from("series_with_author" as any)
        .select("id, title, slug, cover_url, genre, chapter_count, is_completed, author_username, author_first_name, author_last_name")
        .in("id", seriesIds);

    if (seriesError || !seriesData) {
        return NextResponse.json({ items: [] });
    }

    // Para cada série, descobrir o próximo capítulo a ler
    const seriesWithNextChapter = await Promise.all(
        (seriesData as any[]).map(async (series) => {
            const lastReadChapter = seriesMap.get(series.id);
            const lastReadNumber = lastReadChapter?.chapter_number || 0;

            // Buscar próximo capítulo (número > último lido)
            const { data: nextChapterRaw } = await supabase
                .from("chapters" as any)
                .select("id, slug, chapter_number, title")
                .eq("series_id", series.id)
                .not("published_at", "is", null)
                .gt("chapter_number", lastReadNumber)
                .order("chapter_number", { ascending: true })
                .limit(1)
                .maybeSingle();
            const nextChapter = nextChapterRaw as unknown as { id: string; slug: string; chapter_number: number; title: string } | null;

            // Se não há próximo, continua do início ou indica série concluída
            const nextSlug = nextChapter?.slug || lastReadChapter?.slug;
            const isUpToDate = !nextChapter;

            return {
                seriesId: series.id,
                seriesTitle: series.title,
                seriesSlug: series.slug || series.id,
                coverUrl: series.cover_url,
                genre: series.genre,
                chapterCount: series.chapter_count || 0,
                isCompleted: series.is_completed,
                authorName: series.author_first_name && series.author_last_name
                    ? `${series.author_first_name} ${series.author_last_name}`.trim()
                    : series.author_username || "Autor",
                lastReadChapterNumber: lastReadNumber,
                nextChapterSlug: nextSlug,
                nextChapterNumber: nextChapter?.chapter_number || lastReadNumber,
                isUpToDate,
            };
        })
    );

    return NextResponse.json({ items: seriesWithNextChapter });
}

/**
 * DELETE /api/reading-history
 * Remove uma série do histórico de leitura do usuário, deletando os registros no xp_history.
 * Recalcula o progresso de leitura apagando o que foi lido.
 */
export async function DELETE(req: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { seriesId } = await req.json();
        if (!seriesId) {
            return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
        }

        // Bypassing RLS with Admin client for data deletion since xp_history might be protected
        const supabaseAdmin = createAdminSupabaseClient();

        // 1. Buscar todos os IDs de capítulos associados a essa série
        const { data: chapters, error: chaptersError } = await (supabaseAdmin
            .from("chapters" as any)
            .select("id")
            .eq("series_id", seriesId) as any);

        if (chaptersError || !chapters || chapters.length === 0) {
            return NextResponse.json({ success: true, message: "No chapters found or error fetching chapters" });
        }

        const chapterIds = chapters.map((c: any) => c.id);

        // 2. Deletar as entradas de xp_history vinculadas à leitura de capítulos dessa série
        const { error: deleteError } = await (supabaseAdmin
            .from("xp_history")
            .delete()
            .eq("user_id", user.id)
            .eq("action_type", "read_chapter")
            .in("entity_id", chapterIds) as any);

        if (deleteError) {
            console.error("Error deleting reading history:", deleteError);
            return NextResponse.json({ error: "Failed to delete from history" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing DELETE reading history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/reading-history
 * Registra um evento de leitura e premia XP por descoberta (primeira vez).
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { seriesId, chapterId, isFirstChapter } = await req.json();

        if (!seriesId) {
            return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
        }


        return NextResponse.json({
            success: true,
            seriesXpAwarded: false,
            chapterXpAwarded: false
        });

    } catch (error) {
        console.error("[API/ReadingHistory/XP] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
