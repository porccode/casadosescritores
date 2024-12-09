"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { AdminUser } from "@/types/admin";
import { useConfirm } from "@/components/ConfirmModal";
import { toast } from "@/lib/toast";
import { getEffectiveRole } from "@/lib/roles";

const ITEMS_PER_PAGE = 50;

export interface DeletedAdminUser extends AdminUser {
    deleted_at: string;
    deletion_scheduled_at: string;
}

export function useDeletedUsers(page: number) {
    const [users, setUsers] = useState<DeletedAdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [totalCount, setTotalCount] = useState(0);

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, error, count } = await supabase
                .from("profiles")
                .select("*", { count: "exact" })
                .eq("account_status", "deleted")
                .order("deleted_at", { ascending: false })
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
                deleted_at: u.deleted_at,
                deletion_scheduled_at: u.deletion_scheduled_at
            })));
            if (count !== null) setTotalCount(count);
        } catch (error) {
            console.error("Erro ao carregar usuários deletados:", error);
            toast.error("Erro ao carregar lista de deletados");
        } finally {
            setLoading(false);
        }
    }, [page, supabase]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        if (!search) return users;
        const s = search.toLowerCase();
        return users.filter(
            (user) =>
                (user.username || "").toLowerCase().includes(s) ||
                user.email.toLowerCase().includes(s)
        );
    }, [users, search]);

    const handleRestoreUser = async (user: DeletedAdminUser) => {
        const confirmed = await confirm({
            title: "Restaurar usuário",
            message: `Deseja restaurar a conta de "${user.username || user.email}"? O usuário poderá acessar o sistema novamente.`,
            confirmText: "Restaurar",
            type: "info",
        });

        if (!confirmed) return;

        try {
            const response = await fetch("/api/admin/restore-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao restaurar");
            }

            setUsers((prev) => prev.filter((u) => u.id !== user.id));
            toast.success("Usuário restaurado com sucesso");
        } catch (error: any) {
            console.error("Erro ao restaurar usuário:", error);
            toast.error(error.message || "Erro ao restaurar usuário");
        }
    };

    return {
        users: filteredUsers,
        totalCount,
        loading,
        search,
        setSearch,
        handleRestoreUser,
        itemsPerPage: ITEMS_PER_PAGE
    };
}
