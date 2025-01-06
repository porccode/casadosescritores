"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Layers, Users, Eye, BookOpen, Loader2, MessageSquare } from "lucide-react";
import { SearchResult } from "@/types/search";
import { formatTitle, generateSlug, sanitizeSlug, getMediaUrl, cn, createSummary, formatCompactNumber } from "@/lib/utils";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import SearchFilterBar from "@/components/SearchFilterBar";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { createBrowserClient } from "@/lib/supabase-browser";
import { useAgeVerification } from "@/hooks/useAgeVerification";

type TabType = "all" | "series" | "profiles" | "communities" | "chapters";

interface SearchResultsProps {
  initialData: any;
  query: string;
  initialFilters: {
    genre: string | null;
    status: string | null;
    order: string;
  };
}

export default function SearchResults({ initialData, query, initialFilters }: SearchResultsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  const { isMinor } = useAgeVerification();

  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get("tab") as TabType) || "all");
  const [filters, setFilters] = useState(initialFilters);

  // Sync state with URL manually for filters
  const updateUrl = useCallback((newFilters: any, tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.genre) params.set("genre", newFilters.genre); else params.delete("genre");
    if (newFilters.status) params.set("status", newFilters.status); else params.delete("status");
    if (newFilters.order !== "relevance") params.set("order", newFilters.order); else params.delete("order");
    params.set("tab", tab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
    updateUrl(filters, value);
  };

  const handleFilterChange = (newFilterDelta: any) => {
    const updatedFilters = { ...filters, ...newFilterDelta };
    setFilters(updatedFilters);
    updateUrl(updatedFilters, activeTab);
  };

  // Fetcher for Infinite Scroll
  const fetcher = useCallback(async (offset: number, limit: number) => {
    if (activeTab === "communities") {
      const { data: comms } = await supabase
        .from("communities" as any)
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .range(offset, offset + limit - 1);
      
      return (comms || []).map((c: any) => ({
        ...c,
        type: "community" as const,
        title: c.name
      }));
    }

    const { data } = await (supabase.rpc as any)("search_content", {
      search_query: query,
      content_type: activeTab === "all" ? "all" : activeTab,
      p_limit: limit,
      p_offset: offset,
      p_genre: filters.genre,
      p_is_completed: filters.status === "completed" ? true : filters.status === "ongoing" ? false : null,
      p_order_by: filters.order
    });

    if (activeTab === "series") return (data?.series || []).map((s: any) => ({ ...s, type: "series" }));
    if (activeTab === "profiles") return (data?.profiles || []).map((p: any) => ({ ...p, type: "profile" }));
    if (activeTab === "chapters") return (data?.chapters || []).map((c: any) => ({ ...c, type: "chapter" }));

    // Para a tab "all", combinamos os resultados
    if (activeTab === "all") {
      const { data: comms } = await supabase
        .from("communities" as any)
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      const combined = [
        ...(data?.series || []).map((s: any) => ({ ...s, type: "series" })),
        ...(data?.profiles || []).map((p: any) => ({ ...p, type: "profile" })),
        ...(data?.chapters || []).map((c: any) => ({ ...c, type: "chapter" })),
        ...(comms || []).map((c: any) => ({ ...c, type: "community" as const, title: c.name }))
      ];
      return combined;
    }

    return [];
  }, [query, activeTab, filters, supabase]);

  const initialDataForTab = React.useMemo(() => {
    if (activeTab === "all") {
      return [
        ...(initialData?.series || []).map((s: any) => ({ ...s, type: "series" })),
        ...(initialData?.profiles || []).map((p: any) => ({ ...p, type: "profile" })),
        ...(initialData?.chapters || []).map((c: any) => ({ ...c, type: "chapter" })),
        ...(initialData?.communities || []).map((c: any) => ({ ...c, type: "community" as const, title: c.name }))
      ];
    }
    if (activeTab === "series") {
      return (initialData?.series || []).map((s: any) => ({ ...s, type: "series" }));
    }
    if (activeTab === "profiles") {
      return (initialData?.profiles || []).map((p: any) => ({ ...p, type: "profile" }));
    }
    if (activeTab === "chapters") {
      return (initialData?.chapters || []).map((c: any) => ({ ...c, type: "chapter" }));
    }
    if (activeTab === "communities") {
      return (initialData?.communities || []).map((c: any) => ({ ...c, type: "community" as const, title: c.name }));
    }
    return [];
  }, [activeTab, initialData]);

  const {
    data: rawItems,
    isLoading,
    isLoadingMore,
    hasMore,
    refresh,
    sentinelRef
  } = useInfiniteScroll<SearchResult>({
    fetchData: fetcher,
    initialData: initialDataForTab,
    pageSize: 20
  });

  // Garantir que não temos duplicatas no frontend e filtrar conteúdo sensível para menores
  const items = React.useMemo(() => {
    const seen = new Set();
    return (rawItems || []).filter((item: SearchResult) => {
      if (isMinor && (item as any).is_explicit) return false;
      const key = `${item.id}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rawItems, isMinor]);

  // Refresh data when filters or tab change
  useEffect(() => {
    refresh();
  }, [filters, activeTab]);

  return (
    <div className="space-y-6">
      <SearchFilterBar
        currentGenre={filters.genre}
        currentStatus={filters.status}
        currentOrder={filters.order}
        onFilterChange={handleFilterChange}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-transparent gap-2 h-auto p-0 mb-6">
          <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-background">
            <Search size={14} />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="series" className="gap-2 data-[state=active]:bg-background">
            <Layers size={14} />
            Séries
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-2 data-[state=active]:bg-background">
            <Users size={14} />
            Escritores
          </TabsTrigger>
          <TabsTrigger value="communities" className="gap-2 data-[state=active]:bg-background">
            <MessageSquare size={14} />
            Comunidades
          </TabsTrigger>
          <TabsTrigger value="chapters" className="gap-2 data-[state=active]:bg-background">
            <BookOpen size={14} />
            Capítulos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Resultados */}
      {items.length === 0 && !isLoading ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Search size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Tente ajustar seus filtros ou usar palavras-chave diferentes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const isProfile = item.type === "profile" || !!item.username;
            const isCommunity = item.type === "community";
            const isChapter = item.type === "chapter";
            
            const href = isProfile
              ? `/profile/${item.username}`
              : isCommunity
                ? `/comunidades/${item.slug}`
                : isChapter
                  ? `/capitulo/${item.slug}`
                  : `/series/${item.slug || generateSlug(item.title, item.id)}`;

            const cardKey = `${item.id}-${item.type || (isProfile ? 'profile' : 'series')}-${activeTab}`;

            return (
              <Link
                key={cardKey}
                href={href}
                className="block group"
              >
                <Card className="overflow-hidden border-border hover:border-primary/50 hover:shadow-md transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex h-32">
                      {/* Visual */}
                      <div className="w-24 shrink-0 bg-muted relative overflow-hidden">
                        {isCommunity ? (
                          <div className={cn("w-full h-full flex flex-col justify-end p-2 relative", item.cover_color)}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm border border-background/25", item.avatar_color)}>
                                {(item.name || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ) : (item.cover_url || item.avatar_url || item.series_cover) ? (
                          <Image
                            src={getMediaUrl(item.cover_url || item.avatar_url || item.series_cover, item.avatar_url ? 'avatars' : 'covers')}
                            alt=""
                            fill
                            className="object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <span className="text-xl font-bold text-primary/20">
                              {(item.title || item.username || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                              {isCommunity ? item.name : (item.title || item.username)}
                            </h3>
                            <div className="flex gap-1.5 shrink-0">
                              {isCommunity ? (
                                <Badge
                                  variant={item.is_private ? "destructive" : "secondary"}
                                  className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0"
                                >
                                  {item.is_private ? "Privada" : "Pública"}
                                </Badge>
                              ) : isChapter ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 border-primary/30 text-primary"
                                >
                                  Cap. {item.chapter_number}
                                </Badge>
                              ) : (
                                <>
                                  {item.is_completed !== undefined && (
                                    <SeriesStatusBadge isCompleted={item.is_completed} size="sm" />
                                  )}
                                  {item.is_explicit && (
                                    <SeriesStatusBadge isExplicit={true} size="sm" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {(item.author_username || item.series_title) && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {isChapter ? (
                                <>
                                  por <span className="font-semibold text-foreground">@{item.author_username}</span> em <span className="font-semibold text-primary">{item.series_title}</span>
                                </>
                              ) : (
                                <span className="font-semibold text-foreground">@{item.author_username}</span>
                              )}
                            </p>
                          )}

                          {(item.description || item.bio || item.summary) && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {isChapter ? createSummary(item.summary, 180) : (item.description || item.bio || item.summary)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {isCommunity ? (
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-bold">Comunidade</span>
                              {item.created_at && (
                                <span>• Criada em {new Date(item.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          ) : isChapter ? (
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-bold">Capítulo</span>
                              {item.view_count !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Eye size={12} />
                                  {formatCompactNumber(item.view_count)} visualizações
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              {item.genre && <span>{item.genre}</span>}
                              {item.series_count !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Layers size={12} />
                                  {item.series_count} séries
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Loading Sentinel */}
      <div ref={sentinelRef} className="py-10 flex justify-center">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Loader2 size={16} className="animate-spin text-primary" />
            Carregando mais resultados...
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Fim dos resultados
          </p>
        )}
      </div>
    </div>
  );
}
