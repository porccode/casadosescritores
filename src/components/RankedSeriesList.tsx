"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { generateSlug, sanitizeSlug, isSeriesAbandoned } from "@/lib/utils";
import ContentCard from "./ContentCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";

import { FeaturedSeriesItem as SeriesWithAuthor } from "@/types/home";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useAgeVerification } from "@/hooks/useAgeVerification";

interface RankedSeriesListProps {
  title: string;
  titleHref?: string;
  orderByField?: string;
  orderByAscending?: boolean;
  limit?: number;
  initialData?: SeriesWithAuthor[];
  showRank?: boolean;
  layout?: "carousel" | "grid" | "responsive-grid";
  cardSizeMultiplier?: number;
  titlePosition?: "inside" | "below";
  hideViewsBadge?: boolean;
  isCompleted?: boolean;
  minChapterCount?: number;
  exactChapterCount?: number;
}

export default function RankedSeriesList({
  title,
  titleHref,
  orderByField = "view_count",
  orderByAscending = false,
  limit = 27,
  initialData = [],
  showRank = true,
  layout = "carousel",
  cardSizeMultiplier = 1,
  titlePosition = "below",
  hideViewsBadge = false,
  isCompleted,
  minChapterCount,
  exactChapterCount,
}: RankedSeriesListProps): React.ReactElement | null {
  const { isMinor } = useAgeVerification();
  const [seriesWithDetails, setSeriesWithDetails] = useState<SeriesWithAuthor[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const controls = useAnimationControls();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggable, setIsDraggable] = useState(false);

  // Filter explicit series for minor users
  const filteredSeries = useMemo(() => {
    if (!isMinor) return seriesWithDetails;
    return (seriesWithDetails || []).filter((s) => !s.is_explicit);
  }, [seriesWithDetails, isMinor]);

  // Constants for carousel layout
  const gap = layout === "grid" ? 8 : 12;
  const itemsPerPage = {
    mobile: 3,
    tablet: 5,
    desktop: 9
  };

  useEffect(() => {
    async function loadSeries() {
      if (initialData && initialData.length > 0) {
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient();

      try {
        let query = supabase
          .from("series_with_author")
          .select(
            `
                        id,
                        title,
                        cover_url,
                        genre,
                        view_count,
                        is_completed,
                        is_explicit,
                        author_id,
                        author_username,
                        author_first_name,
                        author_last_name,
                        created_at,
                        updated_at,
                        chapter_count,
                        is_archived,
                        slug
                    `
          )
          .eq("is_archived", false)
          .not("cover_url", "is", null);

        if (isCompleted !== undefined) {
          query = query.eq("is_completed", isCompleted);
        }
        if (minChapterCount !== undefined) {
          query = query.gt("chapter_count", minChapterCount);
        }
        if (exactChapterCount !== undefined) {
          query = query.eq("chapter_count", exactChapterCount);
        }

        const { data: initialSeries, error: seriesError } = await query
          .order(orderByField, { ascending: orderByAscending })
          .limit(limit);

        if (seriesError) {
          console.error(`Erro na consulta das séries:`, seriesError);
          setLoading(false);
          return;
        }

        if (!initialSeries || (initialSeries as any[]).length === 0) {
          setLoading(false);
          return;
        }

        const seriesData = (initialSeries as unknown as any[]).map((s: any) => ({
          ...s,
          author_name: s.author_first_name && s.author_last_name
            ? `${s.author_first_name} ${s.author_last_name}`.trim()
            : s.author_username || 'Autor'
        })) as SeriesWithAuthor[];
        setSeriesWithDetails(seriesData);
      } catch (error) {
        console.error(`Erro geral ao buscar séries:`, error);
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, [initialData, limit, orderByField, orderByAscending, isCompleted, minChapterCount, exactChapterCount]);

  const updateScrollButtons = (x: number, maxScroll: number) => {
    setCanScrollLeft(x < 0);
    setCanScrollRight(Math.abs(x) < maxScroll - 5);
  };

  const getContainerWidths = () => {
    if (!scrollContainerRef.current) return { clientWidth: 0, scrollWidth: 0 };

    const clientWidth = scrollContainerRef.current.clientWidth;
    const itemWidth = (clientWidth - (gap * (itemsPerPage.desktop - 1))) / itemsPerPage.desktop;
    const totalItems = filteredSeries.length;
    const scrollWidth = (totalItems * itemWidth) + ((totalItems - 1) * gap);

    return { clientWidth, scrollWidth };
  };

  const scroll = async (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const { clientWidth, scrollWidth } = getContainerWidths();
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const scrollAmount = clientWidth * 0.8;

    let targetX = currentIndex + (direction === "left" ? scrollAmount : -scrollAmount);

    if (targetX > 0) targetX = 0;
    if (targetX < -maxScroll) targetX = -maxScroll;

    setCurrentIndex(targetX);
    updateScrollButtons(targetX, maxScroll);

    await controls.start({
      x: targetX,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 30,
        mass: 1
      }
    });
  };

  useEffect(() => {
    if (filteredSeries.length > 0 && layout === "carousel") {
      const checkDraggable = () => {
        setIsDraggable(window.matchMedia('(min-width: 768px)').matches);
      };

      checkDraggable();

      const timer = setTimeout(() => {
        const { clientWidth, scrollWidth } = getContainerWidths();
        setCanScrollRight(scrollWidth > clientWidth);
      }, 100);

      window.addEventListener('resize', checkDraggable);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkDraggable);
      };
    }
  }, [filteredSeries, layout]);

  const getCardWidthClass = () => {
    return cardSizeMultiplier < 1
      ? "w-[90px] md:w-[75px] lg:w-[calc((100%-80px)/8)] xl:w-[calc((100%-110px)/11)]"
      : "w-[110px] md:w-[100px] lg:w-[calc((100%-96px)/9)]";
  };

  const widthClass = getCardWidthClass();

  const getGapClass = () => {
    return layout === "grid" ? "gap-2" : "gap-3";
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-6 w-36 bg-muted animate-pulse rounded mb-4" />
        <div className={`flex ${getGapClass()} overflow-hidden`}>
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={`${widthClass} flex-shrink-0 space-y-2`}>
                <div className="aspect-[2/3] bg-muted animate-pulse rounded-md" />
                <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (filteredSeries.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header with title and arrows */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="scroll-m-20 text-base md:text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>

        {/* Navigation Arrows */}
        <div className={layout === "carousel" ? "hidden md:flex items-center gap-2" : "hidden"}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label={`Série anterior em ${title}`}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label={`Próxima série em ${title}`}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {layout === "responsive-grid" ? (
        <>
          {/* Mobile View: Horizontal Scroll Carousel */}
          <div className="block md:hidden overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3">
              {filteredSeries.map((serie, index) => (
                <div key={serie.id} className="w-[95px] flex-shrink-0">
                  <ContentCard
                    variant="cover"
                    title={serie.title}
                    href={`/series/${serie.slug || generateSlug(serie.title, serie.id)}`}
                    coverUrl={serie.cover_url}
                    rank={showRank ? index + 1 : undefined}
                    badges={{
                      isCompleted: serie.is_completed || false,
                      isExplicit: serie.is_explicit || false,
                      isAbandoned: isSeriesAbandoned(serie.chapter_count, serie.updated_at, serie.is_completed)
                    }}
                    subtitle={{ text: serie.genre || "" }}
                    footer={{
                      author: serie.author_name || "Autor",
                      metrics: { views: serie.view_count || serie.views || 0 },
                    }}
                    priority={index < 4}
                    titlePosition={titlePosition}
                    hideViewsBadge={hideViewsBadge}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View: Multi-column Grid */}
          <div className="hidden md:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 gap-y-4 sm:gap-y-6">
            {filteredSeries.map((serie, index) => (
              <div key={serie.id} className="w-full">
                <ContentCard
                  variant="cover"
                  title={serie.title}
                  href={`/series/${serie.slug || generateSlug(serie.title, serie.id)}`}
                  coverUrl={serie.cover_url}
                  rank={showRank ? index + 1 : undefined}
                  badges={{
                    isCompleted: serie.is_completed || false,
                    isExplicit: serie.is_explicit || false,
                    isAbandoned: isSeriesAbandoned(serie.chapter_count, serie.updated_at, serie.is_completed)
                  }}
                  subtitle={{ text: serie.genre || "" }}
                  footer={{
                    author: serie.author_name || "Autor",
                    metrics: { views: serie.view_count || serie.views || 0 },
                  }}
                  priority={index < 8}
                  titlePosition={titlePosition}
                  hideViewsBadge={hideViewsBadge}
                />
              </div>
            ))}
          </div>
        </>
      ) : layout === "grid" ? (
        <div className={`flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible scrollbar-hide ${getGapClass()} justify-start pb-4 md:pb-0`}>
          {filteredSeries.map((serie, index) => (
            <div key={serie.id} className={`${widthClass} flex-shrink-0 h-full`}>
              <ContentCard
                variant="cover"
                title={serie.title}
                href={`/series/${serie.slug || generateSlug(serie.title, serie.id)}`}
                coverUrl={serie.cover_url}
                rank={showRank ? index + 1 : undefined}
                badges={{
                  isCompleted: serie.is_completed || false,
                  isExplicit: serie.is_explicit || false,
                  isAbandoned: isSeriesAbandoned(serie.chapter_count, serie.updated_at, serie.is_completed)
                }}
                subtitle={{ text: serie.genre || "" }}
                footer={{
                  author: serie.author_name || "Autor",
                  metrics: { views: serie.view_count || serie.views || 0 },
                }}
                priority={index < 8}
                titlePosition={titlePosition}
                hideViewsBadge={hideViewsBadge}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto md:overflow-hidden no-scrollbar pb-4 md:pb-0"
        >
          <motion.div
            animate={controls}
            initial={{ x: 0 }}
            className={`flex ${getGapClass()} md:cursor-grab md:active:cursor-grabbing will-change-transform`}
            drag={isDraggable ? "x" : false}
            dragConstraints={{
              left: -Math.max(0, getContainerWidths().scrollWidth - getContainerWidths().clientWidth),
              right: 0
            }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (!isDraggable) return;
              const { clientWidth, scrollWidth } = getContainerWidths();
              const maxScroll = Math.max(0, scrollWidth - clientWidth);
              let newX = currentIndex + info.offset.x;

              if (newX > 0) newX = 0;
              if (newX < -maxScroll) newX = -maxScroll;

              setCurrentIndex(newX);
              updateScrollButtons(newX, maxScroll);

              controls.start({
                x: newX,
                transition: { type: "spring", stiffness: 300, damping: 30 }
              });
            }}
          >
            {filteredSeries.map((serie, index) => (
              <motion.div
                key={serie.id}
                className={`${widthClass} flex-shrink-0 h-full`}
              >
                <ContentCard
                  variant="cover"
                  title={serie.title}
                  href={`/series/${serie.slug || generateSlug(serie.title, serie.id)}`}
                  coverUrl={serie.cover_url}
                  rank={showRank ? index + 1 : undefined}
                  badges={{
                    isCompleted: serie.is_completed || false,
                    isExplicit: serie.is_explicit || false,
                    isAbandoned: isSeriesAbandoned(serie.chapter_count, serie.updated_at, serie.is_completed)
                  }}
                  subtitle={{ text: serie.genre || "" }}
                  footer={{
                    author: serie.author_name || "Autor",
                    metrics: { views: serie.view_count || serie.views || 0 },
                  }}
                  priority={index < 8}
                  titlePosition={titlePosition}
                  hideViewsBadge={hideViewsBadge}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
