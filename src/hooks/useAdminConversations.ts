"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";
import { AdminConversation, AdminMessage } from "@/types/admin";

/**
 * Custom hook for Admin Conversations (Direct Messages) monitoring.
 * Provides real-time visibility into user-to-user interactions, including:
 * - Conversation occupancy and status.
 * - Live message stream via Postgres changes.
 * - Thread lifecycle management (archival/deletion).
 */
export function useAdminConversations() {
    const [conversations, setConversations] = useState<AdminConversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<AdminConversation | null>(null);
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const fetchConversations = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from("conversations")
                .select(`
                    *,
                    user1:user1_id(id, username, first_name, avatar_url),
                    user2:user2_id(id, username, first_name, avatar_url)
                `)
                .order("updated_at", { ascending: false });

            if (error) throw error;
            setConversations(data as unknown as AdminConversation[]);
        } catch (error: any) {
            console.error("Erro ao carregar conversas:", error);
            toast.error("Erro ao carregar lista de diálogos");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("conversation_id", conversationId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data as unknown as AdminMessage[]);
        } catch (error: any) {
            console.error("Erro ao carregar mensagens:", error);
            toast.error("Erro ao recuperar histórico");
        }
    }, [supabase]);

    useEffect(() => {
        fetchConversations();

        const channel = supabase
            .channel("admin_messaging_global")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                () => fetchConversations()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConversations, supabase]);

    const selectConversation = (conv: AdminConversation) => {
        setActiveConversation(conv);
        fetchMessages(conv.id);
        setMobileView("chat");
    };

    const handleDeleteConversation = async (id: string) => {
        const confirmed = await confirm({
            title: "Remover Diálogo",
            message: "Tem certeza que deseja excluir esta conversa permanentemente? Esta ação é irreversível.",
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from("conversations")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (activeConversation?.id === id) {
                setActiveConversation(null);
                setMessages([]);
                setMobileView("list");
            }
            toast.success("Diálogo removido com sucesso");
        } catch (error: any) {
            console.error("Erro ao deletar diálogo:", error);
            toast.error("Falha ao remover diálogo");
        }
    };

    const filteredConversations = conversations.filter((conv) => {
        const query = searchQuery.toLowerCase();
        return (
            conv.user1.username.toLowerCase().includes(query) ||
            conv.user2.username.toLowerCase().includes(query) ||
            (conv.user1.first_name || "").toLowerCase().includes(query) ||
            (conv.user2.first_name || "").toLowerCase().includes(query)
        );
    });

    return {
        conversations: filteredConversations,
        activeConversation,
        messages,
        loading,
        searchQuery,
        setSearchQuery,
        mobileView,
        setMobileView,
        selectConversation,
        handleDeleteConversation,
        refresh: fetchConversations
    };
}
