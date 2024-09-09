import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware, checkViewAbuseDetailed } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { hashIP, getClientIP } from "@/lib/ip-hash";

// API para incrementar visualizações de capítulos
export async function POST(request: NextRequest) {
    try {
        // 1. Verificar se o usuário é Administrador ou Moderador (Isenção Total)
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

        if (authUser) {
            const { data: profile } = await (supabaseAuth
                .from("profiles")
                .select("role")
                .eq("id", authUser.id)
                .single() as any);
            
            if (profile?.role === 'admin' || profile?.role === 'moderator') {
                return NextResponse.json({ success: true, isAdmin: true });
            }
        }

        // ✅ SEGURANÇA: Rate limiting (apenas para usuários comuns/visitantes)
        const rateLimitResponse = await rateLimitMiddleware(request, 'views');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "ID do capítulo não fornecido" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // 2. Identificar o usuário comum para registro de histórico (opcional)
        const user = authUser;

        // 1. Buscar capítulo e sua série pai
        const { data: chapter, error: getError } = await supabase
            .from("chapters")
            .select("view_count, series_id, author_id")
            .eq("id", id)
            .single() as any;

        if (getError || !chapter) {
            return NextResponse.json({ error: "Capítulo não encontrado" }, { status: 404 });
        }

        // Preparar IP Hash para deduplicação de 24h
        const ipHash = hashIP(getClientIP(request));

        // 2. Se houver série pai, verificar bloqueios e abuso nela
        if (chapter.series_id) {
            const { data: series, error: seriesGetError } = await supabase
                .from("series")
                .select("view_count, abuse_infractions, abuse_locked_until, is_force_archived, is_archived")
                .eq("id", chapter.series_id)
                .single() as any;

            if (!seriesGetError && series) {
                // Verificar se a série está bloqueada permanentemente
                if (series.is_force_archived) {
                    return NextResponse.json({ error: "Série arquivada permanentemente por abuso.", isPermanent: true }, { status: 403 });
                }

                // Verificar bloqueio temporário
                if (series.abuse_locked_until && new Date(series.abuse_locked_until) > new Date()) {
                    return NextResponse.json({ 
                        error: "Série temporariamente bloqueada por abuso.", 
                        blockedUntil: series.abuse_locked_until 
                    }, { status: 403 });
                }

                // Verificar abuso de F5 (10s cooldown) na série
                // Usamos o ID da série para agrupar o abuso, pois F5 no capítulo também infla a série
                const abuseCheck = checkViewAbuseDetailed(request, chapter.series_id);
                
                if (abuseCheck.isAbuse) {
                    if (abuseCheck.isPenalty) {
                        const nextInfraction = (series.abuse_infractions || 0) + 1;
                        let blockedUntil: Date | null = null;
                        let forceArchive = false;

                        if (nextInfraction === 1) blockedUntil = new Date(Date.now() + 60000);
                        else if (nextInfraction === 2) blockedUntil = new Date(Date.now() + 24 * 60 * 60000);
                        else if (nextInfraction === 3) blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60000);
                        else if (nextInfraction >= 4) forceArchive = true;

                        await supabase
                            .from("series")
                            .update({ 
                                abuse_infractions: nextInfraction,
                                abuse_locked_until: blockedUntil?.toISOString(),
                                is_force_archived: forceArchive,
                                is_archived: forceArchive ? true : series.is_archived
                            })
                            .eq("id", chapter.series_id);

                        return NextResponse.json({ 
                            error: forceArchive ? "Série arquivada permanentemente." : "Infração detectada. Série bloqueada.",
                            isPenalty: true,
                            infractionLevel: nextInfraction
                        }, { status: 429 });
                    }

                    return NextResponse.json({ 
                        error: "Muitas atualizações rápidas.", 
                        isAbuse: true,
                        suspiciousCount: abuseCheck.suspiciousCount 
                    }, { status: 429 });
                }

                // Registrar view única na série pai (deduplicação de 24h)
                await (supabase as any).rpc("register_unique_view", {
                    p_content_type: "series",
                    p_content_id: chapter.series_id,
                    p_user_id: user?.id || null,
                    p_ip_hash: user ? null : ipHash
                });
            }
        }

        // Registrar view única no capítulo (deduplicação de 24h)
        const { data: isUniqueChapter, error: chapterViewError } = await (supabase as any)
            .rpc("register_unique_view", {
                p_content_type: "chapter",
                p_content_id: id,
                p_user_id: user?.id || null,
                p_ip_hash: user ? null : ipHash
            });

        // 4. Registrar no histórico de leitura e premiar XP (apenas se view única)
        if (!chapterViewError && isUniqueChapter) {
            try {
                const { grantXP } = await import("@/services/xp");

                // A. Premiar o leitor logado (se houver) com 10 XP por capítulo lido
                if (user) {
                    await grantXP(user.id, 'READ_CHAPTER', id);
                }

                // B. Premiar o autor do capítulo com +2 XP por receber uma visualização
                if (chapter?.author_id) {
                    await grantXP(chapter.author_id, 'AUTHOR_VIEW_EARNED', id);
                }
            } catch (err) {
                console.error("Erro ao registrar XP de leitura/visualização:", err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro na API de visualização de capítulos:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
