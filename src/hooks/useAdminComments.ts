"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";

export interface AdminComment {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    author: {
        username: string;
    } | null;
    series: {
        id: string;
        title: string;
        slug: string | null;
    } | null;
    chapters: {
        id: string;
        title: string;
        slug: string | null;
    } | null;
    announcements: {
        id: string;
        title: string;
    } | null;
}

export type CommentFilter = "all" | "chapters" | "series" | "announcements";

const COMMENTS_PER_PAGE = 100;

export function useAdminComments(page: number, search: string = "", filter: CommentFilter = "all") {
    const [comments, setComments] = useState<AdminComment[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Armazena a query atual pra não piscar dados velhos
    const [currentQuery, setCurrentQuery] = useState({ page, search, filter });
    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const from = (page - 1) * COMMENTS_PER_PAGE;
            const to = from + COMMENTS_PER_PAGE - 1;

            let query = supabase
                .from('comments')
                .select(`
                    id, 
                    text, 
                    author_id, 
                    series_id, 
                    chapter_id, 
                    announcement_id,
                    created_at,
                    author:profiles!author_id(username),
                    series:series!series_id(id, title, slug),
                    chapters:chapters!chapter_id(id, title, slug),
                    announcements:announcements!announcement_id(id, title)
                `, { count: 'exact' });

            // Apply Context Filters
            if (filter === "chapters") query = query.not('chapter_id', 'is', null);
            if (filter === "series") query = query.not('series_id', 'is', null);
            if (filter === "announcements") query = query.not('announcement_id', 'is', null);

            // A forma mais segura de buscar no texto principal
            if (search.trim()) {
                // Removemos o OR complexo e filtramos apenas pelo texto do comentário para busca do servidor.
                // Para busca de autor nativa, precisaríamos de uma View.
                query = query.ilike('text', `%${search}%`);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            setComments(data as unknown as AdminComment[]);
            setTotalCount(count || 0);
            setCurrentQuery({ page, search, filter });
        } catch (error: any) {
            console.error("Erro ao buscar comentários:", error);
            toast.error("Erro ao carregar interações");
        } finally {
            setLoading(false);
        }
    }, [supabase, page, search, filter]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleDelete = async (commentId: string) => {
        const confirmed = await confirm({
            title: "Excluir comentário",
            message: "Tem certeza que deseja remover esta interação? Esta ação não pode ser desfeita.",
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;

            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setTotalCount((prev) => prev - 1);
            toast.success("Interação removida");
        } catch (error: any) {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao remover comentário");
        }
    };

    const handleBulkDelete = async (commentIds: string[]) => {
        if (!commentIds.length) return false;

        const confirmed = await confirm({
            title: `Excluir ${commentIds.length} comentários`,
            message: `Tem certeza que deseja remover as ${commentIds.length} interações selecionadas? Esta ação não pode ser desfeita.`,
            confirmText: "Excluir Todos",
            type: "danger",
        });

        if (!confirmed) return false;

        try {
            const { error } = await supabase
                .from("comments")
                .delete()
                .in("id", commentIds);

            if (error) throw error;

            setComments((prev) => prev.filter((c) => !commentIds.includes(c.id)));
            setTotalCount((prev) => prev - commentIds.length);
            toast.success(`${commentIds.length} interações removidas`);
            return true;
        } catch (error: any) {
            console.error("Erro ao excluir em massa:", error);
            toast.error("Erro ao remover comentários");
            return false;
        }
    };

    return {
        comments,
        totalCount,
        isLoading: loading || (currentQuery.page !== page || currentQuery.search !== search || currentQuery.filter !== filter),
        handleDelete,
        handleBulkDelete,
        refresh: fetchComments,
        itemsPerPage: COMMENTS_PER_PAGE
    };
}
