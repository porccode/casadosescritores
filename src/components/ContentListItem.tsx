"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Clock, BookOpen } from "lucide-react";
import { formatTitle, cn, formatDistanceToNow, getMediaUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { useAgeVerification } from "@/hooks/useAgeVerification";

// Mapa de cores por gênero para o fallback visual
const GENRE_COLORS: Record<string, string> = {
    "Fantasia": "from-purple-500 to-indigo-600",
    "Romance": "from-pink-500 to-rose-600",
    "Terror": "from-gray-700 to-gray-900",
    "Ficção Científica": "from-cyan-500 to-blue-600",
    "Aventura": "from-orange-500 to-amber-600",
    "Drama": "from-red-500 to-rose-600",
    "Suspense": "from-slate-600 to-slate-800",
    "Comédia": "from-yellow-400 to-orange-500",
    "Mistério": "from-violet-600 to-purple-800",
    "Fanfic": "from-fuchsia-500 to-pink-600",
    "Poesia": "from-teal-500 to-emerald-600",
    "default": "from-primary/70 to-primary",
};

function getGenreGradient(genre?: string | null): string {
    if (!genre) return GENRE_COLORS["default"];
    return GENRE_COLORS[genre] || GENRE_COLORS["default"];
}

interface ContentListItemProps {
    title: string;
    href: string;
    seriesTitle?: string;
    seriesSlug?: string;
    chapterNumber?: number;
    authorUsername: string;
    date?: string | Date;
    commentCount?: number;
    isAnnouncement?: boolean;
    coverUrl?: string | null;
    genre?: string | null;
    /** Índice do item na lista — usado para setar priority nas primeiras imagens (LCP) */
    index?: number;
    isPinned?: boolean;
    linkUrl?: string | null;
    listType?: 'recent' | 'commented';
    isExplicit?: boolean;
}

export default function ContentListItem({
    title,
    href,
    seriesTitle,
    seriesSlug,
    chapterNumber,
    authorUsername,
    date,
    commentCount,
    isAnnouncement,
    coverUrl,
    genre,
    index = 99,
    isPinned,
    linkUrl,
    listType,
    isExplicit = false,
}: ContentListItemProps) {
    const { isMinor } = useAgeVerification();

    // Auto-hide explicit content for minor users
    if (isMinor && isExplicit) {
        return null;
    }

    const relativeDate = date
        ? (date instanceof Date ? formatDistanceToNow(date) : date)
        : null;

    const gradient = getGenreGradient(genre);
    const initial = (seriesTitle || title).charAt(0).toUpperCase();

    return (
        <div className="group relative">
            {/* Link de área total */}
            <Link href={linkUrl || href} className="absolute inset-0 z-10" aria-label={`Ler ${title}`} />

            <div className={cn(
                "flex items-start gap-3 py-3 px-1.5 rounded-lg transition-colors duration-150 group-hover:bg-muted/50",
                isPinned && "bg-primary/5 border border-primary/20 hover:bg-primary/10",
                isAnnouncement && cn(
                    "px-3 transition-all duration-200 text-white",
                    "bg-[hsl(237,55%,14%)] hover:bg-[hsl(237,55%,18%)]",
                    "dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900"
                )
            )}>

                {/* THUMBNAIL DA SÉRIE */}
                <div className="flex-shrink-0 overflow-hidden shadow-sm relative border border-black/10 w-10 aspect-[2/3] rounded-md">
                    <Image
                        src={coverUrl ? getMediaUrl(coverUrl) : undefined}
                        alt={seriesTitle || title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        priority={index < 5}
                        fallbackType="cover-minimal"
                    />
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 min-w-0">
                    {/* Para comunicados: título primeiro (2 linhas), série abaixo */}
                    {isAnnouncement ? (
                        <>
                            {/* Série ACIMA do título */}
                            <div className="text-xs text-blue-300/70 dark:text-slate-500 font-medium truncate mb-0.5">
                                {formatTitle(seriesTitle || "Comunicados Oficiais")}
                            </div>
                            {/* Título do comunicado em até 2 linhas */}
                            <h3 className="text-sm font-semibold transition-colors line-clamp-2 leading-snug text-white dark:text-slate-950 group-hover:text-blue-200 dark:group-hover:text-primary">
                                {formatTitle(title)}
                            </h3>
                        </>
                    ) : (
                        <>
                            {/* Série + capítulo (acima do título) */}
                            <div className={cn(
                                "flex items-center gap-1.5 text-xs mb-0.5 truncate",
                                "text-muted-foreground"
                            )}>
                                {seriesTitle ? (
                                    <>
                                        <span className="font-medium truncate max-w-[140px] md:max-w-[200px] text-foreground/80">
                                            {formatTitle(seriesTitle)}
                                        </span>
                                        {chapterNumber !== undefined && chapterNumber !== null && (
                                            <span className="shrink-0 text-muted-foreground/60">
                                                • Cap. {chapterNumber}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="font-medium text-foreground/80">Publicação</span>
                                )}
                            </div>

                            {/* Título do Capítulo / Obra */}
                            <h3 className="text-sm font-semibold transition-colors line-clamp-1 leading-snug text-foreground group-hover:text-primary">
                                {formatTitle(title)}
                            </h3>
                        </>
                    )}

                    {/* Meta: Autor + Data + Comentários */}
                    <div className={cn(
                        "flex items-center gap-3 mt-1 text-[11px]",
                        isAnnouncement 
                            ? "text-blue-300/60 dark:text-slate-500" 
                            : "text-muted-foreground"
                    )}>
                        <span className={cn(
                            "font-medium hover:underline",
                            isAnnouncement 
                            ? "text-blue-200/80 hover:text-white dark:text-slate-700 dark:hover:text-slate-950" 
                            : "text-foreground/70"
                        )}>
                            @{authorUsername}
                        </span>

                        {relativeDate && (
                            <span className="flex items-center gap-1">
                                <Clock size={11} className="shrink-0" />
                                {relativeDate}
                            </span>
                        )}

                        {commentCount !== undefined && commentCount > 0 && (
                            <span className={cn(
                                "flex items-center gap-1 font-medium ml-auto",
                                isAnnouncement 
                            ? "text-blue-200 font-semibold dark:text-primary" 
                            : "text-primary"
                            )}>
                                <MessageSquare size={11} className="shrink-0" />
                                {commentCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
