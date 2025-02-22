"use client";

import React from "react";
import { formatTitle, cn, getMediaUrl, formatCompactNumber } from "@/lib/utils";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import { CoverLightbox } from "@/components/series/CoverLightbox";

interface SeriesHeroProps {
    series: {
        id: string;
        title: string;
        cover_url: string | null;
        is_explicit?: boolean;
        is_completed?: boolean;
        is_archived?: boolean;
        view_count?: number;
    };
    rank?: number | null;
    className?: string;
}

/**
 * SeriesHero.
 * 
 * DESIGN:
 * - High-authority cover display with responsive scaling.
 * - Integrated metadata overlays (Rank, Status, Views).
 * - Standardized visual identity for content immersion.
 */
export function SeriesHero({
    series,
    rank,
    className
}: SeriesHeroProps) {
    const title = formatTitle(series.title);
    const mediaUrl = getMediaUrl(series.cover_url);

    return (
        <div className={cn("relative w-full", className)}>
            {/* Desktop & Mobile Cover Container */}
            <CoverLightbox src={mediaUrl || undefined} alt={title}>
                <div className="relative aspect-[2/3] w-full lg:w-64 md:w-56 mx-auto md:mx-0 overflow-hidden rounded-xl bg-transparent shadow-2xl ring-1 ring-border/10 transition-transform duration-700 hover:scale-[1.01]">
                    <Image
                        src={mediaUrl || undefined}
                        alt={title}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Overlays on Cover */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-20 pointer-events-none">
                        {/* Left Column (Rank + Status) */}
                        <div className="flex flex-col gap-1.5 items-start">
                            {/* Ranking Badge (Top #1, #2, #3) */}
                            {rank && rank <= 3 && (
                                <Badge
                                    variant="neutral"
                                    className={cn(
                                        "text-[10px] h-5 px-2 border-none shadow-md font-bold text-[#212121] animate-in slide-in-from-left-2 duration-500 rounded-full",
                                        rank === 1 ? "bg-[#FFDAAB]" :
                                            rank === 2 ? "bg-[#A7FFC4]" :
                                                "bg-[#FFB7E9]"
                                    )}
                                >
                                    Top #{rank}
                                </Badge>
                            )}

                            <SeriesStatusBadge
                                isCompleted={series.is_completed || false}
                                isArchived={series.is_archived || false}
                                size="sm"
                                className="shadow-md border-none animate-in slide-in-from-left-2 duration-700"
                            />
                        </div>

                        {/* Right Column: Views Badge */}
                        {(series.view_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                                <Eye size={10} />
                                {formatCompactNumber(series.view_count)}
                            </span>
                        )}
                    </div>
                </div>
            </CoverLightbox>
        </div>
    );
}
