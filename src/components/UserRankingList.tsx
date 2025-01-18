"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useAnimationControls } from "framer-motion";
import { getMediaUrl } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface UserRank {
    id: string;
    username: string;
    level: number;
    xp: number;
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    totalViews?: number;
}

interface UserRankingListProps {
    users: UserRank[];
}

/**
 * Anel de progresso SVG ao redor do avatar.
 * Renderiza um círculo de fundo + arco de progresso preenchido.
 */
function ProgressRing({
    progress,
    size,
    strokeWidth = 3,
}: {
    progress: number;
    size: number;
    strokeWidth?: number;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg
            width={size}
            height={size}
            className="absolute inset-0 -rotate-90"
        >
            {/* Trilha de fundo */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-border"
            />
            {/* Arco de progresso */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="text-[#484DB5] transition-all duration-500"
            />
        </svg>
    );
}

export default function UserRankingList({ users }: UserRankingListProps) {
    const displayUsers = users.slice(0, 27);
    const needsCarousel = displayUsers.length > 9;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const controls = useAnimationControls();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDraggable, setIsDraggable] = useState(false);
    const [maxScroll, setMaxScroll] = useState(0);

    // Constants for carousel layout
    const gap = 12; // gap-3 = 12px
    const itemsPerPage = {
        mobile: 3,
        tablet: 5,
        desktop: 9
    };

    const updateScrollButtons = (x: number, maxScroll: number) => {
        setCanScrollLeft(x < 0);
        setCanScrollRight(x > -maxScroll);
    };

    const getContainerWidths = () => {
        if (!scrollContainerRef.current) return { clientWidth: 0, scrollWidth: 0 };
        const clientWidth = scrollContainerRef.current.clientWidth;

        const itemWidth = (clientWidth - (gap * (itemsPerPage.desktop - 1))) / itemsPerPage.desktop;
        const totalItems = displayUsers.length;
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
        if (displayUsers.length > 0) {
            const calculateMaxScroll = () => {
                const { clientWidth, scrollWidth } = getContainerWidths();
                setMaxScroll(Math.max(0, scrollWidth - clientWidth));
            };

            calculateMaxScroll();

            const checkDraggable = () => {
                setIsDraggable(window.matchMedia('(min-width: 768px)').matches);
            };

            checkDraggable();

            const timer = setTimeout(() => {
                calculateMaxScroll();
                const { clientWidth, scrollWidth } = getContainerWidths();
                setCanScrollRight(scrollWidth > clientWidth);
            }, 100);

            const handleResize = () => {
                checkDraggable();
                calculateMaxScroll();
            };

            window.addEventListener('resize', handleResize);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [displayUsers]);

    if (!users || users.length === 0) {
        return (
            <Card className="bg-muted border-none">
                <CardContent className="p-6 text-center">
                    <Trophy size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum usuário no ranking.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="scroll-m-20 text-lg md:text-xl font-semibold tracking-tight text-foreground">
                    Ranking de Escritores
                </h2>

                {needsCarousel && (
                    <div className="hidden md:flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            aria-label="Escritor anterior no ranking"
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            aria-label="Próximo escritor no ranking"
                            className="h-8 w-8"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto md:overflow-x-hidden no-scrollbar"
            >
                <motion.div
                    animate={controls}
                    initial={{ x: 0 }}
                    drag={isDraggable ? "x" : false}
                    dragConstraints={{
                        left: -maxScroll,
                        right: 0
                    }}
                    dragElastic={0.1}
                    className="flex gap-3 md:cursor-grab md:active:cursor-grabbing will-change-transform pt-4 pb-2"
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
                    {displayUsers.map((user, index) => {
                        const rank = index + 1;

                        const displayName = user.first_name
                            ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
                            : user.username;

                        return (
                            <motion.div
                                key={user.id}
                                className="w-[120px] md:w-[150px] lg:w-[calc((100%-96px)/9)] flex-shrink-0 group"
                            >
                                <Link href={`/profile/${user.username}`} className="block h-full">
                                    <Card className="h-full border border-border shadow-sm bg-card hover:bg-accent/40 transition-colors relative overflow-visible rounded-xl">
                                        
                                        {/* Rank Badge Elegante flotando sobre a borda superior */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center bg-background border border-border rounded-full shadow-sm px-2.5 py-0.5 min-w-[32px]">
                                            {rank === 1 ? (
                                              <Trophy className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                                            ) : rank === 2 ? (
                                              <Trophy className="w-3.5 h-3.5 text-slate-400 fill-slate-400/20" />
                                            ) : rank === 3 ? (
                                              <Trophy className="w-3.5 h-3.5 text-amber-700 fill-amber-700/20" />
                                            ) : (
                                              <span className="text-[10px] font-bold text-muted-foreground">#{rank}</span>
                                            )}
                                        </div>

                                        <CardContent className="p-4 h-full flex flex-col items-center text-center gap-3 pt-6">
                                            {/* Avatar Centralizado Limpo */}
                                            <div className="relative flex items-center justify-center w-[52px] h-[52px] md:w-[64px] md:h-[64px]">
                                                <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-border/50 bg-muted">
                                                    {user.avatar_url ? (
                                                        <OptimizedImage
                                                            src={getMediaUrl(user.avatar_url, 'avatars')}
                                                            alt={user.username}
                                                            fill
                                                            sizes="(max-width: 768px) 52px, 64px"
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                                                            {user.username.substring(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Mini Level Indicator colado ao avatar */}
                                                <div className="absolute -bottom-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-background">
                                                    Lv.{user.level || 1}
                                                </div>
                                            </div>

                                            {/* Info: Nome */}
                                            <div className="w-full mt-2">
                                                <p className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
                                                    {displayName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
