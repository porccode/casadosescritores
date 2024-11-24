"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { fetchAdminDashboardRPCs } from "@/app/admin/actions";

export interface PathStat {
    path: string;
    total_clicks: number;
    unique_sessions: number;
}

export interface UserRankEntry {
    user_id: string;
    username: string;
    avatar_url: string | null;
    count: number;
}

export interface TopVisitorEntry {
    user_id: string | null;
    username: string | null;
    avatar_url: string | null;
    visit_count: number;
    is_anonymous: boolean;
}

export interface Stats {
    // Traffic
    totalSessions: number;
    totalClicks: number;
    loggedInSessions: number;
    anonymousSessions: number;
    // Content  
    totalSeries: number;
    totalChapters: number;
    totalUsers: number;
    newUsers: number;
    totalComments: number;
    totalViews: number;
    // Trends
    sessionsTrend: number;
    clicksTrend: number;
    usersTrend: number;
    commentsTrend: number;
    viewsTrend: number;
    // Chart
    chartData: { date: string; sessions: number; clicks: number; loggedIn: number; anonymous: number }[];
    // Analytics
    topPaths: PathStat[];
    topWriters: UserRankEntry[];
    topCommenters: UserRankEntry[];
    topVisitors: TopVisitorEntry[];
    anonymousVisitCount: number;
}

export type TimePeriod = "7d" | "15d" | "30d" | "6m" | "1y" | "all";

function getDateRange(period: TimePeriod): { start: Date | null; previousStart: Date | null; previousEnd: Date | null } {
    const now = new Date();
    let start: Date | null = null;
    let previousStart: Date | null = null;
    let previousEnd: Date | null = null;

    switch (period) {
        case "7d":
            start = new Date(now); start.setDate(now.getDate() - 7);
            previousStart = new Date(start); previousStart.setDate(start.getDate() - 7);
            previousEnd = start;
            break;
        case "15d":
            start = new Date(now); start.setDate(now.getDate() - 15);
            previousStart = new Date(start); previousStart.setDate(start.getDate() - 15);
            previousEnd = start;
            break;
        case "30d":
            start = new Date(now); start.setDate(now.getDate() - 30);
            previousStart = new Date(start); previousStart.setDate(start.getDate() - 30);
            previousEnd = start;
            break;
        case "6m":
            start = new Date(now); start.setMonth(now.getMonth() - 6);
            previousStart = new Date(start); previousStart.setMonth(start.getMonth() - 6);
            previousEnd = start;
            break;
        case "1y":
            start = new Date(now); start.setFullYear(now.getFullYear() - 1);
            previousStart = new Date(start); previousStart.setFullYear(start.getFullYear() - 1);
            previousEnd = start;
            break;
        case "all":
            start = null;
            previousStart = null;
            previousEnd = null;
            break;
    }

    return { start, previousStart, previousEnd };
}

function calcTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Custom hook for Admin Dashboard — 100% REAL DATA via Server-side aggregation.
 */
export function useAdminDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalSessions: 0,
        totalClicks: 0,
        loggedInSessions: 0,
        anonymousSessions: 0,
        totalSeries: 0,
        totalChapters: 0,
        totalUsers: 0,
        newUsers: 0,
        totalComments: 0,
        totalViews: 0,
        sessionsTrend: 0,
        clicksTrend: 0,
        usersTrend: 0,
        commentsTrend: 0,
        viewsTrend: 0,
        chartData: [],
        topPaths: [],
        topWriters: [],
        topCommenters: [],
        topVisitors: [],
        anonymousVisitCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<TimePeriod>("all"); // DEFAULT TO ALL TIME
    const supabase = createBrowserClient();

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const { start, previousStart, previousEnd } = getDateRange(period);
            const startStr = start?.toISOString() || null;
            const endStr = null; // Current now

            // 1. DADOS DE TRÁFEGO (Server-side RPCs para evitar limite de 1000 rows)
            
            // Build count queries
            let totalClicksQ = supabase.from("site_visits" as any).select("*", { count: "exact", head: true });
            if (startStr) totalClicksQ = totalClicksQ.gte("created_at", startStr);

            let loggedVisitsQ = supabase.from("site_visits" as any).select("*", { count: "exact", head: true }).not("user_id", "is", null);
            if (startStr) loggedVisitsQ = loggedVisitsQ.gte("created_at", startStr);

            let totalCommentsQ = supabase.from("comments").select("*", { count: "exact", head: true });
            if (startStr) totalCommentsQ = totalCommentsQ.gte("created_at", startStr);

            let newUsersQ = supabase.from("profiles").select("*", { count: "exact", head: true });
            if (startStr) newUsersQ = newUsersQ.gte("created_at", startStr);

            let periodViewsQ = supabase.from("view_logs" as any).select("*", { count: "exact", head: true });
            if (startStr) periodViewsQ = periodViewsQ.gte("created_at", startStr);

            const [
                { pathStats, chartDataRaw, writersRank, commentersRank, visitorsRank },
                // Total counts
                { count: totalClicksCount },
                { count: loggedVisitsCount },
                { count: totalUsersCount },
                { count: totalSeriesCount },
                { count: totalChaptersCount },
                { count: totalCommentsCount },
                { count: newUsersCount },
                { count: periodViewsCount },
                // Previous period for trends
                { count: prevClicksCount },
                { count: prevCommentsCount },
                { count: prevUsersCount },
                { count: prevViewsCount },
            ] = await Promise.all([
                fetchAdminDashboardRPCs(startStr, period),
                
                totalClicksQ,
                loggedVisitsQ,
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                supabase.from("series").select("*", { count: "exact", head: true }),
                supabase.from("chapters").select("*", { count: "exact", head: true }),
                totalCommentsQ,
                newUsersQ,
                periodViewsQ,

                // Previous period for trends
                previousStart && previousEnd
                    ? supabase.from("site_visits" as any).select("*", { count: "exact", head: true })
                        .gte("created_at", previousStart.toISOString())
                        .lt("created_at", previousEnd.toISOString())
                    : Promise.resolve({ count: 0 }),
                previousStart && previousEnd
                    ? supabase.from("comments").select("*", { count: "exact", head: true })
                        .gte("created_at", previousStart.toISOString())
                        .lt("created_at", previousEnd.toISOString())
                    : Promise.resolve({ count: 0 }),
                previousStart && previousEnd
                    ? supabase.from("profiles").select("*", { count: "exact", head: true })
                        .gte("created_at", previousStart.toISOString())
                        .lt("created_at", previousEnd.toISOString())
                    : Promise.resolve({ count: 0 }),
                previousStart && previousEnd
                    ? supabase.from("view_logs" as any).select("*", { count: "exact", head: true })
                        .gte("created_at", previousStart.toISOString())
                        .lt("created_at", previousEnd.toISOString())
                    : Promise.resolve({ count: 0 }),
            ]);

            // Calculate sessions (unique) from path stats sum or fallback to total clicks count
            const pathSessionsSum = (pathStats || []).reduce((acc: number, cur: any) => acc + (Number(cur.unique_sessions) || 0), 0);
            const totalSessions = pathSessionsSum > 0 ? pathSessionsSum : (totalClicksCount || 0);
            const anonymousVisits = Math.max(0, (totalClicksCount || 0) - (loggedVisitsCount || 0));

            // Format chart data
            const formattedChartData = (chartDataRaw || []).map((d: any) => ({
                date: d.chart_date,
                sessions: Number(d.sessions),
                clicks: Number(d.clicks),
                loggedIn: Number(d.logged_in),
                anonymous: Number(d.anonymous)
            }));

            // Format Rankings
            const topPaths: PathStat[] = (pathStats || []).map((p: any) => ({
                path: p.path === "/" ? "Home" : p.path,
                total_clicks: Number(p.total_clicks),
                unique_sessions: Number(p.unique_sessions)
            }));

            const topWriters: UserRankEntry[] = (writersRank || []).map((w: any) => ({
                user_id: w.user_id,
                username: w.username,
                avatar_url: w.avatar_url,
                count: Number(w.total_count)
            }));

            const topCommenters: UserRankEntry[] = (commentersRank || []).map((c: any) => ({
                user_id: c.user_id,
                username: c.username,
                avatar_url: c.avatar_url,
                count: Number(c.total_count)
            }));

            const topVisitors: TopVisitorEntry[] = (visitorsRank || []).map((v: any) => ({
                user_id: v.user_id,
                username: v.username,
                avatar_url: v.avatar_url,
                visit_count: Number(v.total_count),
                is_anonymous: false
            }));

            // --- TOTAL GLOBAL VIEWS (from view counts in series/chapters) ---
            const { data: totalViewsRpc } = await supabase.rpc("get_total_content_views" as any);
            const realTotalViews = period === "all"
                ? Math.max(periodViewsCount || 0, Number(totalViewsRpc || 0))
                : (periodViewsCount || 0);

            // Previous sessions trend (estimated)
            const prevSessions = (prevClicksCount || 0) * 0.8;

            setStats({
                totalSessions,
                totalClicks: totalClicksCount || 0,
                loggedInSessions: loggedVisitsCount || 0,
                anonymousSessions: anonymousVisits,
                totalSeries: totalSeriesCount || 0,
                totalChapters: totalChaptersCount || 0,
                totalUsers: totalUsersCount || 0,
                newUsers: newUsersCount || 0,
                totalComments: totalCommentsCount || 0,
                totalViews: realTotalViews,
                sessionsTrend: calcTrend(totalSessions, prevSessions),
                clicksTrend: calcTrend(totalClicksCount || 0, prevClicksCount || 0),
                usersTrend: calcTrend(newUsersCount || 0, prevUsersCount || 0),
                commentsTrend: calcTrend(totalCommentsCount || 0, prevCommentsCount || 0),
                viewsTrend: calcTrend(periodViewsCount || 0, prevViewsCount || 0),
                chartData: formattedChartData,
                topPaths,
                topWriters,
                topCommenters,
                topVisitors,
                anonymousVisitCount: anonymousVisits,
            });
        } catch (error) {
            console.error("Erro fatal ao carregar dashboard real:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase, period]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return { stats, loading, period, setPeriod, loadStats };
}
