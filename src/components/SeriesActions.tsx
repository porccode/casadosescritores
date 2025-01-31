"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { archiveSeries, deleteSeries } from "@/app/actions/series.actions";
import {
  Edit,
  Trash2,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Archive,
  ArchiveX,
  Loader2,
  Bell,
  BellOff,
  ChevronDown,
} from "lucide-react";
import { generateSlug, sanitizeSlug } from "@/lib/utils";
import { Database } from "@/types/database.types";
import { useConfirm } from "./ConfirmModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SaveToPlaylistModal from "./SaveToPlaylistModal";
import { toast } from "@/lib/toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

type SeriesRow = Database["public"]["Tables"]["series"]["Row"];
type ChapterRow = Database["public"]["Tables"]["chapters"]["Row"];

interface SeriesWithChapters extends SeriesRow {
  first_chapter?: ChapterRow | null;
}

interface SeriesActionsProps {
  series: SeriesWithChapters;
  firstChapter?: ChapterRow | null;
  initialIsAuthor?: boolean;
  initialIsAdmin?: boolean;
}

export default function SeriesActions({
  series,
  firstChapter,
  initialIsAuthor = false,
  initialIsAdmin = false,
}: SeriesActionsProps): React.ReactElement {
  const [isAuthor, setIsAuthor] = useState(initialIsAuthor);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(series.is_archived || false);
  const [archiving, setArchiving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(true);
  const [isFollowToggling, setIsFollowToggling] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient();
  const { confirm } = useConfirm();
  const { user, isAuthenticated } = useAuth();

  // Re-verify permissions on client to support ISR
  useEffect(() => {
    if (user) {
      if (user.id === series.author_id) {
        setIsAuthor(true);
      }

      const checkAdmin = async () => {
        const { data } = await supabase
          .from("profiles")
          .select(ADMIN_ACCESS_PROFILE_SELECT)
          .eq("id", user.id)
          .single();
        if (isAdminRole(data)) setIsAdmin(true);
      };
      checkAdmin();
    }
  }, [user, series.author_id, supabase]);

  // Fetch follow status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/series/follow?seriesId=${series.id}`);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.isFollowing);
          setFollowerCount(data.count);
        }
      } catch {
        // silently fail
      } finally {
        setIsFollowLoading(false);
      }
    }
    fetchStatus();
  }, [series.id]);

  const handleOpenPlaylistModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      const fullPath = window.location.pathname + window.location.search;
      router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
      return;
    }
    setPlaylistModalOpen(true);
  };

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      const fullPath = window.location.pathname + window.location.search;
      router.push(`/login?redirectTo=${encodeURIComponent(fullPath)}`);
      return;
    }

    setIsFollowToggling(true);
    const action = isFollowing ? "unfollow" : "follow";

    try {
      const res = await fetch("/api/series/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: series.id, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar");
      }

      setIsFollowing(!isFollowing);
      setFollowerCount((prev) => prev + (isFollowing ? -1 : 1));
      toast.success(
        isFollowing
          ? "Deixou de seguir a série"
          : "Seguindo! Você será notificado de novos capítulos."
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setIsFollowToggling(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (archiving) return;
    setArchiving(true);
    try {
      const newArchivedState = !isArchived;

      const result = await archiveSeries(series.id, newArchivedState);

      if (result.error) {
        throw new Error(result.error);
      }

      setIsArchived(newArchivedState);
      toast.success(
        newArchivedState
          ? "Série arquivada! Não aparecerá mais publicamente."
          : "Série desarquivada! Agora está visível publicamente."
      );
      router.refresh();
    } catch (err: any) {
      console.error("Error toggling archive:", err);
      toast.error(err.message || "Erro ao arquivar série");
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    const confirmed = await confirm({
      title: "Excluir série",
      message: `Tem certeza que deseja excluir a série "${series.title}"?\n\nTodos os capítulos também serão excluídos.`,
      confirmText: "Excluir",
      type: "danger",
    });

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const result = await deleteSeries(series.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Série "${series.title}" excluída com sucesso!`);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Erro ao excluir série:", err);
      setError(err.message || "Não foi possível excluir a série.");
      toast.error(err.message || "Erro ao excluir série");
    } finally {
      setDeleting(false);
    }
  };

  const activeFirstChapter = firstChapter !== undefined ? firstChapter : series.first_chapter;

  const firstChapterSlug = activeFirstChapter
    ? activeFirstChapter.slug || sanitizeSlug(activeFirstChapter.title)
    : null;

  const canManage = isAuthor || isAdmin;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary CTA: Start Reading */}
        {firstChapterSlug ? (
          <Button asChild className="gap-2">
            <Link
              href={`/capitulo/${generateSlug(
                activeFirstChapter?.title || "",
                activeFirstChapter?.id || ""
              )}`}
            >
              <BookOpen className="h-4 w-4" />
              Começar a Ler
            </Link>
          </Button>
        ) : (
          <Button disabled className="gap-2">
            <BookOpen className="h-4 w-4" />
            Sem capítulos
          </Button>
        )}

        {/* Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              Opções <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {/* Salvar */}
            <DropdownMenuItem onClick={handleOpenPlaylistModal}>
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 mr-2 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4 mr-2" />
              )}
              Salvar em uma playlist
            </DropdownMenuItem>

            {/* Seguir Série (Só para quem não é o autor) */}
            {!isAuthor && (
              <DropdownMenuItem
                onClick={handleToggleFollow}
                disabled={isFollowLoading || isFollowToggling}
              >
                {isFollowToggling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isFollowing ? (
                  <BellOff className="h-4 w-4 mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {isFollowing ? "Deixar de seguir" : "Seguir série"}
                {followerCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {followerCount}
                  </span>
                )}
              </DropdownMenuItem>
            )}

            {/* Author / Admin actions */}
            {canManage && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={`/escrever?action=edit&type=series&id=${series.id}`}
                    className="flex w-full cursor-pointer items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar série
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleArchive} disabled={archiving}>
                  {archiving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isArchived ? (
                    <ArchiveX className="h-4 w-4 mr-2" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  {isArchived ? "Desarquivar" : "Arquivar"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {deleting ? "Excluindo..." : "Excluir série"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Error message */}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {/* Save to Playlist Modal */}
      <SaveToPlaylistModal
        open={playlistModalOpen}
        onOpenChange={setPlaylistModalOpen}
        contentId={series.id}
        contentType="series"
        contentTitle={series.title}
      />
    </>
  );
}
