"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

export async function fetchAdminDashboardRPCs(startStr: string | null, period: string) {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
        throw new Error("Não autorizado");
    }

    const { data: profile } = await supabaseAuth
        .from("profiles")
        .select(ADMIN_ACCESS_PROFILE_SELECT)
        .eq("id", user.id)
        .single();

    if (!profile || !isAdminRole(profile)) {
        throw new Error("Acesso negado - privilégios de administrador necessários");
    }

    // Usar o cliente autenticado do Admin (respeita as permissões do Admin no RLS)
    // com fallback para o client de service role caso configurado.
    const adminRoleClient = createAdminSupabaseClient();
    const supabase = supabaseAuth;

    // Helper para tentar RPC primeiro no adminRoleClient, depois no supabaseAuth
    const safeRpc = async (fnName: string, args: any) => {
        try {
            const res = await (adminRoleClient.rpc as any)(fnName, args);
            if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
        } catch (e) { }
        try {
            const res = await (supabase.rpc as any)(fnName, args);
            if (res.data && Array.isArray(res.data) && res.data.length > 0) return res.data;
        } catch (e) { }
        return null;
    };
    
    // Executar RPCs
    let [pathStats, chartDataRaw, writersRank, commentersRank, visitorsRank] = await Promise.all([
        safeRpc("get_admin_path_stats", { p_start_date: startStr }),
        safeRpc("get_admin_traffic_chart", { 
            p_start_date: startStr,
            p_interval: (period === "6m" || period === "1y" || period === "all") ? "month" : "day"
        }),
        safeRpc("get_admin_user_rankings", { p_start_date: startStr, p_type: "writers" }),
        safeRpc("get_admin_user_rankings", { p_start_date: startStr, p_type: "commenters" }),
        safeRpc("get_admin_user_rankings", { p_start_date: startStr, p_type: "visitors" })
    ]);

    // --- FALLBACK 1: Path Stats (se a RPC não retornar dados) ---
    if (!pathStats || !Array.isArray(pathStats) || pathStats.length === 0) {
        let q = (supabase.from("site_visits") as any).select("path, session_id");
        if (startStr) q = q.gte("created_at", startStr);
        const { data: visits } = await q.limit(5000);
        if (visits && visits.length > 0) {
            const countsMap = new Map<string, { clicks: number; sessions: Set<string> }>();
            for (const v of visits) {
                const p = v.path || "/";
                if (!countsMap.has(p)) countsMap.set(p, { clicks: 0, sessions: new Set() });
                const item = countsMap.get(p)!;
                item.clicks++;
                if (v.session_id) item.sessions.add(v.session_id);
            }
            pathStats = Array.from(countsMap.entries())
                .map(([path, stat]) => ({
                    path,
                    total_clicks: stat.clicks,
                    unique_sessions: Math.max(1, stat.sessions.size)
                }))
                .sort((a, b) => b.total_clicks - a.total_clicks)
                .slice(0, 10);
        }
    }

    // --- FALLBACK 2: Chart Data (se a RPC não retornar dados) ---
    if (!chartDataRaw || !Array.isArray(chartDataRaw) || chartDataRaw.length === 0) {
        let q = (supabase.from("site_visits") as any).select("created_at, user_id, session_id");
        if (startStr) q = q.gte("created_at", startStr);
        const { data: visits } = await q.limit(10000);
        if (visits && visits.length > 0) {
            const daysMap = new Map<string, { clicks: number; sessions: Set<string>; loggedIn: number; anonymous: number }>();
            for (const v of visits) {
                const dateStr = new Date(v.created_at).toISOString().split("T")[0];
                if (!daysMap.has(dateStr)) daysMap.set(dateStr, { clicks: 0, sessions: new Set(), loggedIn: 0, anonymous: 0 });
                const day = daysMap.get(dateStr)!;
                day.clicks++;
                if (v.session_id) day.sessions.add(v.session_id);
                if (v.user_id) day.loggedIn++;
                else day.anonymous++;
            }
            chartDataRaw = Array.from(daysMap.entries())
                .map(([chart_date, stat]) => ({
                    chart_date,
                    sessions: Math.max(1, stat.sessions.size),
                    clicks: stat.clicks,
                    logged_in: stat.loggedIn,
                    anonymous: stat.anonymous
                }))
                .sort((a, b) => a.chart_date.localeCompare(b.chart_date));
        }
    }

    // --- FALLBACK 3: Top Writers ---
    if (!writersRank || !Array.isArray(writersRank) || writersRank.length === 0) {
        let q = (supabase.from("chapters") as any).select("author_id");
        if (startStr) q = q.gte("created_at", startStr);
        const { data: chapters } = await q.limit(2000);
        if (chapters && chapters.length > 0) {
            const writerCounts = new Map<string, number>();
            for (const c of chapters) {
                if (c.author_id) {
                    writerCounts.set(c.author_id, (writerCounts.get(c.author_id) || 0) + 1);
                }
            }
            const sortedWriters = Array.from(writerCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (sortedWriters.length > 0) {
                const authorIds = sortedWriters.map(w => w[0]);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", authorIds);
                const profMap = new Map(((profiles || []) as any[]).map(p => [p.id, p]));

                writersRank = sortedWriters.map(([user_id, total_count]) => ({
                    user_id,
                    username: profMap.get(user_id)?.username || "Autor",
                    avatar_url: profMap.get(user_id)?.avatar_url || null,
                    total_count
                }));
            }
        }
    }

    // --- FALLBACK 4: Top Commenters ---
    if (!commentersRank || !Array.isArray(commentersRank) || commentersRank.length === 0) {
        let q = (supabase.from("comments") as any).select("author_id");
        if (startStr) q = q.gte("created_at", startStr);
        const { data: comments } = await q.limit(2000);
        if (comments && comments.length > 0) {
            const commenterCounts = new Map<string, number>();
            for (const c of comments) {
                const uid = c.author_id || c.user_id;
                if (uid) {
                    commenterCounts.set(uid, (commenterCounts.get(uid) || 0) + 1);
                }
            }
            const sortedCommenters = Array.from(commenterCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (sortedCommenters.length > 0) {
                const userIds = sortedCommenters.map(c => c[0]);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", userIds);
                const profMap = new Map(((profiles || []) as any[]).map(p => [p.id, p]));

                commentersRank = sortedCommenters.map(([user_id, total_count]) => ({
                    user_id,
                    username: profMap.get(user_id)?.username || "Comentador",
                    avatar_url: profMap.get(user_id)?.avatar_url || null,
                    total_count
                }));
            }
        }
    }

    // --- FALLBACK 5: Top Visitors ---
    if (!visitorsRank || !Array.isArray(visitorsRank) || visitorsRank.length === 0) {
        let q = (supabase.from("site_visits") as any).select("user_id").not("user_id", "is", null);
        if (startStr) q = q.gte("created_at", startStr);
        const { data: visits } = await q.limit(5000);
        if (visits && visits.length > 0) {
            const visitorCounts = new Map<string, number>();
            for (const v of visits) {
                if (v.user_id) {
                    visitorCounts.set(v.user_id, (visitorCounts.get(v.user_id) || 0) + 1);
                }
            }
            const sortedVisitors = Array.from(visitorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (sortedVisitors.length > 0) {
                const userIds = sortedVisitors.map(v => v[0]);
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", userIds);
                const profMap = new Map(((profiles || []) as any[]).map(p => [p.id, p]));

                visitorsRank = sortedVisitors.map(([user_id, total_count]) => ({
                    user_id,
                    username: profMap.get(user_id)?.username || "Visitante",
                    avatar_url: profMap.get(user_id)?.avatar_url || null,
                    total_count
                }));
            }
        }
    }

    return { 
        pathStats: pathStats || [], 
        chartDataRaw: chartDataRaw || [], 
        writersRank: writersRank || [], 
        commentersRank: commentersRank || [], 
        visitorsRank: visitorsRank || [] 
    };
}
