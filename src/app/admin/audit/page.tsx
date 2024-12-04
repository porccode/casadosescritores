"use client";

import React from "react";
import { Search, Shield, Eye, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/Pagination";
import { cn } from "@/lib/utils";
import { useAdminAudit } from "@/hooks/useAdminAudit";
import { AuditLogDetails } from "@/components/admin/AuditLogDetails";
import { AuditLog } from "@/types/admin";

export default function AuditPage() {
    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;

    const {
        logs,
        totalCount,
        loading,
        search,
        setSearch,
        selectedLog,
        setSelectedLog,
        getDetailedAction,
        getActionBadge,
        itemsPerPage
    } = useAdminAudit(page);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const columns = [
        {
            key: "timestamp",
            header: "Data / Hora",
            cell: (log: AuditLog) => (
                <div className="flex flex-col">
                    <span className="text-sm tabular-nums">{formatDate(log.created_at)}</span>
                    <span className="text-xs text-muted-foreground font-mono">{log.id.slice(0, 8)}</span>
                </div>
            ),
        },
        {
            key: "actors",
            header: "Usuário",
            cell: (log: AuditLog) => (
                <div className="flex items-center gap-2">
                    {log.admin_id && (
                        <>
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-muted rounded-md">
                                <UserAvatar src={log.admin_profile?.avatar_url} size={18} className="rounded-full" />
                                <span className="text-xs text-muted-foreground">@{log.admin_profile?.username || "admin"}</span>
                            </div>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                        </>
                    )}
                    <Link
                        href={`/admin/audit/user/${log.user_id}`}
                        className="flex items-center gap-1.5 hover:bg-muted/50 p-1 rounded-md transition-colors"
                    >
                        <UserAvatar src={log.profiles?.avatar_url} size={22} className="rounded-full" />
                        <span className="text-sm font-medium hover:text-primary transition-colors">
                            @{log.profiles?.username || "usuário"}
                        </span>
                    </Link>
                </div>
            ),
        },
        {
            key: "action",
            header: "Ação",
            cell: (log: AuditLog) => (
                <Badge
                    variant={getActionBadge(log.action)}
                    className={cn(
                        "text-xs",
                        log.action.includes("deleted") && "bg-destructive/10 text-destructive border-destructive/20",
                        log.action.includes("created") && "bg-green-500/10 text-green-600 border-green-500/20",
                        log.action.includes("updated") && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    )}
                >
                    {log.action.replace(/[._]/g, " ")}
                </Badge>
            ),
        },
        {
            key: "details",
            header: "Detalhes",
            cell: (log: AuditLog) => (
                <span className="text-sm text-muted-foreground line-clamp-1">
                    {getDetailedAction(log)}
                </span>
            ),
        },
        {
            key: "xp_gain",
            header: "XP",
            cell: (log: AuditLog) => {
                if (log.action.startsWith("xp.updated") || log.action.includes("xp")) {
                    const gain = log.metadata?.gain ?? 0;
                    if (log.metadata?.blocked) {
                        return <Badge variant="secondary">Bloqueado</Badge>;
                    }
                    if (gain !== 0) {
                        return (
                            <span className={cn("text-sm font-medium font-mono", gain > 0 ? "text-green-600" : "text-red-500")}>
                                {gain > 0 ? "+" : ""}{gain} XP
                            </span>
                        );
                    }
                }
                return <span className="text-muted-foreground">—</span>;
            }
        },
        {
            key: "actions",
            header: <span className="sr-only">Ver</span>,
            className: "text-right w-10",
            cell: (log: AuditLog) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedLog(log)}
                >
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
            ),
        },
    ];

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Auditoria"
                description={`Monitorando ${totalCount.toLocaleString()} eventos no sistema.`}
                action={
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar registros..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                }
            />

            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                getRowKey={(l) => l.id}
                emptyState={
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="h-8 w-8 text-muted-foreground/40" />
                        <h3 className="text-base font-semibold mt-4">Nenhum evento encontrado</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Nenhum evento de auditoria corresponde aos critérios atuais.
                        </p>
                    </div>
                }
            />

            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        baseUrl="/admin/audit"
                    />
                </div>
            )}

            <AuditLogDetails
                log={selectedLog}
                open={!!selectedLog}
                onOpenChange={(open) => !open && setSelectedLog(null)}
                getActionBadgeVariant={(a) => getActionBadge(a)}
            />
        </div>
    );
}
