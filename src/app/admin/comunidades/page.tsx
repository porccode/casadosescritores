"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import {
  useAdminCommunityPosts,
  AdminCommunityPost,
} from "@/hooks/useAdminCommunityPosts";
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
import { Badge } from "@/components/ui/badge";

export default function AdminComunidadesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("q") || "";
  const urlCommunity = searchParams.get("community") || "all";

  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 500);
  const [communityFilter, setCommunityFilter] = useState(urlCommunity);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    posts,
    communities,
    isLoading,
    totalCount,
    itemsPerPage,
    handleDelete,
    handleBulkDelete,
  } = useAdminCommunityPosts(page, debouncedSearch, communityFilter);

  // Sincroniza filtros na URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (communityFilter !== "all") params.set("community", communityFilter);
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : "/admin/comunidades";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, communityFilter, page, router]);

  // Limpa seleção ao trocar filtros / página
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch, communityFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length && posts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const executeBulkDelete = async () => {
    const success = await handleBulkDelete(Array.from(selectedIds));
    if (success) setSelectedIds(new Set());
  };

  const formatRelativeTime = (dateStr: string) => {
    const data = new Date(dateStr);
    const diff = Date.now() - data.getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(min / 60);
    const d = Math.floor(h / 24);
    if (min < 60) return `Há ${min}m`;
    if (h < 24) return `Há ${h}h`;
    if (d < 7) return `Há ${d}d`;
    return formatDate(dateStr);
  };

  const columns = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={posts.length > 0 && selectedIds.size === posts.length}
          onCheckedChange={toggleSelectAll}
          aria-label="Selecionar todos"
          className="translate-y-[2px]"
        />
      ),
      className: "w-8",
      cell: (post: AdminCommunityPost) => (
        <Checkbox
          checked={selectedIds.has(post.id)}
          onCheckedChange={() => toggleSelect(post.id)}
          aria-label={`Selecionar post de ${post.author?.username}`}
          className="translate-y-[2px]"
        />
      ),
    },
    {
      key: "content",
      header: "Publicação",
      cell: (post: AdminCommunityPost) => (
        <div className="flex flex-col gap-1 max-w-[380px]">
          <Dialog>
            <DialogTrigger asChild>
              <div className="cursor-pointer group">
                <p className="text-sm text-foreground line-clamp-2 group-hover:underline decoration-muted-foreground/50 underline-offset-2">
                  &ldquo;{post.content}&rdquo;
                </p>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold text-muted-foreground">
                  Post de @{post.author?.username || "desconhecido"} em{" "}
                  {post.community?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 bg-muted/30 p-4 rounded-md text-sm border border-border/50 max-h-[60vh] overflow-y-auto">
                <CommentText text={post.content} />
              </div>
            </DialogContent>
          </Dialog>
          <span className="text-xs text-muted-foreground font-medium">
            @{post.author?.username || "desconhecido"}
          </span>
        </div>
      ),
    },
    {
      key: "community",
      header: "Comunidade",
      cell: (post: AdminCommunityPost) =>
        post.community ? (
          <Link
            href={`/comunidades/${post.community.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[160px]">
              {post.community.name}
            </span>
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            Comunidade removida
          </span>
        ),
    },
    {
      key: "stats",
      header: "Stats",
      className: "w-24 text-center",
      cell: (post: AdminCommunityPost) => (
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Badge variant="secondary" className="gap-1 font-normal text-[11px]">
            <MessageSquare className="h-3 w-3" />
            {post.comments_count}
          </Badge>
        </div>
      ),
    },
    {
      key: "date",
      header: "Data",
      className: "w-24 text-right",
      cell: (post: AdminCommunityPost) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(post.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (post: AdminCommunityPost) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(post.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          title="Excluir publicação"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts das Comunidades"
        description={`Moderando ${totalCount.toLocaleString()} publicação(ões) no feed das comunidades.`}
        action={
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Filtro por Comunidade */}
            <Select
              value={communityFilter}
              onValueChange={(val) => {
                setCommunityFilter(val);
                if (page !== 1) router.replace("?page=1");
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Comunidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as comunidades</SelectItem>
                {communities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
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
                  if (page !== 1) router.replace("?page=1");
                }}
                className="pl-9 h-9"
              />
            </div>
          </div>
        }
      />

      {/* Barra de ações em massa */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-sm text-destructive font-medium">
            <CheckSquare className="w-4 h-4" />
            {selectedIds.size}{" "}
            {selectedIds.size === 1
              ? "publicação selecionada"
              : "publicações selecionadas"}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={executeBulkDelete}
            className="h-8 shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Selecionadas
          </Button>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        columns={columns}
        data={posts}
        loading={isLoading}
        getRowKey={(p) => p.id}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mt-4">
              Nenhuma publicação encontrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Nenhuma publicação corresponde aos filtros atuais.
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
            baseUrl="/admin/comunidades"
          />
        </div>
      )}
    </div>
  );
}
