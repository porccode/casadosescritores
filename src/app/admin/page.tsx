"use client";

import { RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading-states";
import { cn } from "@/lib/utils";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminTrafficChart } from "@/components/admin/AdminTrafficChart";
import { AdminPathAnalytics } from "@/components/admin/AdminPathAnalytics";
import { AdminUserRankings } from "@/components/admin/AdminUserRankings";
import { useAdminDashboard, TimePeriod } from "@/hooks/useAdminDashboard";

export default function AdminDashboard() {
    const { stats, loading, period, setPeriod, loadStats } = useAdminDashboard();

    if (loading && stats.totalSessions === 0 && stats.totalClicks === 0) {
        return (
            <div className="space-y-6 p-1">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Skeleton className="lg:col-span-2 h-[300px] rounded-lg" />
                    <Skeleton className="h-[300px] rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
                </div>
                <Skeleton className="h-72 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-5 p-1">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Central de inteligência — dados reais do período.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
                        <SelectTrigger className="w-[150px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="15d">Últimos 15 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="6m">6 meses</SelectItem>
                            <SelectItem value="1y">1 ano</SelectItem>
                            <SelectItem value="all">Todo o período</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={loadStats}
                        className="h-9 w-9"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* 6 KPIs */}
            <AdminStatsCards stats={stats} />

            {/* Traffic Chart + Donut */}
            <AdminTrafficChart
                data={stats.chartData}
                loggedInSessions={stats.loggedInSessions}
                anonymousSessions={stats.anonymousSessions}
            />

            {/* Rankings: Top Writers, Commenters, Visitors */}
            <AdminUserRankings
                topWriters={stats.topWriters}
                topCommenters={stats.topCommenters}
                topVisitors={stats.topVisitors}
                anonymousVisitCount={stats.anonymousVisitCount}
            />

            {/* Pages Analytics */}
            <AdminPathAnalytics paths={stats.topPaths} />

        </div>
    );
}
