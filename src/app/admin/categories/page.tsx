"use client";

import React from "react";
import { Tags, Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import { CategoryWithStats, Category } from "@/types/admin";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const {
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
    cancelEdit
  } = useAdminCategories();

  const columns = [
    {
      key: "name",
      header: "Nome",
      cell: (cat: CategoryWithStats) =>
        editingId === cat.id ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8"
            placeholder="Nome da categoria"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium">{cat.name}</span>
        ),
    },
    {
      key: "description",
      header: "Descrição",
      cell: (cat: CategoryWithStats) =>
        editingId === cat.id ? (
          <Input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Descrição opcional..."
            className="h-8"
          />
        ) : (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {cat.description || "Sem descrição"}
          </span>
        ),
    },
    {
      key: "series",
      header: "Séries",
      cell: (cat: CategoryWithStats) => (
        <Badge variant="secondary" className="tabular-nums">
          {cat.seriesCount}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-24",
      cell: (cat: CategoryWithStats) => (
        <div className="flex items-center justify-end gap-1">
          {editingId === cat.id ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdate(cat.id)}
                disabled={saving}
                className="h-8 w-8"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelEdit}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(cat)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(cat as Category)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Gerencie as categorias de classificação literária."
        action={
          <Button
            onClick={() => setShowNewForm(true)}
            size="sm"
            disabled={showNewForm}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        }
      />

      {showNewForm && (
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tags className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Nova Categoria</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Realismo Mágico"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descrição opcional..."
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCreate}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewForm(false);
                setNewName("");
                setNewDescription("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        getRowKey={(cat) => cat.id}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tags className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mt-4">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Crie a primeira categoria para organizar o acervo literário.
            </p>
            <Button onClick={() => setShowNewForm(true)} variant="outline" size="sm" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        }
      />
    </div>
  );
}
