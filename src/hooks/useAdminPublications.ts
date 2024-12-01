"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";
import { Publication } from "@/types/admin";

const ITEMS_PER_PAGE = 100;

/**
 * Custom hook for Admin Publications management.
 * Handles content lifecycle, metric manipulation, and server-side filtering.
 */
export function useAdminPublications(page: number) {
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState("");

    // Metric Editing States
    const [editingViewId, setEditingViewId] = useState<string | null>(null);
    const [editingViewValue, setEditingViewValue] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    // Sort States
    const [sortDescending, setSortDescending] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'archived'>('published');

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const loadPublications = useCallback(async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            // Cast to any after select to prevent TypeScript "type instantiation is excessively deep" error
            // This is a known limitation of Supabase's generic chaining with multiple .eq() calls
            let query = (supabase as any)
                .from("series")
                .select("id, title, view_count, is_completed, is_archived, is_draft, created_at, genre, author_id, cover_url, chapter_count, slug", { count: "exact" });

            // Status filtering
            if (statusFilter === 'archived') {
                query = query.eq('is_archived', true);
            } else if (statusFilter === 'draft') {
                query = query.eq('is_archived', false).eq('is_draft', true);
            } else {
                // published
                query = query.eq('is_archived', false).eq('is_draft', false);
            }

            // Server-side filtering
            if (search.trim()) {
                query = query.ilike("title", `%${search}%`);
            }

            // Server-side sorting
            const { data: series, error: seriesError, count } = await query
                .order("view_count", { ascending: !sortDescending })
                .order("created_at", { ascending: false })
                .range(from, to);

            if (seriesError) throw seriesError;

            if (count !== null) setTotalCount(count);

            if (!series || series.length === 0) {
                setPublications([]);
                return;
            }

            // Fetch profiles to map usernames
            const authorIds = [...new Set(series.map((s: any) => s.author_id))] as string[];
            const { data: authors } = await (supabase as any)
                .from("profiles")
                .select("id, username, first_name, last_name")
                .in("id", authorIds);

            const profileMap: Record<string, { username: string; name: string; email: string }> = {};
            authors?.forEach((p: any) => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Desconhecido";
                profileMap[p.id] = {
                    username: p.username || "Desconhecido",
                    name,
                    email: p.email || "",
                };
            });

            const items: Publication[] = series.map((s: any) => {
                const profile = profileMap[s.author_id] || { username: "Desconhecido", name: "Desconhecido", email: "" };
                return {
                    id: s.id,
                    title: s.title,
                    author_username: profile.username,
                    author_name: profile.name,
                    author_email: profile.email,
                    view_count: s.view_count || 0,
                    is_completed: s.is_completed || false,
                    is_archived: s.is_archived || false,
                    is_draft: s.is_draft || false,
                    created_at: s.created_at,
                    genre: s.genre || undefined,
                    cover_url: s.cover_url || null,
                    chapter_count: s.chapter_count || 0,
                    slug: s.slug || undefined,
                };
            });

            setPublications(items);
        } catch (error: any) {
            console.error("Erro ao carregar publicações:", error);
            toast.error("Erro ao carregar publicações");
        } finally {
            setLoading(false);
        }
    }, [supabase, page, search, statusFilter, sortDescending]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadPublications();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [loadPublications]);

    const handleUpdateViewCount = async (pub: Publication) => {
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from("series")
                .update({ view_count: editingViewValue })
                .eq("id", pub.id);

            if (error) throw error;

            setPublications((prev) =>
                prev.map((p) =>
                    p.id === pub.id ? { ...p, view_count: editingViewValue } : p
                )
            );
            setEditingViewId(null);
            toast.success("Métricas atualizadas");
        } catch (error: any) {
            console.error("Erro ao atualizar visualizações:", error);
            toast.error("Erro ao atualizar métricas");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (pub: Publication) => {
        const confirmed = await confirm({
            title: "Excluir série",
            message: `Tem certeza que deseja excluir "${pub.title}"? Isso também excluirá todos os capítulos e interações relacionadas permanentemente.`,
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await fetch("/api/series/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seriesId: pub.id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao excluir série");
            }

            setPublications((prev) => prev.filter((p) => p.id !== pub.id));
            toast.success("Série removida com sucesso");
        } catch (error: any) {
            console.error("Erro ao excluir:", error);
            toast.error(error.message || "Erro ao remover série");
        }
    };

    const toggleSort = () => {
        setSortDescending(!sortDescending);
    };

    const startEditingViews = (pub: Publication) => {
        setEditingViewId(pub.id);
        setEditingViewValue(pub.view_count);
    };

    return {
        publications,
        loading,
        totalCount,
        search,
        setSearch,
        editingViewId,
        setEditingViewId,
        editingViewValue,
        setEditingViewValue,
        saving,
        sortDescending,
        toggleSort,
        statusFilter,
        setStatusFilter,
        handleUpdateViewCount,
        handleDelete,
        startEditingViews,
        itemsPerPage: ITEMS_PER_PAGE
    };
}
