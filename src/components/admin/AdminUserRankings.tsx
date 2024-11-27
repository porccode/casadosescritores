"use client";

import { PenLine, MessageSquare, Eye, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserRankEntry, TopVisitorEntry } from "@/hooks/useAdminDashboard";

interface RankTableProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    metricLabel: string;
    entries: { user_id: string; username: string; avatar_url: string | null; count: number }[];
}

function RankTable({ title, description, icon, metricLabel, entries }: RankTableProps) {
    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">{icon}</div>
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                </div>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {entries.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Sem dados no período.</p>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry, i) => (
                            <div key={entry.user_id} className="flex items-center gap-3 py-1.5">
                                <span className="text-xs text-muted-foreground w-4 text-center font-mono shrink-0">
                                    {i + 1}
                                </span>
                                <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarImage src={entry.avatar_url || ""} alt={entry.username} />
                                    <AvatarFallback className="text-[10px]">
                                        {entry.username.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium flex-1 truncate">
                                    @{entry.username}
                                </span>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold tabular-nums text-primary">
                                        {entry.count.toLocaleString("pt-BR")}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">{metricLabel}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface AdminUserRankingsProps {
    topWriters: UserRankEntry[];
    topCommenters: UserRankEntry[];
    topVisitors: TopVisitorEntry[];
    anonymousVisitCount: number;
}

export function AdminUserRankings({ topWriters, topCommenters, topVisitors, anonymousVisitCount }: AdminUserRankingsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RankTable
                title="Top Escritores"
                description="Quem mais publicou capítulos no período."
                icon={<PenLine className="h-4 w-4" />}
                metricLabel="capítulos"
                entries={topWriters}
            />
            <RankTable
                title="Top Comentadores"
                description="Usuários mais ativos nos comentários."
                icon={<MessageSquare className="h-4 w-4" />}
                metricLabel="comentários"
                entries={topCommenters}
            />

            {/* Top Visitors — includes anonymous stat */}
            <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base font-semibold">Top Visitantes</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        Usuários logados com mais acessos no período.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topVisitors.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">Sem dados no período.</p>
                    ) : (
                        <div className="space-y-2">
                            {topVisitors.map((entry, i) => (
                                <div key={entry.user_id || i} className="flex items-center gap-3 py-1.5">
                                    <span className="text-xs text-muted-foreground w-4 text-center font-mono shrink-0">
                                        {i + 1}
                                    </span>
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarImage src={entry.avatar_url || ""} alt={entry.username || ""} />
                                        <AvatarFallback className="text-[10px]">
                                            {(entry.username || "?").slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium flex-1 truncate">
                                        @{entry.username}
                                    </span>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-bold tabular-nums text-primary">
                                            {entry.visit_count.toLocaleString("pt-BR")}
                                        </span>
                                        <p className="text-[10px] text-muted-foreground">acessos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Anon stat block */}
                    {anonymousVisitCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-border">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-muted-foreground">Visitantes sem conta</p>
                                    <p className="text-[10px] text-muted-foreground">potenciais para converter</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold tabular-nums text-amber-600">
                                        {anonymousVisitCount.toLocaleString("pt-BR")}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground">cliques</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
