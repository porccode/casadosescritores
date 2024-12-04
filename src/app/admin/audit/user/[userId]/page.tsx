"use client";

import { useState, useEffect, use } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
    Shield,
    Search,
    Eye,
    Info,
    ArrowLeft,
    Computer,
    User as UserIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Pagination from "@/components/Pagination";
import { cn } from "@/lib/utils";

interface AuditLog {
    id: string;
    user_id: string;
    admin_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    metadata: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    profiles: {
        username: string | null;
        avatar_url: string | null;
    };
    admin_profile?: {
        username: string | null;
        avatar_url: string | null;
    };
}

interface UserProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
}

const ITEMS_PER_PAGE = 100;

export default function UserAuditPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const searchParams = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const supabase = createBrowserClient();

    useEffect(() => {
        loadUserData();
        loadLogs();
    }, [userId, page]);

    async function loadUserData() {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, username, avatar_url, email")
                .eq("id", userId)
                .single();

            if (error) throw error;
            setUserProfile(data);
        } catch (error) {
            console.error("Erro ao carregar perfil do usuário:", error);
        }
    }

    async function loadLogs() {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await supabase
                .from("audit_logs" as any)
                .select(`
                  *,
                  profiles:user_id (username, avatar_url),
                  admin_profile:admin_id (username, avatar_url)
                `, { count: "exact" })
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            setLogs((data as any[]) || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error("Erro ao carregar auditoria:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredLogs = logs.filter(
        (log) =>
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            (log.admin_profile?.username || "").toLowerCase().includes(search.toLowerCase())
    );

    const getActionBadge = (action: string) => {
        let variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" = "outline";

        if (action.includes("created")) variant = "success";
        if (action.includes("deleted")) variant = "destructive";
        if (action.includes("updated") || action.includes("changed")) variant = "info";
        if (action.includes("awarded") || action.includes("xp")) variant = "warning";
        if (action.includes("banned") || action.includes("suspended")) variant = "destructive";

        return (
            <Badge variant={variant as any} className="text-xs">
                {action.replace(/[._]/g, " ")}
            </Badge>
        );
    };

    const getDetailedAction = (log: AuditLog) => {
        if (log.action.startsWith("xp.updated:")) {
            const reason = log.action.split(":")[1];
            const mapping: Record<string, string> = {
                "post_like": "Curtiu uma publicação",
                "reading_list_add": "Adicionou à lista de leitura",
                "post_create": "Publicou um post",
                "story_publish": "Publicou uma nova história",
                "chapter_publish": "Publicou um novo capítulo",
                "comment_publish": "Enviou um comentário",
                "playlist_create": "Criou uma playlist",
                "profile.name": "Atualizou nome/identidade",
                "profile.avatar": "Alterou foto de perfil",
                "profile.bio": "Atualizou a biografia",
                "profile.socials": "Atualizou redes sociais",
                "profile.complete": "Completou o perfil (Bônus)",
                "ai_image": "Geração de imagem IA",
                "ai_fast": "Geração rápida IA",
                "ai_detailed": "Geração detalhada IA"
            };
            return mapping[reason] || `XP: ${reason}`;
        }

        if (log.action !== "xp.updated") return <span className="text-muted-foreground italic">—</span>;

        const gain = log.metadata?.gain || 0;
        if (gain === -50) return "Geração de Capa IA";
        if (gain === -240) return "Geração Rápida IA";
        if (gain <= -700) return "Geração Detalhada IA";
        if (gain === 5 || gain === 8 || gain === 10) return "Interação Social / Leitura (Antigo)";
        if (gain > 0) return "Recompensa / Bônus";

        return "Ajuste de Sistema";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
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
            key: "action",
            header: "Ação",
            cell: (log: AuditLog) => getActionBadge(log.action),
        },
        {
            key: "details",
            header: "Detalhes",
            cell: (log: AuditLog) => (
                <span className="text-sm text-muted-foreground">
                    {getDetailedAction(log)}
                </span>
            ),
        },
        {
            key: "admin",
            header: "Admin",
            cell: (log: AuditLog) => log.admin_id ? (
                <div className="flex items-center gap-1.5">
                    <UserAvatar src={log.admin_profile?.avatar_url} size={20} className="rounded-full" />
                    <span className="text-sm font-medium">@{log.admin_profile?.username || "admin"}</span>
                </div>
            ) : <span className="text-sm text-muted-foreground">Automático</span>,
        },
        {
            key: "xp_gain",
            header: "XP",
            cell: (log: AuditLog) => {
                if (log.action.startsWith("xp.updated")) {
                    const gain = log.metadata?.gain ?? 0;
                    if (log.metadata?.blocked) {
                        return <Badge variant="secondary">Bloqueado</Badge>;
                    }
                    if (gain !== 0) {
                        return (
                            <span className={cn("text-sm font-medium font-mono", gain > 0 ? "text-green-600" : "text-red-500")}>
                                {gain > 0 ? `+${gain}` : gain} XP
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                    <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
            ),
        },
    ];

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="h-8 w-8">
                    <Link href="/admin/audit">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-xl font-semibold">Auditoria: @{userProfile?.username || "Carregando..."}</h2>
                    <p className="text-sm text-muted-foreground">Histórico completo de ações do usuário</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar neste histórico..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredLogs}
                        loading={loading}
                        getRowKey={(l) => l.id}
                    />

                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                baseUrl={`/admin/audit/user/${userId}`}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <UserAvatar src={userProfile?.avatar_url} size={80} className="rounded-full border-2 border-background" />
                                <div>
                                    <h3 className="font-semibold text-lg">@{userProfile?.username}</h3>
                                    <p className="text-sm text-muted-foreground font-mono">{userProfile?.email}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">ID do Usuário</span>
                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">{userId.slice(0, 18)}...</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total de Ações</span>
                                    <span className="font-semibold text-primary">{totalCount}</span>
                                </div>
                            </div>

                            <Button className="w-full" asChild>
                                <Link href={`/perfil/${userProfile?.username}`}>
                                    Ver Perfil Público
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle>Detalhes do Evento</DialogTitle>
                                <DialogDescription className="text-xs font-mono mt-1">
                                    ID: {selectedLog?.id}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Data</span>
                                    <p className="text-sm font-mono">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Ação</span>
                                    <div>{getActionBadge(selectedLog.action)}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Endereço IP</span>
                                    <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" /> Metadados
                                </h4>
                                <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto">
                                    <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Computer className="h-4 w-4 text-muted-foreground" /> User Agent
                                </h4>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                                        {selectedLog.user_agent}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t">
                                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
