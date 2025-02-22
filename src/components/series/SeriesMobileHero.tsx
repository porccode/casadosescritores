"use client";

import { formatTitle, cn, getMediaUrl, formatCompactNumber } from "@/lib/utils";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { CoverLightbox } from "@/components/series/CoverLightbox";

interface SeriesMobileHeroProps {
    series: {
        id: string;
        title: string;
        cover_url: string | null;
        is_explicit?: boolean;
        is_completed?: boolean;
        is_archived?: boolean;
        view_count?: number;
        rank?: number | null;
    };
}

export default function SeriesMobileHero({ series }: SeriesMobileHeroProps) {
    const mediaUrl = series.cover_url ? getMediaUrl(series.cover_url) : undefined;

    return (
        <div className="w-60 mx-auto md:hidden shrink-0">
            <CoverLightbox src={mediaUrl} alt={formatTitle(series.title)}>
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-transparent shadow-lg font-sans">
                    <Image
                        src={mediaUrl}
                        alt={formatTitle(series.title)}
                        fill
                        className="object-cover"
                    />

                    {/* Overlays on Cover */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end z-20 pointer-events-none">
                        {/* Left Column (Rank + Status) */}
                        <div className="flex flex-col gap-1 items-start">
                            {/* Ranking Badge (Top #1, #2, #3) */}
                            {series.rank && series.rank <= 3 && (
                                <Badge
                                    variant="neutral"
                                    className={cn(
                                        "text-[10px] h-5 px-1.5 border-none shadow-sm font-bold text-[#212121]",
                                        series.rank === 1 ? "bg-[#FFB247]" :
                                            series.rank === 2 ? "bg-[#2CFF5A]" :
                                                "bg-[#FF73CC]"
                                    )}
                                >
                                    Top #{series.rank}
                                </Badge>
                            )}

                            <SeriesStatusBadge
                                isCompleted={series.is_completed || false}
                                isArchived={series.is_archived || false}
                                size="sm"
                                className="shadow-sm border-none"
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
