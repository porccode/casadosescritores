"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
    Bookmark,
    Loader2,
    Plus,
    ChevronLeft,
    Pencil,
    MoreHorizontal,
    Trash2
} from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/toast";
import PlaylistCard from "./PlaylistCard";
import PlaylistModal from "./PlaylistModal";
import ProfileItemCard from "./ProfileItemCard";

interface Playlist {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean;
    cover_url: string | null;
    created_at: string;
    item_count?: number;
}

interface PlaylistItem {
    id: string;
    contentId: string;
    type: "series" | "chapter";
    title: string;
    slug: string;
    cover_url?: string;
    seriesTitle?: string;
    savedAt?: string;
    authorUsername?: string;
    authorAvatar?: string;
    views?: number;
    comments?: number;
    chapters?: number;
    isCompleted?: boolean;
}

interface ProfilePlaylistsProps {
    isOwnProfile: boolean;
    profileId?: string;
}

export default function ProfilePlaylists({ isOwnProfile, profileId }: ProfilePlaylistsProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
    const [removingItemId, setRemovingItemId] = useState<string | null>(null);
    const [unarchivingItemId, setUnarchivingItemId] = useState<string | null>(null);

    const supabase = createBrowserClient();

    // Update URL when selecting a playlist
    const handleSelectPlaylist = (playlist: Playlist | null) => {
        setSelectedPlaylist(playlist);

        const params = new URLSearchParams(searchParams.toString());
        if (playlist) {
            params.set("playlist", playlist.id);
        } else {
            params.delete("playlist");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    async function fetchPlaylists() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Fetch playlists with item count
            let query = supabase
                .from("playlists" as any)
                .select(`
                    id,
                    name,
                    description,
                    is_public,
                    cover_url,
                    created_at
                `)
                .order("created_at", { ascending: false });

            if (profileId && !isOwnProfile) {
                query = query.eq("user_id", profileId).eq("is_public", true);
            } else if (session?.user) {
                query = query.eq("user_id", session.user.id);
            }

            const { data, error } = await query as { data: any[] | null, error: any };

            if (error) {
                console.error("Error fetching playlists:", error);
                return;
            }

            // Get item counts for each playlist
            const playlistsWithCounts = await Promise.all(
                (data || []).map(async (playlist) => {
                    const { count } = await supabase
                        .from("reading_list_items" as any)
                        .select("*", { count: "exact", head: true })
                        .eq("playlist_id", playlist.id);
                    return { ...playlist, item_count: count || 0 };
                })
            );

            // Sort: "Capítulos Salvos" and "Arquivados" always first, then by creation date
            const sortedPlaylists = [...playlistsWithCounts].sort((a, b) => {
                const nameA = String(a.name).toLowerCase();
                const nameB = String(b.name).toLowerCase();
                const savedName = "capítulos salvos";
                const archivedName = "arquivados";

                // Capítulos Salvos first
                if (nameA === savedName) return -1;
                if (nameB === savedName) return 1;
                // Arquivados second
                if (nameA === archivedName) return -1;
                if (nameB === archivedName) return 1;

                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            setPlaylists(sortedPlaylists);

            // Restore selected playlist from URL after loading
            const playlistIdFromUrl = searchParams.get("playlist");
            if (playlistIdFromUrl) {
                const playlistFromUrl = sortedPlaylists.find(p => p.id === playlistIdFromUrl);
                if (playlistFromUrl) {
                    setSelectedPlaylist(playlistFromUrl);
                }
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchPlaylistItems(playlistId: string) {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from("reading_list_items" as any)
                .select(`
                    id,
                    series_id,
                    chapter_id,
                    created_at,
                    series:series!series_id(id, title, cover_url, view_count, is_completed, author:profiles!author_id(username, avatar_url)),
                    chapters:chapters!chapter_id(id, title, series:series!series_id(id, title, cover_url, author:profiles!author_id(username, avatar_url)))
                `)
                .eq("playlist_id", playlistId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching items:", error.message || error);
                return;
            }

            const formatted: PlaylistItem[] = [];
            (data || []).forEach((item: any) => {
                if (item.chapter_id && item.chapters) {
                    formatted.push({
                        id: item.id,
                        contentId: item.chapter_id,
                        type: "chapter",
                        title: item.chapters.title,
                        slug: generateSlug(item.chapters.title, item.chapter_id),
                        seriesTitle: item.chapters.series?.title,
                        cover_url: item.chapters.series?.cover_url,
                        authorUsername: item.chapters.series?.author?.username,
                        authorAvatar: item.chapters.series?.author?.avatar_url,
                        savedAt: item.created_at
                    });
                } else if (item.series_id && item.series) {
                    formatted.push({
                        id: item.id,
                        contentId: item.series_id,
                        type: "series",
                        title: item.series.title,
                        slug: generateSlug(item.series.title, item.series_id),
                        cover_url: item.series.cover_url,
                        views: item.series.view_count,
                        isCompleted: item.series.is_completed,
                        authorUsername: item.series.author?.username,
                        authorAvatar: item.series.author?.avatar_url,
                        savedAt: item.created_at
                    });
                }
            });

            setPlaylistItems(formatted);
        } finally {
            setLoadingItems(false);
        }
    }

    useEffect(() => {
        fetchPlaylists();
    }, [profileId, isOwnProfile]);

    useEffect(() => {
        if (selectedPlaylist) {
            fetchPlaylistItems(selectedPlaylist.id);
        }
    }, [selectedPlaylist]);

    const handleCreatePlaylist = async (data: { name: string; description: string; is_public: boolean }) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: newPlaylist, error } = await (supabase as any)
            .from("playlists")
            .insert({
                user_id: session.user.id,
                name: data.name,
                description: data.description || null,
                is_public: data.is_public
            })
            .select()
            .single() as { data: any | null, error: any };

        if (error) {
            toast.error("Erro ao criar playlist");
            throw error;
        }

        setPlaylists(prev => [{ ...newPlaylist, item_count: 0 }, ...prev]);
        toast.success("Playlist criada!");
    };

    const handleEditPlaylist = async (data: { name: string; description: string; is_public: boolean }) => {
        if (!editingPlaylist) return;

        const { error } = await (supabase as any)
            .from("playlists")
            .update({
                name: data.name,
                description: data.description || null,
                is_public: data.is_public,
                updated_at: new Date().toISOString()
            })
            .eq("id", editingPlaylist.id);

        if (error) {
            toast.error("Erro ao atualizar playlist");
            throw error;
        }

        setPlaylists(prev => prev.map(p =>
            p.id === editingPlaylist.id
                ? { ...p, name: data.name, description: data.description, is_public: data.is_public }
                : p
        ));

        if (selectedPlaylist?.id === editingPlaylist.id) {
            setSelectedPlaylist(prev => prev ? { ...prev, name: data.name, description: data.description, is_public: data.is_public } : null);
        }

        setEditingPlaylist(null);
        toast.success("Playlist atualizada!");
    };

    const handleDeletePlaylist = async () => {
        if (!playlistToDelete) return;

        const { error } = await (supabase as any)
            .from("playlists")
            .delete()
            .eq("id", playlistToDelete.id);

        if (error) {
            toast.error("Erro ao excluir playlist");
            return;
        }

        setPlaylists(prev => prev.filter(p => p.id !== playlistToDelete.id));
        if (selectedPlaylist?.id === playlistToDelete.id) {
            handleSelectPlaylist(null);
        }
        setPlaylistToDelete(null);
        setDeleteDialogOpen(false);
        toast.success("Playlist excluída!");
    };

    const handleRemoveItem = async (itemId: string) => {
        setRemovingItemId(itemId);
        try {
            const { error } = await supabase
                .from("reading_list_items" as any)
                .delete()
                .eq("id", itemId);

            if (error) {
                toast.error("Erro ao remover item");
                return;
            }

            setPlaylistItems(prev => prev.filter(i => i.id !== itemId));
            // Update item count
            setPlaylists(prev => prev.map(p =>
                p.id === selectedPlaylist?.id
                    ? { ...p, item_count: (p.item_count || 1) - 1 }
                    : p
            ));
        } finally {
            setRemovingItemId(null);
        }
    };

    const handleUnarchiveItem = async (contentId: string) => {
        setUnarchivingItemId(contentId);
        try {
            const response = await fetch("/api/series/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    seriesId: contentId,
                    archive: false
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erro ao desarquivar");
            }

            // Remove from local list
            setPlaylistItems(prev => prev.filter(i => i.contentId !== contentId));
            setPlaylists(prev => prev.map(p =>
                p.id === selectedPlaylist?.id
                    ? { ...p, item_count: (p.item_count || 1) - 1 }
                    : p
            ));
            toast.success("Série desarquivada! Agora está visível publicamente.");
        } catch (err: any) {
            console.error("Error unarchiving:", err);
            toast.error(err.message || "Erro ao desarquivar série");
        } finally {
            setUnarchivingItemId(null);
        }
    };

    const getHref = (item: PlaylistItem) => {
        switch (item.type) {
            case "series": return `/series/${item.slug}`;
            case "chapter": return `/capitulo/${item.slug}`;
            default: return `/series/${item.slug}`;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-muted-foreground text-sm mt-2">Carregando playlists...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Common Header / Navigation */}
            <div className="flex items-center justify-between">
                {selectedPlaylist ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectPlaylist(null)}
                        className="gap-2"
                    >
                        <ChevronLeft size={16} />
                        Voltar
                    </Button>
                ) : (
                    <h2 className="text-lg font-semibold">
                        {isOwnProfile ? "Minhas Playlists" : "Playlists"}
                    </h2>
                )}

                <div className="flex items-center gap-2">
                    {selectedPlaylist ? (
                        // Actions for selected playlist (except fixed playlists)
                        isOwnProfile &&
                        selectedPlaylist.name.toLowerCase() !== "capítulos salvos" &&
                        selectedPlaylist.name.toLowerCase() !== "arquivados" && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        setEditingPlaylist(selectedPlaylist);
                                        setModalOpen(true);
                                    }}>
                                        <Pencil size={14} className="mr-2" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                            setPlaylistToDelete(selectedPlaylist);
                                            setDeleteDialogOpen(true);
                                        }}
                                    >
                                        <Trash2 size={14} className="mr-2" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    ) : (
                        // Actions for playlist list
                        isOwnProfile && (
                            <Button size="sm" onClick={() => {
                                setEditingPlaylist(null);
                                setModalOpen(true);
                            }}>
                                <Plus size={16} className="mr-2" />
                                Nova Playlist
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            {selectedPlaylist ? (
                /* Playlist Detail View */
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold">{selectedPlaylist.name}</h2>
                        {selectedPlaylist.description && (
                            <p className="text-sm text-muted-foreground">{selectedPlaylist.description}</p>
                        )}
                    </div>

                    {loadingItems ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : playlistItems.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Bookmark size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground text-sm">Nenhum item nesta playlist.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-1 divide-y">
                                {playlistItems.map((item) => {
                                    const isArchivedPlaylist = selectedPlaylist?.name.toLowerCase() === "arquivados";

                                    return (
                                        <ProfileItemCard
                                            key={item.id}
                                            title={item.title}
                                            href={getHref(item)}
                                            coverUrl={item.cover_url}
                                            subtitle={item.seriesTitle ? `Série: ${item.seriesTitle}` : undefined}
                                            metadata={{
                                                views: item.views,
                                                publishedAt: item.savedAt
                                            }}
                                            status={{
                                                isCompleted: item.isCompleted
                                            }}
                                            actions={{
                                                isOwnContent: isOwnProfile,
                                                onEdit: isArchivedPlaylist && item.type === "series" ? (() => router.push(`/escrever?action=edit&type=series&id=${item.contentId}`)) : undefined,
                                                onRemove: !isArchivedPlaylist ? (() => handleRemoveItem(item.id)) : undefined,
                                                isRemoving: removingItemId === item.id,
                                                onUnarchive: isArchivedPlaylist && item.type === "series" ? (() => handleUnarchiveItem(item.contentId)) : undefined,
                                                isUnarchiving: unarchivingItemId === item.contentId
                                            }}
                                        />
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                /* Playlist List View */
                <div className="space-y-4">
                    {playlists.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Bookmark size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground text-sm">
                                    {isOwnProfile
                                        ? "Você ainda não tem nenhuma playlist."
                                        : "Nenhuma playlist pública."}
                                </p>
                                {isOwnProfile && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => {
                                            setEditingPlaylist(null);
                                            setModalOpen(true);
                                        }}
                                    >
                                        Criar primeira playlist
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {playlists.map((playlist) => {
                                const isFixedPlaylist =
                                    playlist.name.toLowerCase() === "capítulos salvos" ||
                                    playlist.name.toLowerCase() === "arquivados";

                                return (
                                    <PlaylistCard
                                        key={playlist.id}
                                        id={playlist.id}
                                        name={playlist.name}
                                        description={playlist.description}
                                        isPublic={playlist.is_public}
                                        coverUrl={playlist.cover_url}
                                        itemCount={playlist.item_count}
                                        onClick={() => handleSelectPlaylist(playlist)}
                                        onEdit={isOwnProfile && !isFixedPlaylist ? () => {
                                            setEditingPlaylist(playlist);
                                            setModalOpen(true);
                                        } : undefined}
                                        onDelete={isOwnProfile && !isFixedPlaylist ? () => {
                                            setPlaylistToDelete(playlist);
                                            setDeleteDialogOpen(true);
                                        } : undefined}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modals - Shared by both views */}
            <PlaylistModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSave={editingPlaylist ? handleEditPlaylist : handleCreatePlaylist}
                initialData={editingPlaylist || undefined}
                isEditing={!!editingPlaylist}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir playlist?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todos os itens da playlist serão removidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePlaylist}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
