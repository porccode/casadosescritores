"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { Loader2, Plus, Library } from "lucide-react";
import { generateSlug, sanitizeSlug, isSeriesAbandoned } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import ProfileItemCard from "./ProfileItemCard";
import Pagination from "@/components/Pagination";

interface ProfileWorksProps {
    profileId: string;
    isOwnProfile: boolean;
    isAdmin?: boolean;
}

export default function ProfileWorks({ profileId, isOwnProfile, isAdmin = false }: ProfileWorksProps) {
    const router = useRouter();
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [archivingId, setArchivingId] = useState<string | null>(null);
    const [pinningId, setPinningId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 12;

    const supabase = createBrowserClient();

    async function fetchData() {
        setLoading(true);
        try {
            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            let query = supabase
                .from("series")
                .select("id, title, slug, genre, cover_url, is_completed, view_count, created_at, updated_at, is_archived, is_draft, is_pinned", { count: "exact" })
                .eq("author_id", profileId);

            // Se não for o dono do perfil E não for administrador, filtrar apenas séries não arquivadas, não rascunhos e com capítulos
            if (!isOwnProfile && !isAdmin) {
                query = query.eq("is_archived", false).eq("is_draft", false).gt("chapter_count", 0);
            }

            const { data: seriesData, error, count } = await query
                .order("is_pinned", { ascending: false })
                .order("updated_at", { ascending: false })
                .range(from, to);

            if (error) {
                console.error("Error fetching works:", error);
                setWorks([]);
                return;
            }

            if (count !== null) setTotalCount(count);

            if (seriesData) {
                const worksWithChapters = await Promise.all(
                    seriesData.map(async (s: any) => {
                        const { count } = await supabase
                            .from("chapters")
                            .select("*", { count: "exact", head: true })
                            .eq("series_id", s.id);
                        return { ...s, chapter_count: count || 0 };
                    })
                );
                setWorks(worksWithChapters);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // Quando mudar a página, rolar suavemente para o topo do componente
        if (page > 1) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [profileId, supabase, page]);

    const handleEdit = (id: string) => {
        router.push(`/escrever?action=edit&type=series&id=${id}`);
    };

    const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
        // Enforce limit of 3 pinned items
        const pinnedCount = works.filter(w => w.is_pinned).length;
        
        if (!currentlyPinned && pinnedCount >= 3) {
            toast.error("Você já atingiu o limite de 3 obras fixadas.");
            return;
        }

        setPinningId(id);
        try {
            const { error } = await (supabase as any)
                .from("series")
                .update({ is_pinned: !currentlyPinned })
                .eq("id", id);

            if (error) throw error;

            // Update local state
            setWorks(prev => {
                const updated = prev.map(w => w.id === id ? { ...w, is_pinned: !currentlyPinned } : w);
                // Re-sort locally: pinned first, then by updated_at
                return [...updated].sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                });
            });

            toast.success(!currentlyPinned ? "Obra fixada no perfil!" : "Obra desafixada.");
            
            // Refresh parent state if needed (sidebar destaque)
            router.refresh();
        } catch (error) {
            console.error("Error toggling pin:", error);
            toast.error("Erro ao alterar destaque da série.");
        } finally {
            setPinningId(null);
        }
    };

    const handleArchive = async (id: string, archive: boolean) => {
        setArchivingId(id);
        try {
            const response = await fetch("/api/series/archive", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seriesId: id, archive }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao alterar status da série");
            }

            // Update local state
            setWorks(prev => prev.map(w => w.id === id ? { ...w, is_archived: archive } : w));

            // If we're not on our own profile, we should remove it from the list
            if (!isOwnProfile && archive) {
                setWorks(prev => prev.filter(w => w.id !== id));
            }

            toast.success(archive ? "Série arquivada!" : "Série desarquivada!");
        } catch (error: any) {
            console.error("Error toggling archive:", error);
            toast.error(error.message || "Erro ao alterar status da série.");
        } finally {
            setArchivingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-muted-foreground text-sm mt-2">Carregando séries...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    {isOwnProfile ? "Minhas Séries" : "Séries"}
                </h2>
                {isOwnProfile && (
                    <Button size="sm" asChild>
                        <Link href="/escrever?type=series">
                            <Plus size={16} className="mr-2" />
                            Nova Série
                        </Link>
                    </Button>
                )}
            </div>

            {works.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Library size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground text-sm">
                            {isOwnProfile
                                ? "Você ainda não publicou nenhuma série."
                                : "Nenhuma série publicada."}
                        </p>
                        {isOwnProfile && (
                            <Button variant="outline" size="sm" className="mt-4" asChild>
                                <Link href="/escrever?type=series">Criar primeira série</Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-1 divide-y">
                        {works.map((work) => (
                            <ProfileItemCard
                                key={work.id}
                                title={work.title}
                                href={`/series/${work.slug || generateSlug(work.title, work.id)}`}
                                coverUrl={work.cover_url}
                                subtitle={work.genre}
                                metadata={{
                                    chapterCount: work.chapter_count,
                                    views: work.view_count,
                                    publishedAt: work.created_at
                                }}
                                actions={{
                                    isOwnContent: isOwnProfile,
                                    onEdit: () => handleEdit(work.id),
                                    onArchive: !work.is_archived ? (() => handleArchive(work.id, true)) : undefined,
                                    onUnarchive: work.is_archived ? (() => handleArchive(work.id, false)) : undefined,
                                    onPin: () => handleTogglePin(work.id, false),
                                    onUnpin: () => handleTogglePin(work.id, true),
                                    isArchiving: archivingId === work.id,
                                    isUnarchiving: archivingId === work.id,
                                    isPinning: pinningId === work.id
                                }}
                                status={{
                                    isCompleted: work.is_completed,
                                    isArchived: work.is_archived,
                                    isDraft: work.is_draft,
                                    isPinned: work.is_pinned,
                                    isAbandoned: isSeriesAbandoned(work.chapter_count, work.updated_at, work.is_completed, work.is_archived)
                                }}
                            />
                        ))}
                    </CardContent>
                </Card>
            )}

            {totalCount > ITEMS_PER_PAGE && (
                <div className="flex justify-center pt-6">
                    <Pagination
                        currentPage={page}
                        totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
}
