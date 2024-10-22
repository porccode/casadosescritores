"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Loader2,
    ListMusic,
    Lock,
    Globe,
    Check
} from "lucide-react";
import { toast } from "@/lib/toast";
import { showXPToast } from "@/lib/xp-toast";
import { XP_CONFIG } from "@/config/xp";

import { SAVED_CHAPTERS_PLAYLIST_NAME } from "@/lib/playlist-service";

interface Playlist {
    id: string;
    name: string;
    is_public: boolean;
    hasItem?: boolean;
}

interface SaveToPlaylistModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contentId: string;
    contentType: "story" | "series" | "chapter";
    contentTitle?: string;
}

export default function SaveToPlaylistModal({
    open,
    onOpenChange,
    contentId,
    contentType,
    contentTitle
}: SaveToPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
    const [creating, setCreating] = useState(false);

    const supabase = createBrowserClient();

    async function fetchPlaylists() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Fetch user's playlists
            const { data: playlistsData } = await supabase
                .from("playlists" as any)
                .select("id, name, is_public")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false }) as { data: any[] | null };

            if (!playlistsData) {
                setPlaylists([]);
                return;
            }

            // Filter out "Capítulos Salvos" if saving a series
            const filteredPlaylists = contentType === "series"
                ? playlistsData.filter(p => p.name !== SAVED_CHAPTERS_PLAYLIST_NAME)
                : playlistsData;

            // Check which playlists already have this content
            const playlistsWithStatus = await Promise.all(
                filteredPlaylists.map(async (playlist) => {
                    const columnName = contentType === "story" ? "story_id"
                        : contentType === "series" ? "series_id"
                            : "chapter_id";

                    const { data } = await supabase
                        .from("reading_list_items" as any)
                        .select("id")
                        .eq("playlist_id", playlist.id)
                        .eq(columnName, contentId)
                        .maybeSingle();

                    return {
                        ...playlist,
                        hasItem: !!data
                    };
                })
            );

            // Sort: "Capítulos Salvos" always first
            const sortedWithStatus = playlistsWithStatus.sort((a, b) => {
                if (a.name === SAVED_CHAPTERS_PLAYLIST_NAME) return -1;
                if (b.name === SAVED_CHAPTERS_PLAYLIST_NAME) return 1;
                return 0;
            });

            setPlaylists(sortedWithStatus);
        } catch (error) {
            console.error("Error fetching playlists:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open) {
            fetchPlaylists();
            setShowCreate(false);
            setNewPlaylistName("");
            setNewPlaylistPublic(false);
        }
    }, [open, contentId]);

    const handleTogglePlaylist = async (playlist: Playlist) => {
        setSaving(playlist.id);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const action = playlist.hasItem ? "remove" : "add";

            const response = await fetch("/api/playlists/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    playlistId: playlist.id,
                    contentId: contentId,
                    contentType: contentType,
                    action: "toggle" // Or action
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Erro ao salvar");

            if (result.success) {
                const nowHasItem = action === "add";
                setPlaylists(prev => prev.map(p =>
                    p.id === playlist.id ? { ...p, hasItem: nowHasItem } : p
                ));

                if (nowHasItem) {
                    toast.success(`Salvo em "${playlist.name}"`);
                    
                    // The API already awarded XP server-side.
                    // We just show the toast if XP was awarded.
                    if (result.xpAwarded) {
                        const xpKey = playlist.name === SAVED_CHAPTERS_PLAYLIST_NAME ? 'CONTENT_SAVE' : 'PLAYLIST_ADD';
                        showXPToast({
                            amount: XP_CONFIG[xpKey].xp,
                            action: XP_CONFIG[xpKey].action,
                            message: `XP de curadoria recebido!`
                        });
                    }
                } else {
                    toast.success(`Removido de "${playlist.name}"`);
                }
            }
        } catch (error: any) {
            console.error("Error toggling playlist:", error);
            toast.error(error.message || "Erro ao salvar");
        } finally {
            setSaving(null);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;

        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            // Create playlist
            const { data: newPlaylist, error: createError } = await (supabase as any)
                .from("playlists")
                .insert({
                    user_id: session.user.id,
                    name: newPlaylistName.trim(),
                    is_public: newPlaylistPublic
                })
                .select()
                .single() as { data: any | null, error: any };

            if (createError) throw createError;

            // Add content to new playlist
            const insertData: any = {
                user_id: session.user.id,
                playlist_id: newPlaylist.id,
                story_id: contentType === "story" ? contentId : null,
                series_id: contentType === "series" ? contentId : null,
                chapter_id: contentType === "chapter" ? contentId : null
            };

            const { error: addError } = await (supabase as any)
                .from("reading_list_items")
                .insert(insertData);

            if (addError) throw addError;

            setPlaylists(prev => [{
                id: newPlaylist.id,
                name: newPlaylist.name,
                is_public: newPlaylist.is_public,
                hasItem: true
            }, ...prev]);

            setShowCreate(false);
            setNewPlaylistName("");
            setNewPlaylistPublic(false);
            showXPToast({
                amount: XP_CONFIG.PLAYLIST_CREATE.xp,
                action: XP_CONFIG.PLAYLIST_CREATE.action,
                message: `Playlist "${newPlaylist.name}" criada!`
            });
        } catch (error) {
            console.error("Error creating playlist:", error);
            toast.error("Erro ao criar playlist");
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Salvar em playlist</DialogTitle>
                    {contentTitle && (
                        <DialogDescription className="truncate">
                            {contentTitle}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Playlist list */}
                        {playlists.length > 0 && (
                            <ScrollArea className="max-h-[200px]">
                                <div className="space-y-1">
                                    {playlists.map((playlist) => (
                                        <div
                                            key={playlist.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer"
                                            onClick={() => handleTogglePlaylist(playlist)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Checkbox
                                                    id={`playlist-${playlist.id}`}
                                                    checked={playlist.hasItem}
                                                    disabled={saving === playlist.id}
                                                    onCheckedChange={() => handleTogglePlaylist(playlist)}
                                                />
                                                <Label
                                                    htmlFor={`playlist-${playlist.id}`}
                                                    className="text-sm font-medium leading-none cursor-pointer truncate"
                                                >
                                                    {playlist.name}
                                                </Label>
                                                {playlist.is_public ? (
                                                    <Globe size={14} className="text-muted-foreground flex-shrink-0" />
                                                ) : (
                                                    <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                                                )}
                                            </div>
                                            {saving === playlist.id && (
                                                <Loader2 size={16} className="animate-spin text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {playlists.length === 0 && !showCreate && (
                            <div className="text-center py-4">
                                <ListMusic size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Você ainda não tem playlists.
                                </p>
                            </div>
                        )}

                        <Separator />

                        {/* Create new playlist section */}
                        {showCreate ? (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="playlist-name">Nome da playlist</Label>
                                    <Input
                                        id="playlist-name"
                                        value={newPlaylistName}
                                        onChange={(e) => setNewPlaylistName(e.target.value)}
                                        placeholder="Minha nova playlist"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="playlist-public" className="text-sm">
                                            Pública
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Visível no seu perfil
                                        </p>
                                    </div>
                                    <Switch
                                        id="playlist-public"
                                        checked={newPlaylistPublic}
                                        onCheckedChange={setNewPlaylistPublic}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowCreate(false)}
                                        disabled={creating}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleCreatePlaylist}
                                        disabled={creating || !newPlaylistName.trim()}
                                        className="flex-1"
                                    >
                                        {creating ? (
                                            <Loader2 className="animate-spin mr-2" size={16} />
                                        ) : (
                                            <Check className="mr-2" size={16} />
                                        )}
                                        Criar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowCreate(true)}
                            >
                                <Plus size={16} className="mr-2" />
                                Nova playlist
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
