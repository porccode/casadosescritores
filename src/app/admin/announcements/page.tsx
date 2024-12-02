"use client";

import React from "react";
import { Plus, Edit2, Trash2, PanelTop, Layers, Newspaper, ChevronDown, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import AnnouncementModal from "@/components/admin/AnnouncementModal";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminAnnouncements, Announcement } from "@/hooks/useAdminAnnouncements";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  short: {
    label: "Barra Superior",
    description: "Faixa slim acima do menu",
    icon: PanelTop,
    color: "bg-primary/10 text-primary",
  },
  long: {
    label: "Banner de Destaque",
    description: "Banner entre menu e conteúdo",
    icon: Layers,
    color: "bg-amber-500/10 text-amber-700",
  },
  editorial: {
    label: "Comunicado Oficial",
    description: "Postagem nos Recentes",
    icon: Newspaper,
    color: "bg-emerald-500/10 text-emerald-700",
  },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] || TYPE_META.short;
  const Icon = meta.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium", meta.color)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const {
    announcements,
    loading,
    isModalOpen,
    setIsModalOpen,
    editingAnnouncement,
    setEditingAnnouncement,
    fetchAnnouncements,
    handleDelete,
    getStatusInfo
  } = useAdminAnnouncements();

  const banners = announcements.filter((a) => a.type === "short" || a.type === "long");
  const editorials = announcements.filter((a) => (a.type as string) === "editorial");

  const statusCell = (a: Announcement) => {
    const info = getStatusInfo(a);
    return (
      <Badge
        variant={info.variant}
        className={cn(
          info.variant === "success" ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" :
          info.variant === "info" ? "bg-blue-500/10 text-blue-700 border-blue-200" :
          info.variant === "destructive" ? "bg-red-500/10 text-red-700 border-red-200" : ""
        )}
      >
        {info.label}
      </Badge>
    );
  };

  const bannerColumns = [
    {
      key: "info",
      header: "Banner",
      cell: (a: Announcement) => (
        <div className="flex items-center gap-3 min-w-0">
          {/* Color swatch */}
          <div
            className="h-8 w-8 rounded-md border shrink-0"
            style={{ backgroundColor: a.background_color || "#494EB6" }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{a.title}</p>
            <TypeBadge type={a.type || "short"} />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: statusCell,
    },
    {
      key: "period",
      header: "Período",
      cell: (a: Announcement) => (
        <div className="text-xs text-muted-foreground tabular-nums">
          {new Date(a.start_date).toLocaleDateString("pt-BR")}
          {" → "}
          {a.end_date ? new Date(a.end_date).toLocaleDateString("pt-BR") : "Permanente"}
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (a: Announcement) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => { setEditingAnnouncement(a); setIsModalOpen(true); }}
            >
              <Edit2 className="h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => handleDelete(a.id, a.title)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const editorialColumns = [
    {
      key: "info",
      header: "Comunicado",
      cell: (a: Announcement) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{a.title}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(a.start_date).toLocaleDateString("pt-BR", { dateStyle: "long" })}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: statusCell,
    },
    {
      key: "actions",
      header: <span className="sr-only">Ações</span>,
      className: "text-right w-10",
      cell: (a: Announcement) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => router.push(`/escrever?action=edit&type=story&id=${a.id}`)}
            >
              <Edit2 className="h-4 w-4" /> Editar Postagem
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => handleDelete(a.id, a.title)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anúncios"
        description="Gerencie banners e comunicados da plataforma."
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo
                <ChevronDown className="ml-1.5 h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {/* Barra Superior */}
              <DropdownMenuItem
                className="gap-3 py-3 cursor-pointer"
                onClick={() => { setEditingAnnouncement(null); setIsModalOpen(true); }}
              >
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <PanelTop className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Barra Superior</p>
                  <p className="text-xs text-muted-foreground">Faixa slim acima do menu</p>
                </div>
              </DropdownMenuItem>

              {/* Banner de Destaque */}
              <DropdownMenuItem
                className="gap-3 py-3 cursor-pointer"
                onClick={() => {
                  setEditingAnnouncement({ type: "long" } as Announcement);
                  setIsModalOpen(true);
                }}
              >
                <div className="bg-amber-500/10 p-1.5 rounded-md">
                  <Layers className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Banner de Destaque</p>
                  <p className="text-xs text-muted-foreground">Entre o menu e o conteúdo</p>
                </div>
              </DropdownMenuItem>

              {/* Comunicado Oficial */}
              <DropdownMenuItem
                className="gap-3 py-3 cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/admin/announcements/get-series");
                    const data = await res.json();
                    if (data.seriesId) {
                      router.push(`/escrever?action=new-chapter&seriesId=${data.seriesId}`);
                    } else {
                      alert("Erro ao preparar postagem: " + (data.error || "Série não encontrada"));
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Erro de conexão");
                  }
                }}
              >
                <div className="bg-emerald-500/10 p-1.5 rounded-md">
                  <Newspaper className="h-4 w-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Comunicado Oficial</p>
                  <p className="text-xs text-muted-foreground">Postagem nos cards Recentes</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Guia de tipos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.values(TYPE_META).map((meta) => {
          const Icon = meta.icon;
          return (
            <Card key={meta.label} className="border-border shadow-none">
              <CardContent className="pt-4 pb-3 flex items-start gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList>
          <TabsTrigger value="banners" className="gap-2">
            <PanelTop className="h-3.5 w-3.5" />
            Banners
            {banners.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{banners.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="editorials" className="gap-2">
            <Newspaper className="h-3.5 w-3.5" />
            Comunicados
            {editorials.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{editorials.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="m-0">
          <DataTable
            columns={bannerColumns}
            data={banners}
            loading={loading}
            getRowKey={(a) => a.id}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <PanelTop className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">Nenhum banner cadastrado</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Crie uma Barra Superior ou um Banner de Destaque usando o botão "Novo" acima.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="editorials" className="m-0">
          <DataTable
            columns={editorialColumns}
            data={editorials}
            loading={loading}
            getRowKey={(a) => a.id}
            emptyState={
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <Newspaper className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">Nenhum comunicado publicado</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Use "Comunicado Oficial" para criar uma postagem que aparece nos cards de Recentes para os leitores.
                </p>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnnouncements}
        announcement={editingAnnouncement}
      />
    </div>
  );
}
