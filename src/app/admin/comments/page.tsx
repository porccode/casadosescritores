"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Trash2,
  Eye,
  Megaphone,
  Search,
  Filter,
  CheckSquare
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { generateSlug, formatDate } from "@/lib/utils";
import { useAdminComments, AdminComment, CommentFilter } from "@/hooks/useAdminComments";
import { PageHeader } from "@/components/admin/PageHeader";
import Pagination from "@/components/Pagination";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import CommentText from "@/components/comments/CommentText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CommentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("q") || "";
  const urlFilter = (searchParams.get("filter") as CommentFilter) || "all";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [filter, setFilter] = useState<CommentFilter>(urlFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    comments,
    isLoading,
    totalCount,
    handleDelete,
    handleBulkDelete,
    itemsPerPage
  } = useAdminComments(page, debouncedSearch, filter);

  // Sync state to URL params for deep linking and stable refreshing
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filter !== "all") params.set("filter", filter);
    
    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/comments";
    
    // Usando push() evitamos que a re-renderização da página ocorra desnecessariamente sem alterar a history, mas mantém os parâmetros salvos.
    // Usar 'replace' para não encher o histórico de cada letra digitada na busca local.
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, filter, page, router]);

  // Limpa a seleção quando muda de página ou filtros
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, filter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === comments.length && comments.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const executeBulkDelete = async () => {
    const success = await handleBulkDelete(Array.from(selectedIds));
    if (success) {
      setSelectedIds(new Set());
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const data = new Date(dateStr);
    const agora = new Date();
    const diffEmMilissegundos = agora.getTime() - data.getTime();
    const diffEmMinutos = Math.floor(diffEmMilissegundos / 60000);
    const diffEmHoras = Math.floor(diffEmMinutos / 60);
    const diffEmDias = Math.floor(diffEmHoras / 24);

    if (diffEmMinutos < 60) return `Há ${diffEmMinutos}m`;
    if (diffEmHoras < 24) return `Há ${diffEmHoras}h`;
    if (diffEmDias < 7) return `Há ${diffEmDias}d`;
    return formatDate(dateStr);
  };

  const columns = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={comments.length > 0 && selectedIds.size === comments.length}
          onCheckedChange={toggleSelectAll}
          aria-label="Selecionar todos"
          className="translate-y-[2px]"
        />
      ),
      className: "w-8",
      cell: (comment: AdminComment) => (
        <Checkbox
          checked={selectedIds.has(comment.id)}
          onCheckedChange={() => toggleSelect(comment.id)}
          aria-label={`Selecionar comentário de ${comment.author?.username}`}
          className="translate-y-[2px]"
        />
      ),
    },
    {
      key: "content",
      header: "Comentário",
      cell: (comment: AdminComment) => (
        <div className="flex flex-col gap-1 max-w-[400px]">
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer group">
                <p className="text-sm text-foreground line-clamp-2 group-hover:underline decoration-muted-foreground/50 underline-offset-2">
                  &ldquo;{comment.text}&rdquo;
                </p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-muted-foreground">
                  Comentário de @{comment.author?.username || "desconhecido"}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 bg-muted/30 p-4 rounded-md text-sm border border-border/50 max-h-[60vh] overflow-y-auto">
                <CommentText text={comment.text} />
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-xs text-muted-foreground font-medium">
            @{comment.author?.username || "desconhecido"}
          </span>
        </div>
      ),
    },
    {
      key: "context",
      header: "Origem",
      cell: (comment: AdminComment) => (
        <div className="flex flex-col gap-1">
          {comment.chapters ? (
            <Link
              href={`/capitulo/${comment.chapters.slug || generateSlug(comment.chapters.title || '', comment.chapters.id)}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">Cap: {comment.chapters.title}</span>
            </Link>
          ) : comment.series ? (
            <Link
              href={`/series/${comment.series.slug || generateSlug(comment.series.title || '', comment.series.id)}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">Série: {comment.series.title}</span>
            </Link>
          ) : comment.announcements ? (
            <div className="flex items-center gap-1.5 text-sm text-orange-600">
              <Megaphone className="h-3.5 w-3.5" />
              <span className="truncate max-w-[180px]">Mural: {comment.announcements.title}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">Contexto removido</span>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Data",
      className: "w-24 text-right",
      cell: (comment: AdminComment) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(comment.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (comment: AdminComment) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(comment.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comentários"
        description={`Moderando ${totalCount.toLocaleString()} interações na plataforma.`}
        action={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filtro de Contexto */}
            <Select 
              value={filter} 
              onValueChange={(val) => {
                setFilter(val as CommentFilter);
                if (page !== 1) router.replace('?page=1');
              }}
            >
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="chapters">Apenas Capítulos</SelectItem>
                <SelectItem value="series">Apenas Séries</SelectItem>
                <SelectItem value="announcements">Apenas Avisos</SelectItem>
              </SelectContent>
            </Select>

            {/* Busca */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conteúdo..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (page !== 1) router.replace('?page=1'); // volta p pag 1 se estiver digitando na pag 3, senao os result somem
                }}
                className="pl-9 h-9"
              />
            </div>
          </div>
        }
      />

      {/* Barra de Ações em Massa (Aparece apenas quando tem itens selecionados) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <CheckSquare className="w-4 h-4" />
            {selectedIds.size} {selectedIds.size === 1 ? 'comentário selecionado' : 'comentários selecionados'}
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={executeBulkDelete}
            className="h-8 shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Selecionados
          </Button>
        </div>
      )}

      {/* Tabela de Dados */}
      <DataTable
        columns={columns}
        data={comments}
        loading={isLoading}
        getRowKey={(c) => c.id}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mt-4">
              Nenhum comentário encontrado
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Nenhum comentário corresponde aos filtros atuais. Tente limpar a busca ou mudar a aba.
            </p>
          </div>
        }
      />

      {/* Paginação */}
      {totalCount > itemsPerPage && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            baseUrl="/admin/comments"
          />
        </div>
      )}
    </div>
  );
}
