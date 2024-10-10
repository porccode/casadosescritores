"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Pin, List } from "lucide-react";
import { formatTitle } from "@/lib/utils";

interface FeaturedWorkCardProps {
    series: {
        id: string;
        title: string;
        slug: string;
        cover_url?: string | null;
        genre?: string | null;
        chapter_count?: number;
        description?: string | null;
    };
}

export default function FeaturedWorkCard({ series }: FeaturedWorkCardProps) {
    const href = `/series/${series.slug}`;

    return (
        <Card className="group overflow-hidden border shadow-none hover:bg-accent/50 transition-colors cursor-pointer relative">
            <Link href={href} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10">
                <span className="sr-only">Ver {series.title}</span>
            </Link>
            
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Pin className="size-3.5 text-primary fill-current" />
                    Obra em Destaque
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-0">
                <div className="flex gap-4">
                    {/* Compact 14x21 Cover */}
                    <div className="relative w-14 h-[84px] shrink-0 rounded-sm overflow-hidden bg-muted border shadow-sm">
                        {series.cover_url ? (
                            <Image
                                src={series.cover_url}
                                alt={series.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30">
                                <BookOpen size={20} />
                            </div>
                        )}
                    </div>

                    {/* Content Section Section */}
                    <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-0.5">
                            {series.genre && (
                                <span className="text-primary font-bold">{series.genre}</span>
                            )}
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                                <List className="size-2.5" />
                                {series.chapter_count || 0} {series.chapter_count === 1 ? "capítulo" : "capítulos"}
                            </span>
                        </div>
                        
                        <h3 className="text-[15px] font-bold leading-none text-foreground mb-1.5">
                            {formatTitle(series.title)}
                        </h3>

                        {series.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-3 leading-[1.3] italic">
                                "{series.description}"
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
