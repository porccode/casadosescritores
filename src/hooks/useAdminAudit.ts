"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { AuditLog } from "@/types/admin";

const ITEMS_PER_PAGE = 100;

/**
 * Custom hook for Admin Audit logic.
 * Handles fetching, pagination, filtering, and semantic action mapping.
 */
export function useAdminAudit(page: number) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const supabase = createBrowserClient();

    const loadLogs = useCallback(async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await supabase
                .from("audit_logs" as any)
                .select(`
                  *,
                  profiles:user_id (username, avatar_url, id),
                  admin_profile:admin_id (username, avatar_url)
                `, { count: "exact" })
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
    }, [page, supabase]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const filteredLogs = useMemo(() => {
        if (!search) return logs;
        const s = search.toLowerCase();
        return logs.filter(
            (log) =>
                log.action.toLowerCase().includes(s) ||
                (log.profiles?.username || "").toLowerCase().includes(s) ||
                (log.admin_profile?.username || "").toLowerCase().includes(s)
        );
    }, [logs, search]);

    /**
     * Maps raw database actions to human-readable Portuguese descriptions.
     */
    const getDetailedAction = (log: AuditLog) => {
        const actionTypeDescriptions: Record<string, string> = {
            "post_like": "Curtiu um post",
            "post_create": "Publicou um novo post",
            "post_comment": "Comentou em um post",
            "chapter_publish": "Publicou um novo capítulo",
            "chapter_create": "Criou um capítulo",
            "series_create": "Criou uma nova série",
            "content_save": "Salvou na biblioteca",
            "reading_list_add": "Adicionou à lista de leitura",
            "comment_publish": "Publicou um comentário",
            "comment_create": "Enviou um comentário",
            "profile.update": "Atualizou o perfil",
            "profile.name": "Atualizou nome/identidade",
            "profile.avatar": "Alterou foto de perfil",
            "profile.bio": "Atualizou a biografia",
            "profile.socials": "Atualizou redes sociais",
            "profile.complete": "Completou o perfil (Bônus)",
            "playlist_create": "Criou uma playlist",
            "ai_image": "Geração de imagem IA",
            "ai_fast": "Geração rápida IA",
            "ai_detailed": "Geração detalhada IA"
        };

        if (log.action === "xp.gained") {
            const type = log.metadata?.action_type;
            const desc = log.metadata?.description;
            if (desc) return desc;
            if (type && actionTypeDescriptions[type]) return actionTypeDescriptions[type];
            return type ? `XP por: ${type.replace(/_/g, " ")}` : "Ganho de XP";
        }

        if (log.action.startsWith("xp.updated")) {
            if (log.metadata?.description) return log.metadata.description;
            const reason = log.action.split(":")[1];
            if (reason && actionTypeDescriptions[reason]) return actionTypeDescriptions[reason];

            const gain = log.metadata?.gain || 0;
            if (gain === -50) return "Gerou Capa com IA (-50 XP)";
            if (gain === -240) return "Gerou Capítulo Rápido com IA (-240 XP)";
            if (gain <= -700) return `Gerou Capítulo Detalhado com IA (${gain} XP)`;

            const xpValueMapping: Record<number, string> = {
                1: "Interação básica", 3: "Votou em comentário", 5: "Curtiu post / Atualizou perfil",
                8: "Salvou conteúdo na biblioteca", 10: "Publicou um post", 15: "Comentou em conteúdo",
                20: "Adicionou à playlist", 30: "Publicou um capítulo", 35: "Completou o perfil (Bônus)",
                50: "Criou uma série"
            };
            if (gain > 0 && xpValueMapping[gain]) return `${xpValueMapping[gain]} (+${gain} XP)`;
            return gain > 0 ? `Ação recompensada (+${gain} XP)` : "Ajuste de XP";
        }

        if (log.action === "xp.blocked") {
            const type = log.metadata?.action_type;
            return `XP bloqueado (ação repetida): ${type?.replace(/_/g, " ") || ""}`;
        }

        if (log.action.startsWith("chapter.")) {
            const title = log.metadata?.title || log.metadata?.chapter_title || "Sem título";
            if (log.action === "chapter.created") return `Criou o capítulo ${title}`;
            if (log.action === "chapter.updated") return `Atualizou o capítulo ${title}`;
            if (log.action === "chapter.deleted") return `Excluiu o capítulo ${title}`;
        }

        if (log.action === "comment.created") {
            const content = log.metadata?.content_title || log.metadata?.chapter_title || "conteúdo";
            const type = log.metadata?.content_type === 'series' ? 'série' : 'capítulo';
            return `Comentou em ${type}: ${content}`;
        }

        return log.action.replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    };

    /**
     * Returns a colored badge variant based on the action type.
     */
    const getActionBadge = useCallback((action: string) => {
        let variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" = "outline";

        if (action.includes("created")) variant = "success";
        if (action.includes("deleted")) variant = "destructive";
        if (action.includes("updated") || action.includes("changed")) variant = "info";
        if (action.includes("awarded") || action.includes("xp")) variant = "warning";
        if (action.includes("banned") || action.includes("suspended")) variant = "destructive";

        return variant;
    }, []);

    return {
        logs: filteredLogs,
        totalCount,
        loading,
        search,
        setSearch,
        selectedLog,
        setSelectedLog,
        getDetailedAction,
        getActionBadge,
        itemsPerPage: ITEMS_PER_PAGE
    };
}
