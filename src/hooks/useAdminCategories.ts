"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ConfirmModal";
import { Category, CategoryWithStats } from "@/types/admin";
import { generateSimpleSlug } from "@/lib/utils";

/**
 * Custom hook for Admin Categories management.
 * Handles CRUD operations and cross-referencing statistics.
 */
export function useAdminCategories() {
    const [categories, setCategories] = useState<CategoryWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // UI States
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [showNewForm, setShowNewForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");

    const supabase = createBrowserClient();
    const { confirm } = useConfirm();

    const loadCategories = useCallback(async () => {
        setLoading(true);
        try {
            const { data: dbCategories, error: catError } = await (supabase as any)
                .from("categories")
                .select("*")
                .order("name");

            if (catError) throw catError;

            // Contar séries por gênero usando query agregada no banco
            const categoryNames = (dbCategories || []).map((c: any) => c.name);
            const seriesMap: Record<string, number> = {};

            if (categoryNames.length > 0) {
                // Buscar contagem agrupada — usa count com filtro no banco em vez de data dump
                const countPromises = categoryNames.map(async (name: string) => {
                    const { count } = await (supabase as any)
                        .from("series")
                        .select("*", { count: "exact", head: true })
                        .eq("genre", name);
                    return { name, count: count || 0 };
                });
                const counts = await Promise.all(countPromises);
                counts.forEach(({ name, count }) => {
                    seriesMap[name] = count;
                });
            }

            const categoriesWithStats: CategoryWithStats[] = (dbCategories || []).map((cat: any) => ({
                ...cat,
                seriesCount: seriesMap[cat.name] || 0,
            }));

            setCategories(categoriesWithStats);
        } catch (err: any) {
            console.error("Erro ao carregar categorias:", err);
            toast.error("Erro ao carregar categorias");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleCreate = async () => {
        if (!newName.trim()) {
            toast.error("Nome da categoria é obrigatório");
            return;
        }

        setSaving(true);
        try {
            const { error } = await (supabase as any).from("categories").insert({
                name: newName.trim(),
                slug: generateSimpleSlug(newName),
                description: newDescription.trim() || null,
            });

            if (error) throw error;

            toast.success("Categoria criada com sucesso!");
            setNewName("");
            setNewDescription("");
            setShowNewForm(false);
            loadCategories();
        } catch (err: any) {
            console.error("Erro ao criar categoria:", err);
            toast.error(err.message || "Erro ao criar categoria");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) {
            toast.error("Nome da categoria é obrigatório");
            return;
        }

        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from("categories")
                .update({
                    name: editName.trim(),
                    slug: generateSimpleSlug(editName),
                    description: editDescription.trim() || null,
                })
                .eq("id", id);

            if (error) throw error;

            toast.success("Categoria atualizada com sucesso!");
            setEditingId(null);
            loadCategories();
        } catch (err: any) {
            console.error("Erro ao atualizar categoria:", err);
            toast.error(err.message || "Erro ao atualizar categoria");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat: Category) => {
        const confirmed = await confirm({
            title: "Excluir categoria",
            message: `Tem certeza que deseja excluir a categoria "${cat.name}"?\n\nPublicações que usam esta categoria não serão afetadas, mas a categoria não aparecerá mais na lista de seleção.`,
            confirmText: "Excluir",
            type: "danger",
        });

        if (!confirmed) return;

        setSaving(true);
        try {
            const { error } = await (supabase as any).from("categories").delete().eq("id", cat.id);

            if (error) throw error;

            toast.success("Categoria excluída com sucesso!");
            loadCategories();
        } catch (err: any) {
            console.error("Erro ao excluir categoria:", err);
            toast.error(err.message || "Erro ao excluir categoria");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditDescription(cat.description || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditDescription("");
    };

    return {
        categories,
        loading,
        saving,
        editingId,
        editName,
        setEditName,
        editDescription,
        setEditDescription,
        showNewForm,
        setShowNewForm,
        newName,
        setNewName,
        newDescription,
        setNewDescription,
        handleCreate,
        handleUpdate,
        handleDelete,
        startEdit,
        cancelEdit,
        loadCategories
    };
}
