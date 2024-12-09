"use client";

import React from "react";
import { Trash2, RefreshCcw, Search, UserX, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import Pagination from "@/components/Pagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useDeletedUsers, DeletedAdminUser } from "@/hooks/useDeletedUsers";

export default function DeletedUsersPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const {
    users,
    totalCount,
    loading,
    search,
    setSearch,
    handleRestoreUser,
    itemsPerPage
  } = useDeletedUsers(page);

  const getRemainingDays = (dateStr: string) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const columns = [
    {
      key: "user",
      header: "Usuário",
      cell: (user: DeletedAdminUser) => (
        <div className="flex items-center gap-3 opacity-70">
          <UserAvatar
            src={user.avatar_url}
            alt={user.username || user.email}
            size={36}
            className="rounded-full grayscale"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              @{user.username || "user"}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {user.id.slice(0, 8)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contato",
      cell: (user: DeletedAdminUser) => (
        <span className="text-sm text-muted-foreground italic truncate max-w-[200px]">
          {user.email}
        </span>
      ),
    },
    {
      key: "deleted_at",
      header: "Deletado em",
      cell: (user: DeletedAdminUser) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">
            {formatDate(user.deleted_at)}
          </span>
        </div>
      ),
    },
    {
      key: "expires_at",
      header: "Exclusão Permanente",
      cell: (user: DeletedAdminUser) => {
        const days = getRemainingDays(user.deletion_scheduled_at);
        return (
          <div className="flex items-center gap-2">
            <Badge 
              variant={days !== null && days < 7 ? "destructive" : "outline"}
              className="gap-1.5"
            >
              <Clock className="h-3 w-3" />
              {days !== null ? `Em ${days} dias` : "Indefinido"}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (user: DeletedAdminUser) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleRestoreUser(user)}
          className="gap-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
        >
          <RefreshCcw className="h-4 w-4" />
          Restaurar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários Deletados"
        description={`Exibindo ${totalCount.toLocaleString()} contas em período de carência (30 dias).`}
        action={
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por login ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        getRowKey={(u) => u.id}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserX className="h-10 w-10 text-muted-foreground/20" />
            <h3 className="text-base font-semibold mt-4">Nenhum usuário deletado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No momento não há contas aguardando exclusão definitiva.
            </p>
          </div>
        }
      />

      {totalCount > itemsPerPage && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            baseUrl="/admin/deleted"
          />
        </div>
      )}
    </div>
  );
}
