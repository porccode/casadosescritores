"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";
import { Suggestion } from "@/types/admin";

/**
 * Custom hook for Admin Suggestions management.
 * Encapsulates feedback lifecycle, status updates, and deletions.
 */
export function useAdminSuggestions() {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { confirm } = useConfirm();

    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/suggestions");
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao buscar sugestões");
            }
            const data = await response.json();
            setSuggestions(data.suggestions || []);
        } catch (err: any) {
            console.error("Erro ao carregar sugestões:", err);
            setError(err.message);
            toast.error("Erro ao carregar sugestões");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSuggestions();
    }, [loadSuggestions]);

    const handleToggleRead = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch("/api/suggestions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, is_read: !currentStatus }),
            });

            if (!response.ok) throw new Error();

            setSuggestions((prev) =>
                prev.map((s) => s.id === id ? { ...s, is_read: !currentStatus } : s)
            );
            toast.success(currentStatus ? "Marcada como não lida" : "Marcada como lida");
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            toast.error("Erro ao atualizar status");
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Excluir sugestão",
            message: "Tem certeza que deseja excluir esta sugestão permanentemente?",
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await fetch("/api/suggestions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error();

            setSuggestions((prev) => prev.filter((s) => s.id !== id));
            toast.success("Sugestão excluída");
        } catch (err) {
            console.error("Erro ao excluir sugestão:", err);
            toast.error("Erro ao excluir sugestão");
        }
    };

    const handleReply = async (id: string, content: string) => {
        try {
            const response = await fetch("/api/suggestions/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ suggestion_id: id, content }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erro ao responder sugestão");
            }

            // Marcar localmente como lida, já que foi respondida
            setSuggestions((prev) =>
                prev.map((s) => s.id === id ? { ...s, is_read: true } : s)
            );
            toast.success("Resposta enviada com sucesso");
            return true;
        } catch (err: any) {
            console.error("Erro ao responder sugestão:", err);
            toast.error(err.message || "Erro ao responder sugestão");
            return false;
        }
    };

    const unreadCount = suggestions.filter((s) => !s.is_read).length;

    return {
        suggestions,
        loading,
        error,
        unreadCount,
        handleToggleRead,
        handleDelete,
        handleReply,
        refresh: loadSuggestions
    };
}
