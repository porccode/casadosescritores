"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, MoreVertical, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Skeleton } from '@/components/ui/skeleton';
import { getMediaUrl } from '@/lib/utils';

interface ReadingItem {
    seriesId: string;
    seriesTitle: string;
    seriesSlug: string;
    coverUrl: string;
    genre: string;
    chapterCount: number;
    isCompleted: boolean;
    authorName: string;
    lastReadChapterNumber: number;
    nextChapterSlug: string;
    nextChapterNumber: number;
    isUpToDate: boolean;
}

export default function ContinueLendo() {
    const [items, setItems] = useState<ReadingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState(false);
    const [canScrollNext, setCanScrollNext] = useState(false);

    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };

        api.on("select", onSelect);
        api.on("reInit", onSelect);
        onSelect();

        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch('/api/reading-history');
                const data = await res.json();
                setItems(data.items || []);
            } catch (error) {
                console.error('Erro ao buscar histórico de leitura:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    const handleRemove = async (seriesId: string) => {
        // Optimistic update
        setItems(prev => prev.filter(item => item.seriesId !== seriesId));
        try {
            await fetch('/api/reading-history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seriesId })
            });
        } catch (error) {
            console.error('Erro ao remover do histórico:', error);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[120px] w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (items.length === 0) return null;

    return (
        <section className="relative w-full">
            <Carousel setApi={setApi} opts={{ align: "start", loop: false }} className="w-full">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="scroll-m-20 text-base md:text-xl font-semibold tracking-tight text-foreground">
                        Continuar Lendo
                    </h2>
                    
                    {/* Setas de navegação alinhadas ao header para desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => api?.scrollPrev()}
                            disabled={!canScrollPrev}
                            className="h-8 w-8 text-foreground"
                            aria-label="Item anterior"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => api?.scrollNext()}
                            disabled={!canScrollNext}
                            className="h-8 w-8 text-foreground"
                            aria-label="Próximo item"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <CarouselContent className="-ml-3">
                    {items.map((item) => {
                        const targetUrl = item.nextChapterSlug ? `/capitulo/${item.nextChapterSlug}` : `/series/${item.seriesSlug}`;
                        return (
                        <CarouselItem key={item.seriesId} className="pl-3 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                            <Card className="overflow-hidden border border-border/40 rounded-xl shadow-sm hover:shadow-md hover:border-border transition-all duration-300 bg-background hover:bg-muted/30 group h-full cursor-default relative">
                                <CardContent className="p-0 flex items-stretch h-full">
                                    {/* Link apenas na Imagem */}
                                    <Link 
                                        href={targetUrl} 
                                        className="relative w-[85px] shrink-0 overflow-hidden bg-muted group/image focus:outline-none"
                                    >
                                        <OptimizedImage
                                            src={getMediaUrl(item.coverUrl) || null!}
                                            alt={item.seriesTitle}
                                            fill
                                            className="object-cover group-hover/image:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <Play size={24} className="text-white fill-white ml-1 drop-shadow-md transform scale-90 group-hover/image:scale-100 transition-transform duration-300" />
                                        </div>
                                    </Link>

                                    {/* Content info */}
                                    <div className="flex flex-col justify-center p-3 flex-1 min-w-0 gap-1 relative">
                                        <div className="flex items-start justify-between mb-0.5 gap-2">
                                            <div className="flex items-center gap-1.5 line-clamp-1 mt-0.5">
                                                <span className="text-[10px] font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded-md truncate">
                                                    {item.genre || 'Série'}
                                                </span>
                                                {item.isUpToDate && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Em dia" />
                                                )}
                                            </div>
                                            
                                            {/* Dropdown Menu de Ações */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 text-muted-foreground hover:bg-muted focus-visible:ring-0">
                                                        <MoreVertical size={14} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 shadow-lg">
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemove(item.seriesId);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        <span className="text-xs font-medium">Remover leitura</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        
                                        <Link href={targetUrl} className="block group-hover:text-primary transition-colors focus:outline-none">
                                            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 hover:underline">
                                                {item.seriesTitle}
                                            </h3>
                                        </Link>
                                        
                                        <p className="text-xs text-muted-foreground truncate mb-2">
                                            {item.authorName}
                                        </p>

                                        <Link href={targetUrl} className="mt-auto block focus:outline-none">
                                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                <span className="font-medium text-foreground">Progresso</span>
                                                <span className="font-bold text-foreground">
                                                    Cap {item.lastReadChapterNumber} <span className="text-muted-foreground/60 font-normal">/ {item.chapterCount}</span>
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                                                    style={{ width: `${Math.min(100, (item.lastReadChapterNumber / Math.max(1, item.chapterCount)) * 100)}%` }}
                                                />
                                            </div>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                        );
                    })}
                </CarouselContent>
            </Carousel>
        </section>
    );
}
