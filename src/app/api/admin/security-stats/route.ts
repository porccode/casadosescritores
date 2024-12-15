// src/app/api/admin/security-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getSecurityStats } from "@/lib/security-logger";
import { getRateLimitStats } from "@/lib/rate-limit";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

// Define helper types for stats analysis
interface SecurityStats {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByIp: Record<string, number>;
    recentEvents: any[];
}

interface RateLimitStats {
    totalEntries: number;
    blockedIps: number;
}

interface Recommendation {
    type: "warning" | "critical" | "info";
    message: string;
    priority: "low" | "medium" | "high";
}

interface Alert {
    level: "critical" | "high" | "medium" | "low";
    message: string;
    action: string;
}

export async function GET(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'admin');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Verificar autenticação
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        // Verificar se é administrador
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(ADMIN_ACCESS_PROFILE_SELECT)
            .eq("id", user.id)
            .single();

        if (profileError || !profile || !isAdminRole(profile)) {
            return NextResponse.json(
                { error: "Acesso negado - privilégios de administrador necessários" },
                { status: 403 }
            );
        }

        // Obter parâmetros da query
        const url = new URL(request.url);
        const hoursParam = url.searchParams.get('hours');
        const hours = hoursParam ? parseInt(hoursParam) : 24;

        // Coletar estatísticas de segurança
        const securityStats = await getSecurityStats(hours) as unknown as SecurityStats;
        const rateLimitStats = getRateLimitStats() as unknown as RateLimitStats;

        // Estatísticas adicionais do banco de dados
        const now = new Date();
        const timeAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000));

        // Contar registros recentes (últimas 24h)
        const { data: recentUsers, error: usersError } = await supabase
            .from("profiles")
            .select("id, created_at")
            .gte("created_at", timeAgo.toISOString());

        const { data: recentStories, error: storiesError } = await supabase
            .from("stories")
            .select("id, created_at")
            .gte("created_at", timeAgo.toISOString());

        const { data: recentComments, error: commentsError } = await supabase
            .from("comments")
            .select("id, created_at")
            .gte("created_at", timeAgo.toISOString());

        // Compilar estatísticas completas
        const stats = {
            timeframe: `${hours} horas`,
            timestamp: now.toISOString(),
            security: securityStats,
            rateLimit: rateLimitStats,
            activity: {
                newUsers: recentUsers?.length || 0,
                newStories: recentStories?.length || 0,
                newComments: recentComments?.length || 0,
                errors: {
                    usersQuery: !!usersError,
                    storiesQuery: !!storiesError,
                    commentsQuery: !!commentsError
                }
            },
            recommendations: generateSecurityRecommendations(securityStats, rateLimitStats),
            alerts: generateSecurityAlerts(securityStats)
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("Erro ao obter estatísticas de segurança:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

/**
 * Gera recomendações de segurança baseadas nas estatísticas
 */
function generateSecurityRecommendations(securityStats: SecurityStats, rateLimitStats: RateLimitStats): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Verificar rate limiting
    if (rateLimitStats.totalEntries > 5000) {
        recommendations.push({
            type: "warning",
            message: "Alto número de entradas no rate limiting. Considere implementar Redis.",
            priority: "medium"
        });
    }

    // Verificar eventos críticos
    if ((securityStats.eventsBySeverity?.CRITICAL || 0) > 0) {
        recommendations.push({
            type: "critical",
            message: "Eventos críticos de segurança detectados. Investigação imediata necessária.",
            priority: "high"
        });
    }

    // Verificar eventos de alta severidade
    if ((securityStats.eventsBySeverity?.HIGH || 0) > 10) {
        recommendations.push({
            type: "warning",
            message: "Muitos eventos de alta severidade. Revisar logs de segurança.",
            priority: "medium"
        });
    }

    // Recomendações gerais
    recommendations.push({
        type: "info",
        message: "Considere implementar 2FA para todos os administradores.",
        priority: "low"
    });

    recommendations.push({
        type: "info",
        message: "Configure alertas automáticos para eventos críticos.",
        priority: "medium"
    });

    return recommendations;
}

/**
 * Gera alertas de segurança baseados nas estatísticas
 */
function generateSecurityAlerts(securityStats: SecurityStats): Alert[] {
    const alerts: Alert[] = [];

    // Alertas baseados em eventos críticos
    if ((securityStats.eventsBySeverity?.CRITICAL || 0) > 0) {
        alerts.push({
            level: "critical",
            message: `${securityStats.eventsBySeverity.CRITICAL} evento(s) crítico(s) detectado(s)`,
            action: "Investigar imediatamente"
        });
    }

    // Alertas baseados em tentativas de escalação
    if ((securityStats.eventsByType?.PRIVILEGE_ESCALATION || 0) > 0) {
        alerts.push({
            level: "high",
            message: "Tentativas de escalação de privilégios detectadas",
            action: "Revisar logs e verificar contas de usuário"
        });
    }

    // Alertas baseados em rate limiting
    if ((securityStats.eventsByType?.RATE_LIMIT_HIT || 0) > 50) {
        alerts.push({
            level: "medium",
            message: "Alto número de rate limits atingidos",
            action: "Verificar possível ataque DDoS"
        });
    }

    return alerts;
}
