"use client";

import React from "react";
import Link from "next/link";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { Eye, MessageSquare, FileText, Trophy, Check } from "lucide-react";
import { formatTitle, cn, getMediaUrl, formatCompactNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";

export type ContentCardVariant = "cover" | "compact" | "horizontal";
export type ContentType = "story" | "series" | "chapter" | "profile";

export interface ContentCardProps {
  variant: ContentCardVariant;
  type?: ContentType;
  title: string;
  href: string;
  isPinned?: boolean;
  expiresAt?: string | null;
  subtitle?: {
    text: string;
    icon?: React.ElementType;
    href?: string;
  };
  coverUrl?: string | null;
  summary?: string;
  rank?: number;
  tags?: string[];
  actions?: React.ReactNode;
  authorAvatar?: string | null;
  badges?: {
    topRight?: string | number;
    isCompleted?: boolean;
    isExplicit?: boolean;
    isPublished?: boolean;
    isAbandoned?: boolean;
  };
  footer: {
    author: string;
    date?: string;
    metrics?: {
      views?: number;
      comments?: number;
      chapters?: number;
    };
  };
  className?: string;
  searchQuery?: string;
  hideTitle?: boolean;
  isAnnouncementPost?: boolean;
  priority?: boolean;
  titlePosition?: "inside" | "below";
  hideViewsBadge?: boolean;
}

const highlightText = (text: string, query: string) => {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const Countdown = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <Badge variant="destructive" className="text-xs">
      Expira em: {timeLeft}
    </Badge>
  );
};

import UserAvatar from "./UserAvatar";
import { useAgeVerification } from "@/hooks/useAgeVerification";

export default function ContentCard({
  variant,
  type,
  title,
  href,
  isPinned,
  expiresAt,
  subtitle,
  coverUrl,
  summary,
  rank,
  tags,
  actions,
  authorAvatar,
  badges,
  footer,
  className = "",
  searchQuery = "",
  hideTitle = false,
  isAnnouncementPost = false,
  priority = false,
  titlePosition = "below",
  hideViewsBadge = false,
}: ContentCardProps) {
  const { isMinor } = useAgeVerification();
  const formattedTitle = formatTitle(title);
  const [imgError, setImgError] = React.useState(false);

  // Auto-hide explicit content for minors
  if (isMinor && (badges?.isExplicit || (badges as any)?.is_explicit)) {
    return null;
  }

  // --- RENDER: HORIZONTAL VARIANT ---
  if (variant === "horizontal") {
    const isProfile = type === "profile";
    return (
      <div className={cn(
        "group relative flex gap-3 md:gap-4 p-4 rounded-xl border-none overflow-hidden bg-muted hover:bg-muted/80 transition-colors",
        className
      )}>
        {/* Cover / Profile Image */}
        <Link href={href} className="relative flex-shrink-0 w-24 md:w-32 aspect-[2/3] rounded-sm overflow-hidden bg-muted/10 border border-black/5">
          {isProfile ? (
            <UserAvatar src={authorAvatar} alt={title} size={160} className="w-full h-full object-cover" />
          ) : (
            <Image
              src={coverUrl && !imgError ? getMediaUrl(coverUrl) : undefined}
              alt={formattedTitle}
              fill
              sizes="(max-width: 768px) 160px, 320px"
              className="object-cover transition-transform duration-500"
              onError={() => setImgError(true)}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
          )}

          {rank && (
            <div className="absolute top-0 left-0 bg-primary text-primary-foreground font-bold px-3.5 py-1.5 rounded-br-sm z-10 text-xs tracking-tighter">
              #{rank}
            </div>
          )}
        </Link>

        {/* Content Info */}
        <div className="flex-1 min-w-0 flex flex-col py-0.5">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              {type && (
                <Badge variant="secondary" className="text-[10px] h-5 bg-white/50 border-none shadow-none">
                  {type === 'story' ? 'História' : type === 'series' ? 'Série' : type === 'chapter' ? 'Capítulo' : 'Escritor'}
                </Badge>
              )}

              {subtitle?.text && (
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-border" />
                  {subtitle.text}
                </span>
              )}

              {badges?.isCompleted !== undefined && (
                <SeriesStatusBadge isCompleted={badges.isCompleted} size="sm" />
              )}
              {badges?.isAbandoned && (
                <Badge variant="destructive" className="text-[10px] h-5 bg-amber-500 hover:bg-amber-600 text-amber-950 border-none shadow-none font-bold">
                  Abandonada
                </Badge>
              )}
              {badges?.isExplicit && (
                <SeriesStatusBadge isExplicit={true} size="sm" />
              )}
            </div>
            {actions && <div className="flex-shrink-0 animate-reveal fade-in slide-in-from-right-2 duration-300">{actions}</div>}
          </div>

          <Link href={href} className="block mb-1">
            <h3 className="scroll-m-20 text-sm md:text-base font-semibold tracking-tight text-foreground hover:underline transition-colors line-clamp-1">
              {highlightText(formattedTitle, searchQuery)}
            </h3>
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <Link
              href={`/profile/${footer.author}`}
              className="font-semibold text-[#484DB5] hover:underline relative z-10 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              @{footer.author.toLowerCase()}
            </Link>

            <div className="flex items-center gap-2 tabular-nums">
              {/* Views Badge - Wattpad style */}
              {!hideViewsBadge && footer.metrics?.views !== undefined && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Eye size={11} className="opacity-70" />
                  <span>{formatCompactNumber(footer.metrics.views)}</span>
                </span>
              )}
              {footer.metrics?.chapters !== undefined && (
                <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-black border-none shadow-none text-white font-bold flex items-center gap-1">
                  <FileText size={11} />
                  {footer.metrics.chapters} {footer.metrics.chapters === 1 ? 'capítulo' : 'capítulos'}
                </Badge>
              )}
              {footer.metrics?.comments !== undefined && (
                <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-white/50 border-none shadow-none text-muted-foreground flex items-center gap-1">
                  <MessageSquare size={11} className="opacity-60" /> {footer.metrics.comments}
                </Badge>
              )}
            </div>
          </div>

          {summary && (
            <p className="mt-2 text-muted-foreground line-clamp-2 md:line-clamp-2 leading-relaxed font-medium raw-content">
              {summary}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-white/50 border-none shadow-none">
                  #{tag.toLowerCase()}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER: COVER VARIANT ---
  if (variant === "cover") {
    const hasBadgesRow = !!(rank || badges?.isAbandoned || (!hideViewsBadge && footer.metrics?.views !== undefined));

    return (
      <Link href={href} className={`group flex flex-col h-full ${className}`}>
        {/* Cover Container */}
        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-sm bg-muted/5 shadow-sm border border-border/50">
          <Image
            src={coverUrl && !imgError ? getMediaUrl(coverUrl) : undefined}
            alt={formattedTitle}
            fill
            sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
          {badges?.isCompleted && (
            <div 
              className="absolute bottom-1.5 right-1.5 bg-success text-white font-semibold p-0.5 rounded-full z-10 h-5 w-5 flex items-center justify-center shadow-md"
              title="Série Concluída"
            >
              <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
            </div>
          )}
        </div>

        {/* Badges row - between cover and title */}
        {hasBadgesRow && (
          <div className="mt-1.5 mb-1 flex items-center justify-between gap-1 w-full px-0.5">
            {/* Left side: Rank Badge / Abandoned Badge */}
            <div className="flex items-center gap-1 min-w-0">
              {rank && (
                <Badge 
                  variant="secondary" 
                  className="shadow-none px-1.5 py-0.5 text-[9px] font-extrabold leading-none select-none shrink-0 h-5 flex items-center justify-center bg-black hover:bg-black text-white border-none rounded-xs"
                  title={`${rank}º Lugar no Ranking`}
                >
                  #{rank}
                </Badge>
              )}
              {badges?.isAbandoned && (
                <Badge variant="destructive" className="bg-amber-500 text-amber-950 border-none shadow-none font-bold text-[9px] px-1.5 py-0.5 leading-none shrink-0 h-5" title="Série Abandonada">
                  Aba.
                </Badge>
              )}
            </div>

            {/* Right side: Views */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!hideViewsBadge && footer.metrics?.views !== undefined && (
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground tabular-nums">
                  <Eye size={9} className="opacity-60" />
                  <span>{formatCompactNumber(footer.metrics.views)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Title BELOW the cover */}
        <div className={cn(
          "w-full px-0.5 text-center md:text-left",
          hasBadgesRow ? "mt-0.5" : "mt-2"
        )}>
          <p className="text-[10px] md:text-xs font-bold leading-[1.15] text-foreground line-clamp-3 transition-colors group-hover:text-primary" title={formattedTitle}>
            {formattedTitle}
          </p>
        </div>
      </Link>
    );
  }

  // --- RENDER: COMPACT VARIANT ---
  if (variant === "compact") {
    return (
      <Link href={href} className={cn("group block", className)}>
        <div className="relative aspect-[2/3] rounded-sm overflow-hidden bg-muted/5 border border-border/50 mb-2 shadow-sm">
          <Image
            src={coverUrl && !imgError ? getMediaUrl(coverUrl) : undefined}
            alt={formattedTitle}
            fill
            sizes="120px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            priority={priority}
          />
        </div>
        <div className="px-0.5">
          <h4 className="text-[10px] md:text-xs font-bold leading-[1.15] text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {formattedTitle}
          </h4>
          <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium mt-0.5">
            @{footer.author.toLowerCase()}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <Card>
        <CardContent className="p-6">
          <Link href={href} className="hover:underline">
            <h3 className="text-xl font-semibold leading-none tracking-tight mb-2">
              {formattedTitle}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {summary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
