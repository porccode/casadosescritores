"use client";

import React, { useCallback, useMemo } from "react";
import ContentCard from "@/components/ContentCard";
import { generateSlug, sanitizeSlug, isSeriesAbandoned } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Loader2 } from "lucide-react";
import { useAgeVerification } from "@/hooks/useAgeVerification";

interface CategoryInfiniteListProps {
    categoryName: string;
    initialData: any[];
}

export default function CategoryInfiniteList({ categoryName, initialData }: CategoryInfiniteListProps) {
    const supabase = createBrowserClient();
    const { isMinor } = useAgeVerification();
    const PAGE_SIZE = 12;

    const fetcher = useCallback(async (offset: number, limit: number) => {
        const { data } = await supabase
            .from("series" as any)
            .select(`
                id,
                title,
                description,
                genre,
                genres,
                slug,
                cover_url,
                view_count,
                is_completed,
                is_explicit,
                author_id,
                updated_at,
                chapter_count,
                profiles:author_id(username)
            `)
            .eq("is_archived", false)
            .eq("is_draft", false)
            .contains("genres", [categoryName])
            .not("cover_url", "is", null)
            .gt("chapter_count", 0)
            .order("view_count", { ascending: false })
            .range(offset, offset + limit - 1);

        return (data || []).map((s: any) => ({
            ...s,
            author_username: s.profiles?.username
        }));
    }, [categoryName, supabase]);

    const {
        data: rawItems,
        isLoadingMore,
        hasMore,
        sentinelRef
    } = useInfiniteScroll({
        fetchData: fetcher,
        initialData,
        pageSize: PAGE_SIZE
    });

    const items = useMemo(() => {
        if (!isMinor) return rawItems;
        return rawItems.filter((item) => !item.is_explicit);
    }, [rawItems, isMinor]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                {items.map((result, index) => (
                    <ContentCard
                        key={`series-${result.id}`}
                        variant="horizontal"
                        type="series"
                        title={result.title}
                        href={`/series/${result.slug || sanitizeSlug(result.title)}`}
                        coverUrl={result.cover_url}
                        summary={result.description}
                        rank={index + 1}
                        subtitle={{ text: result.genre }}
                        footer={{
                            author: result.author_username ? `@${result.author_username}` : "",
                            metrics: {
                                views: result.view_count,
                                chapters: result.chapter_count
                            }
                        }}
                        badges={{ 
                            isCompleted: result.is_completed,
                            isExplicit: result.is_explicit,
                            isAbandoned: isSeriesAbandoned(result.chapter_count, result.updated_at, result.is_completed)
                        }}
                    />
                ))}
            </div>

            {/* Loading Sentinel */}
            <div ref={sentinelRef} className="py-10 flex justify-center">
                {isLoadingMore && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <Loader2 size={16} className="animate-spin text-primary" />
                        Carregando mais séries...
                    </div>
                )}
                {!hasMore && items.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        Fim da categoria
                    </p>
                )}
            </div>
        </div>
    );
}
