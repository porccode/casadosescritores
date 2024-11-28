"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { AdminUser } from "@/types/admin";
import { useConfirm } from "@/components/ConfirmModal";
import { toast } from "@/lib/toast";
import { getEffectiveRole } from "@/lib/roles";

const ITEMS_PER_PAGE = 100;

/**
 * Custom hook for Admin User management.
 * Handles fetching, updating XP, editing profiles, and account deletion.
 */
export function useAdminUsers(page: number) {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [saving, setSaving] = useState(false);

    // XP editing states
    const [editingXpId, setEditingXpId] = useState<string | null>(null);
    const [editingXpValue, setEditingXpValue] = useState<number>(0);
    const [savingXp, setSavingXp] = useState(false);

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from("profiles")
                .select("*", { count: "exact" })
                .neq("account_status", "deleted");

            if (search.trim()) {
                query = query.or(
                    `username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
                );
            }

            const { data, error, count } = await query
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            setUsers((data || []).map((u: any) => ({
                id: u.id,
                username: u.username,
                email: u.email,
                first_name: u.first_name,
                last_name: u.last_name,
                role: getEffectiveRole(u),
                created_at: u.created_at,
                avatar_url: u.avatar_url,
                xp: u.xp || 0,
                level: u.level || 1,
            })));
            if (count !== null) setTotalCount(count);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            toast.error("Erro ao carregar lista de usuários");
        } finally {
            setLoading(false);
        }
    }, [page, search, supabase]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // O filtro no cliente foi removido, a busca agora é feita no servidor.

    const updateXp = async (user: AdminUser, newValue: number) => {
        setSavingXp(true);
        try {
            const response = await fetch("/api/admin/update-xp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    xp: newValue,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao atualizar XP");
            }

            const newLevel = Math.floor(Math.sqrt(newValue / 100)) + 1;

            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, xp: newValue, level: newLevel } : u))
            );
            setEditingXpId(null);
            toast.success("XP atualizado com sucesso");
        } catch (error: any) {
            console.error("Erro ao atualizar XP:", error);
            toast.error(`Erro ao atualizar XP: ${error.message}`);
        } finally {
            setSavingXp(false);
        }
    };

    const handleUpdateUser = async (user: AdminUser) => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/update-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao atualizar");
            }

            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? user : u))
            );
            setEditingUser(null);
            toast.success("Usuário atualizado com sucesso");
        } catch (error: any) {
            console.error("Erro ao atualizar usuário:", error);
            toast.error(error.message || "Erro ao atualizar usuário");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (user.role === "admin") {
            await confirm({
                title: "Ação não permitida",
                message: "Não é possível excluir um administrador diretamente por aqui.",
                confirmText: "Entendi",
                type: "warning",
            });
            return;
        }

        const confirmed = await confirm({
            title: "Excluir usuário",
            message: `Tem certeza que deseja excluir "${user.username || user.email}"?\n\nEsta ação marcará a conta para exclusão definitiva em 30 dias.`,
            confirmText: "Excluir (Soft Delete)",
            type: "danger",
        });

        if (!confirmed) return;

        try {
            const response = await fetch("/api/admin/delete-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao excluir");
            }

            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            toast.success("Usuário marcado para exclusão");
        } catch (error: any) {
            console.error("Erro ao excluir usuário:", error);
            toast.error(error.message || "Erro ao excluir usuário");
        }
    };

    return {
        users,
        totalCount,
        loading,
        search,
        setSearch,
        editingUser,
        setEditingUser,
        saving,
        editingXpId,
        setEditingXpId,
        editingXpValue,
        setEditingXpValue,
        savingXp,
        updateXp,
        handleUpdateUser,
        handleDeleteUser,
        itemsPerPage: ITEMS_PER_PAGE
    };
}
