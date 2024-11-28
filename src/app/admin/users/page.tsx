"use client";

import React from "react";
import { Users, Edit, Trash2, Eye, Check, MoreVertical, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "@/lib/toast";
import Pagination from "@/components/Pagination";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { EditUserDialog } from "@/components/admin/EditUserDialog";
import { AdminUser } from "@/types/admin";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const {
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
    updateXp,
    handleUpdateUser,
    handleDeleteUser,
    itemsPerPage
  } = useAdminUsers(page);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Identificador copiado!");
  };

  const getOriginBadge = (avatarUrl: string | null) => {
    if (avatarUrl?.includes("googleusercontent.com")) {
      return (
        <Badge variant="outline" className="gap-1.5 text-xs text-blue-600 border-blue-500/20 bg-blue-500/5">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Badge>
      );
    }
    if (avatarUrl?.includes("facebook.com")) {
      return (
        <Badge variant="outline" className="gap-1.5 text-xs text-blue-800 border-blue-600/20 bg-blue-600/5">
          <span className="font-bold">f</span>
          Facebook
        </Badge>
      );
    }
    return <span className="text-xs text-muted-foreground italic">Nativo</span>;
  };

  const columns = [
    {
      key: "user",
      header: "Usuário",
      cell: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            src={user.avatar_url}
            alt={user.username || user.email}
            size={36}
            className="rounded-full"
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
      cell: (user: AdminUser) => (
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => copyToClipboard(user.email)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors text-left truncate max-w-[200px]"
            title="Copiar email"
          >
            {user.email}
          </button>
          {[user.first_name, user.last_name].filter(Boolean).join(" ") && (
            <span className="text-xs text-muted-foreground/60">
              {[user.first_name, user.last_name].filter(Boolean).join(" ")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "role",
      header: "Cargo",
      cell: (user: AdminUser) => {
        let badgeVariant: "info" | "success" | "warning" | "destructive" | "secondary" = "secondary";
        let label = "Membro";

        if (user.role === "admin") {
          badgeVariant = "warning";
          label = "Administrador";
        } else if (user.role === "moderator") {
          badgeVariant = "info";
          label = "Moderador";
        }

        return (
          <Badge
            variant={badgeVariant}
            className={cn(
              badgeVariant === "warning" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
              badgeVariant === "info" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
            )}
          >
            {label}
          </Badge>
        );
      },
    },
    {
      key: "xp",
      header: "XP / Nível",
      cell: (user: AdminUser) => (
        <div className="flex flex-col gap-0.5">
          {editingXpId === user.id ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editingXpValue}
                onChange={(e) => setEditingXpValue(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={() => updateXp(user, editingXpValue)} className="h-8 w-8 text-primary">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { setEditingXpId(user.id); setEditingXpValue(user.xp); }}
              className="flex items-center justify-between hover:bg-muted/50 p-1.5 -m-1.5 transition-all rounded-md group text-left"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium tabular-nums">
                  {user.xp.toLocaleString("pt-BR")} <span className="text-xs text-muted-foreground">XP</span>
                </span>
                <span className="text-xs text-muted-foreground">Nível {user.level}</span>
              </div>
              <Edit className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Membro desde",
      cell: (user: AdminUser) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(user.created_at)}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origem",
      cell: (user: AdminUser) => getOriginBadge(user.avatar_url),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (user: AdminUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user.username || ""}`} target="_blank" className="cursor-pointer gap-2">
                <Eye className="h-4 w-4" /> Perfil Público
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingUser(user)} className="cursor-pointer gap-2">
              <Edit className="h-4 w-4" /> Alterar Dados
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteUser(user)}
              disabled={user.role === "admin"}
              className="text-destructive focus:text-destructive cursor-pointer gap-2"
            >
              <Trash2 className="h-4 w-4" /> Excluir Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Usuários"
        description={`Gerenciando ${totalCount.toLocaleString()} contas ativas.`}
        action={
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por login ou email..."
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
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <h3 className="text-base font-semibold mt-4">Nenhum usuário encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum registro corresponde aos termos de busca informados.
            </p>
          </div>
        }
      />

      {totalCount > itemsPerPage && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            baseUrl="/admin/users"
          />
        </div>
      )}

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onUserChange={(u) => setEditingUser(u)}
        onSave={handleUpdateUser}
        saving={saving}
      />
    </div>
  );
}
