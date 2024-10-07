import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/**
 * GET /api/profile/export
 * Endpoint de Portabilidade de Dados (LGPD - Art. 18, V da Lei nº 13.709/2018).
 * Permite que o usuário autenticado baixe um relatório completo de seus dados em JSON.
 */
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Não autorizado. Faça login primeiro." }, { status: 401 });
        }

        // Buscar dados do usuário em paralelo
        const [profileRes, seriesRes, commentsRes, postsRes, readingHistoryRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", user.id).single(),
            supabase.from("series").select("id, title, slug, genre, created_at, chapter_count").eq("author_id", user.id),
            supabase.from("comments").select("id, content, created_at").eq("author_id", user.id),
            supabase.from("posts").select("id, content, created_at").eq("author_id", user.id),
            supabase.from("reading_history").select("id, series_id, last_read_at").eq("user_id", user.id)
        ]);

        const exportData = {
            lgpd_compliance_notice: "Relatório de Portabilidade de Dados Cadastrais conforme Art. 18, V da Lei nº 13.709/2018 (LGPD).",
            exported_at: new Date().toISOString(),
            account_info: {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
            },
            profile: profileRes.data || null,
            published_series: seriesRes.data || [],
            comments: commentsRes.data || [],
            feed_posts: postsRes.data || [],
            reading_history: readingHistoryRes.data || [],
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="dados-lgpd-${user.id}.json"`,
            },
        });
    } catch (error: any) {
        console.error("Erro ao exportar dados LGPD:", error);
        return NextResponse.json({ error: "Erro interno ao gerar relatório LGPD." }, { status: 500 });
    }
}
