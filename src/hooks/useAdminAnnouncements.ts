"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";
import { Database } from "@/types/database.types";

/**
 * Announcement type from Database types.
 */
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

/**
 * Custom hook for Admin Announcements management.
 * Merges system-wide banners with editorial communications.
 */
export function useAdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);

        // 1. Fetch System Announcements
        const { data: systemAnnouncements, error } = await (supabase as any)
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching system announcements:", error);
            toast.error("Erro ao carregar anúncios de sistema");
        }

        // 2. Fetch Editorial Announcements (Stories)
        let editorialAnnouncements: any[] = [];
        try {
            const { data: series } = await (supabase as any)
                .from("series")
                .select("id")
                .eq("title", "Comunicados Oficiais")
                .maybeSingle();

            if (series) {
                const { data: stories } = await (supabase as any)
                    .from("stories")
                    .select("id, title, created_at, is_published, is_pinned")
                    .eq("series_id", series.id)
                    .order("created_at", { ascending: false });

                if (stories) {
                    editorialAnnouncements = (stories as any[]).map(story => ({
                        id: story.id,
                        title: story.title,
                        created_at: story.created_at,
                        start_date: story.created_at,
                        end_date: null,
                        is_active: story.is_published,
                        type: 'editorial', // Feed / Artigo
                        background_color: '#ffffff',
                        text_color: '#000000',
                        priority: 0,
                        is_pinned: story.is_pinned || false
                    }));
                }
            }
        } catch (err) {
            console.error("Error fetching editorial announcements:", err);
        }

        // 3. Merge and Sort
        const allItems = [...(systemAnnouncements || []), ...editorialAnnouncements].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setAnnouncements(allItems as Announcement[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
         
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleDelete = async (id: string, title: string) => {
        const confirmed = await confirm({
            title: "Excluir anúncio",
            message: `Tem certeza que deseja excluir "${title}"?`,
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        const { error } = await (supabase as any)
            .from("announcements")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Erro ao excluir anúncio");
        } else {
            toast.success("Anúncio excluído com sucesso");
            fetchAnnouncements();
        }
    };

    const handleTogglePin = async (id: string, currentPinStatus: boolean, isEditorial: boolean) => {
        if (!isEditorial) return; // Banners não são fixáveis na interface atual

        try {
            // Sincroniza o Pin tanto no Story (gerenciamento) quanto no Chapter (exibição na Home)
            await (supabase as any).from("stories").update({ is_pinned: !currentPinStatus }).eq("id", id);
            await (supabase as any).from("chapters").update({ is_pinned: !currentPinStatus }).eq("id", id);
            
            toast.success(!currentPinStatus ? "Editorial fixado no topo!" : "Editorial desfixado.");
            fetchAnnouncements();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar destaque.");
        }
    };

    const getStatusInfo = (announcement: Announcement) => {
        if (!announcement.is_active) return { label: "Inativo", variant: "secondary" as const };

        const now = new Date();
        const start = new Date(announcement.start_date);
        const end = announcement.end_date ? new Date(announcement.end_date) : null;

        if (start > now) return { label: "Agendado", variant: "info" as const };
        if (end && end < now) return { label: "Expirado", variant: "destructive" as const };
        return { label: "Publicado", variant: "success" as const };
    };

    return {
        announcements,
        loading,
        isModalOpen,
        setIsModalOpen,
        editingAnnouncement,
        setEditingAnnouncement,
        fetchAnnouncements,
        handleDelete,
        handleTogglePin,
        getStatusInfo
    };
}
