"use client";

import { Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { PathStat } from "@/hooks/useAdminDashboard";

interface AdminPathAnalyticsProps {
    paths: PathStat[];
}

export function AdminPathAnalytics({ paths }: AdminPathAnalyticsProps) {
    const maxClicks = paths[0]?.total_clicks || 1;

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">Páginas Mais Acessadas</CardTitle>
                </div>
                <CardDescription className="text-xs">
                    URLs com mais tráfego no período — cliques totais e sessões únicas.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {paths.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                        Nenhum dado de tráfego disponível ainda.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Página</TableHead>
                                <TableHead className="text-xs text-right">Cliques</TableHead>
                                <TableHead className="text-xs text-right">Sessões</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paths.map((p, i) => (
                                <TableRow key={i} className="group">
                                    <TableCell className="py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium font-mono truncate max-w-[220px]" title={p.path}>
                                                    {p.path}
                                                </p>
                                                {/* Mini progress bar */}
                                                <div className="mt-0.5 h-0.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/60 rounded-full"
                                                        style={{ width: `${(p.total_clicks / maxClicks) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        <span className="text-xs font-medium tabular-nums">
                                            {p.total_clicks.toLocaleString("pt-BR")}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        <Badge variant="secondary" className="text-[10px] h-5">
                                            {p.unique_sessions.toLocaleString("pt-BR")}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
