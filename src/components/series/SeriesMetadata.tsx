"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Eye } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

interface SeriesMetadataProps {
    author: {
        id: string;
        username: string | null;
        avatar_url?: string | null;
    } | null;
    createdAt: string;
    genre?: string | null;
    viewCount?: number;
}

/**
 * Series metadata component displaying author info, dates, and stats.
 * Compact layout on mobile, expanded on desktop.
 */
export function SeriesMetadata({
    author,
    createdAt,
    viewCount,
}: SeriesMetadataProps) {
    // Force scroll to top on mount to ensure user starts at the Hero section
    // especially useful after layout shifts from optimized images
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // Short date for mobile
    const formatShortDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
        });
    };

    const authorInitial = author?.username?.charAt(0).toUpperCase() || "?";

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
            {/* Author */}
            <Link
                href={`/profile/${encodeURIComponent(author?.username || "usuario")}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    {author?.avatar_url && (
                        <AvatarImage src={author.avatar_url} alt={author.username || "Autor"} />
                    )}
                    <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
                        {authorInitial}
                    </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-primary hover:underline">@{author?.username || "Autor"}</span>
            </Link>

            <span className="text-muted-foreground/40">•</span>

            {/* Date - short on mobile, full on desktop */}
            <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sm:hidden">{formatShortDate(createdAt)}</span>
                <span className="hidden sm:inline">{formatDate(createdAt)}</span>
            </div>

            {/* View Count */}
            {viewCount !== undefined && viewCount > 0 && (
                <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{formatCompactNumber(viewCount)} visualizações</span>
                    </div>
                </>
            )}
        </div>
    );
}
