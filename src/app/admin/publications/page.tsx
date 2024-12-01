"use client";

import React from "react";
import {
  Search,
  Loader2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Check,
  BookOpen,
  ArrowUpDown,
  X,
  Copy,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";
import { toast } from "@/lib/toast";
import Pagination from "@/components/Pagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminPublications } from "@/hooks/useAdminPublications";
import { Publication } from "@/types/admin";
import { format } from "date-fns";

/**
 * Página de Publicações (Admin).
 *
 * Lista todas as séries com busca, ordenação por views,
 * edição inline de visualizações e ações rápidas.
 */
export default function PublicationsPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const {
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
    itemsPerPage,
  } = useAdminPublications(page);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copiado!");
  };

  const columns = [
    {
      key: "title",
      header: "Série",
      cell: (pub: Publication) => {
        const href = `/series/${pub.slug || generateSlug(pub.title, pub.id)}`;
        return (
          <Link
            href={href}
            target="_blank"
            className="font-medium text-foreground hover:underline truncate max-w-[280px] block"
          >
            {pub.title}
          </Link>
        );
      },
    },
    {
      key: "author",
      header: "Autor",
      cell: (pub: Publication) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{pub.author_name}</span>
          {pub.author_email && (
            <button
              onClick={() => copyEmail(pub.author_email)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-left group/email"
            >
              <span className="truncate max-w-[180px]">{pub.author_email}</span>
              <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover/email:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "views",
      header: (
        <Button
          variant="ghost"
          onClick={toggleSort}
          className="-ml-4 h-8 gap-2"
        >
          Visualizações
          <ArrowUpDown className={sortDescending ? "h-3.5 w-3.5 text-primary" : "h-3.5 w-3.5"} />
        </Button>
      ),
      cell: (pub: Publication) => (
        <div className="flex items-center">
          {editingViewId === pub.id ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editingViewValue}
                onChange={(e) =>
                  setEditingViewValue(parseInt(e.target.value) || 0)
                }
                className="w-24 h-8"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUpdateViewCount(pub)}
                disabled={saving}
                className="h-8 w-8"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingViewId(null)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => startEditingViews(pub)}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 -m-1 rounded-md transition-colors"
            >
              <span className="text-sm font-medium tabular-nums">
                {pub.view_count.toLocaleString("pt-BR")}
              </span>
              <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (pub: Publication) => {
        if (pub.is_archived) {
            return <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium">Arquivado</Badge>;
        }
        if (pub.is_draft) {
            return <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50 font-medium">Rascunho</Badge>;
        }
        if (pub.is_completed) {
            return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-medium border border-emerald-200">Concluída</Badge>;
        }
        return <Badge variant="default" className="bg-primary text-primary-foreground font-medium">Em Andamento</Badge>;
      },
    },
    {
      key: "date",
      header: "Criação",
      cell: (pub: Publication) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {format(new Date(pub.created_at), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right",
      cell: (pub: Publication) => {
        const href = `/series/${pub.slug || generateSlug(pub.title, pub.id)}`;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={href} target="_blank" className="cursor-pointer gap-2">
                  <Eye className="h-4 w-4" /> Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/escrever?action=edit&type=series&id=${pub.id}`}
                  className="cursor-pointer gap-2"
                >
                  <Edit className="h-4 w-4" /> Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(pub)}
                className="text-destructive focus:text-destructive cursor-pointer gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Publicações"
        description={`Gerenciando as séries na plataforma.`}
        action={
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <Tabs defaultValue="published" value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)} className="w-full">
        <div className="flex items-center justify-between mb-4">
            <TabsList>
                <TabsTrigger value="published">Publicados {statusFilter === 'published' && <span className="ml-2 text-xs bg-muted/60 px-2 py-0.5 rounded-full min-w-[24px] inline-flex items-center justify-center">{loading ? <Loader2 className="h-3 w-3 animate-spin" /> : totalCount}</span>}</TabsTrigger>
                <TabsTrigger value="draft">Rascunhos {statusFilter === 'draft' && <span className="ml-2 text-xs bg-muted/60 px-2 py-0.5 rounded-full min-w-[24px] inline-flex items-center justify-center">{loading ? <Loader2 className="h-3 w-3 animate-spin" /> : totalCount}</span>}</TabsTrigger>
                <TabsTrigger value="archived">Arquivados {statusFilter === 'archived' && <span className="ml-2 text-xs bg-muted/60 px-2 py-0.5 rounded-full min-w-[24px] inline-flex items-center justify-center">{loading ? <Loader2 className="h-3 w-3 animate-spin" /> : totalCount}</span>}</TabsTrigger>
            </TabsList>
        </div>

        <DataTable
            columns={columns}
            data={publications}
            loading={loading}
            getRowKey={(p) => p.id}
            emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                <h3 className="text-base font-semibold mt-4">
                Nenhuma publicação encontrada
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Nenhuma publicação corresponde aos filtros atuais.
                </p>
            </div>
            }
        />
      </Tabs>

      {totalCount > itemsPerPage && (
        <div className="flex justify-center py-4">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            baseUrl="/admin/publications"
          />
        </div>
      )}
    </div>
  );
}
