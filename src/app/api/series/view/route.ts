import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware, checkViewAbuseDetailed } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { hashIP, getClientIP } from "@/lib/ip-hash";

// API para incrementar visualizações de séries
export async function POST(request: NextRequest) {
    try {
        // 1. Verificar se o usuário é Administrador ou Moderador (Isenção Total)
        // Usamos o server client para pegar o usuário autenticado via cookies
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (user) {
            const { data: profile } = await (supabaseAuth
                .from("profiles")
                .select("role")
                .eq("id", user.id)
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
                { error: "ID da série não fornecido" },
                { status: 400 }
            );
        }

        const supabase = createAdminSupabaseClient();

        // 2. Verificar se a série está bloqueada ou arquivada por abuso
        const { data: series, error: getError } = await supabase
            .from("series")
            .select("view_count, abuse_infractions, abuse_locked_until, is_force_archived, is_archived")
            .eq("id", id)
            .single() as any;

        if (getError || !series) {
            return NextResponse.json({ error: "Série não encontrada" }, { status: 404 });
        }

        if (series.is_force_archived) {
            return NextResponse.json({ error: "Série arquivada permanentemente por abuso.", isPermanent: true }, { status: 403 });
        }

        if (series.abuse_locked_until && new Date(series.abuse_locked_until) > new Date()) {
            return NextResponse.json({ 
                error: "Série temporariamente bloqueada por abuso.", 
                blockedUntil: series.abuse_locked_until 
            }, { status: 403 });
        }

        // 2. Verificar abuso de F5 (10s cooldown)
        const abuseCheck = checkViewAbuseDetailed(request, id);
        
        if (abuseCheck.isAbuse) {
            if (abuseCheck.isPenalty) {
                // Aplicar penalidade progressiva
                const nextInfraction = (series.abuse_infractions || 0) + 1;
                let blockedUntil: Date | null = null;
                let forceArchive = false;

                if (nextInfraction === 1) blockedUntil = new Date(Date.now() + 60000); // 1 min
                else if (nextInfraction === 2) blockedUntil = new Date(Date.now() + 24 * 60 * 60000); // 1 dia
                else if (nextInfraction === 3) blockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60000); // 1 semana
                else if (nextInfraction >= 4) forceArchive = true;

                await supabase
                    .from("series")
                    .update({ 
                        abuse_infractions: nextInfraction,
                        abuse_locked_until: blockedUntil?.toISOString(),
                        is_force_archived: forceArchive,
                        is_archived: forceArchive ? true : series.is_archived
                    })
                    .eq("id", id);

                return NextResponse.json({ 
                    error: forceArchive ? "Série excluída/arquivada permanentemente." : "Infração detectada. Série bloqueada.",
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

        // 3. Registrar view única (deduplicação de 24h no banco)
        const ipHash = hashIP(getClientIP(request));
        const { data: isUnique, error: viewError } = await (supabase as any)
            .rpc("register_unique_view", {
                p_content_type: "series",
                p_content_id: id,
                p_user_id: user?.id || null,
                p_ip_hash: user ? null : ipHash
            });

        if (viewError) {
            console.error("Erro ao registrar view única:", viewError);
            return NextResponse.json(
                { error: "Erro ao registrar visualização" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, isUnique: isUnique });
    } catch (error) {
        console.error("Erro na API de visualização de séries:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
