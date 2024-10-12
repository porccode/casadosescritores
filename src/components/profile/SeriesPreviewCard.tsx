"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getMediaUrl } from "@/lib/utils";
import { BookMarked, User } from "lucide-react";

interface SeriesData {
    id: string;
    title: string;
    description: string;
    cover_url: string;
    genre: string;
    is_completed: boolean;
    author: {
        username: string;
        first_name: string | null;
        last_name: string | null;
    } | null;
}

export default function SeriesPreviewCard({ slug }: { slug: string }) {
    const [series, setSeries] = useState<SeriesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchSeries() {
            setLoading(true);
            try {
                // Remove trailing slashes and query params gracefully if somehow matched
                const cleanSlug = slug.replace(/\/$/, '').split('?')[0];

                const { data, error } = await (supabase
                    .from("series")
                    .select('id, title, description, cover_url, genre, is_completed, chapter_count, author:author_id(username, first_name, last_name)')
                    .eq('slug', cleanSlug)
                    .single() as any);

                if (error || !data || (data.chapter_count || 0) === 0) {
                    setError(true);
                } else {
                    setSeries(data as unknown as SeriesData);
                }
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        if (slug) fetchSeries();
    }, [slug, supabase]);

    if (loading) {
        return (
            <div className="w-full max-w-lg mt-2">
                <Skeleton className="h-28 w-full rounded-xl" />
            </div>
        );
    }

    if (error || !series) {
        // Fallback silently by not rendering the rich card if the series doesn't exist
        return null;
    }

    const displayName = series.author 
        ? (series.author.first_name || series.author.last_name
            ? `${series.author.first_name || ""} ${series.author.last_name || ""}`.trim()
            : series.author.username)
        : "Autor";

    return (
        <a 
            href={`/series/${slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full max-w-lg mt-2 group focus:outline-none"
        >
            <Card className="overflow-hidden border border-border/50 hover:border-primary/40 transition-colors shadow-sm bg-background/50 hover:bg-background h-28">
                <CardContent className="p-0 flex h-full">
                    {/* Cover Area */}
                    <div className="relative w-[75px] sm:w-[85px] h-full shrink-0 bg-muted">
                        <OptimizedImage
                            src={getMediaUrl(series.cover_url)}
                            alt={series.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>

                    {/* Info Area */}
                    <div className="flex flex-col flex-1 p-3 min-w-0 justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                            {series.genre && (
                                <span className="text-[9px] sm:text-[10px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-sm truncate">
                                    {series.genre}
                                </span>
                            )}
                            {series.is_completed && (
                                <span className="text-[9px] sm:text-[10px] font-semibold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-sm">
                                    Concluída
                                </span>
                            )}
                        </div>
                        
                        <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {series.title}
                        </h3>
                        
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 mb-1.5">
                            {series.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-auto">
                            <User size={12} className="shrink-0" />
                            <span className="truncate">{displayName}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </a>
    );
}
