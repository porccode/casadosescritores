"use client";

import { MousePointerClick, Eye, LogIn, User, BookOpen, MessageSquare } from "lucide-react";
import { KpiCard } from "./KpiCard";
import type { Stats } from "@/hooks/useAdminDashboard";

interface AdminStatsCardsProps {
    stats: Stats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard
                label="Acessos Totais"
                value={stats.totalClicks}
                icon={<MousePointerClick className="h-4 w-4" />}
                trend={stats.clicksTrend}
            />
            <KpiCard
                label="Acessos Logados"
                value={stats.loggedInSessions}
                icon={<LogIn className="h-4 w-4" />}
                subtitle={stats.totalClicks > 0
                    ? `${Math.round((stats.loggedInSessions / stats.totalClicks) * 100)}% do total`
                    : undefined}
            />
            <KpiCard
                label="Visualizações Reais"
                value={stats.totalViews}
                icon={<Eye className="h-4 w-4" />}
                trend={stats.viewsTrend}
            />
            <KpiCard
                label="Novos Usuários"
                value={stats.newUsers}
                icon={<User className="h-4 w-4" />}
                trend={stats.usersTrend}
            />
            <KpiCard
                label="Capítulos Publicados"
                value={stats.totalChapters}
                icon={<BookOpen className="h-4 w-4" />}
                subtitle={`${stats.totalSeries} séries ativas`}
            />
            <KpiCard
                label="Comentários"
                value={stats.totalComments}
                icon={<MessageSquare className="h-4 w-4" />}
                trend={stats.commentsTrend}
            />
        </div>
    );
}
