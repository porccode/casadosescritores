"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { getLevelProgress } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import XPInfoModal from "./XPInfoModal";
import { Info, MessageSquare } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-browser";

interface LevelProgressProps {
    xp: number;
    writerXP?: number | null;
    readerXP?: number | null;
    commentsCount?: number;
    profileId?: string;
    className?: string;
}

export default function LevelProgress({ xp, writerXP, readerXP, commentsCount, profileId, className }: LevelProgressProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [totalComments, setTotalComments] = useState<number | null>(commentsCount ?? null);

    const mainProgress = getLevelProgress(xp || 0);
    
    // Progresos especializados (usando o mesmo motor de cálculo de nível)
    const writerProgress = getLevelProgress(writerXP || 0);
    const readerProgress = getLevelProgress(readerXP || 0);

    useEffect(() => {
        if (commentsCount !== undefined) {
            setTotalComments(commentsCount);
            return;
        }
        if (!profileId) return;

        const supabase = createBrowserClient();
        supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("author_id", profileId)
            .then(({ count }) => {
                if (count !== null) setTotalComments(count);
            });
    }, [profileId, commentsCount]);

    return (
        <>
            <Card 
                className={cn("cursor-pointer bg-card border border-border shadow-sm hover:border-border/80 hover:shadow-md transition-all duration-200 rounded-xl", className)}
                onClick={() => setIsModalOpen(true)}
            >
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Nível do perfil
                            </p>
                            <h3 className="text-lg font-bold text-foreground leading-none">
                                Nível {mainProgress.currentLevel}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                Total acumulado
                            </p>
                            <p className="text-lg font-bold text-foreground leading-none">
                                {mainProgress.totalXP.toLocaleString("pt-BR")}{" "}
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded ml-1">
                                    XP
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 mt-2">
                        {/* Barra Geral */}
                        <div className="space-y-1.5">
                            <Progress 
                                value={mainProgress.progressPercentage} 
                                className="h-2 bg-muted border border-muted/30" 
                                indicatorClassName="bg-primary rounded-full" 
                            />
                            <div className="flex justify-between items-center text-xs text-muted-foreground font-medium px-0.5">
                                <span>
                                    {Math.floor(mainProgress.xpInCurrentLevel).toLocaleString("pt-BR")} / {mainProgress.xpRequiredForLevelUp.toLocaleString("pt-BR")} XP
                                </span>
                                <span>
                                    Faltam {Math.ceil(mainProgress.xpRemaining).toLocaleString("pt-BR")} XP
                                </span>
                            </div>
                        </div>

                        {/* Divisor Sutil */}
                        <div className="h-px bg-border w-full" />

                        {/* Especialidades: Escritor e Leitor */}
                        <div className="grid grid-cols-2 gap-5 pt-1">
                            {/* Escritor */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Escritor
                                    </span>
                                    <span className="text-[10px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50 shrink-0">
                                        Nível {writerProgress.currentLevel}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <Progress 
                                        value={writerProgress.progressPercentage} 
                                        className="h-1.5 bg-muted" 
                                        indicatorClassName="bg-amber-500" 
                                    />
                                    <span className="text-[10px] text-muted-foreground font-medium block">
                                        {writerProgress.progressPercentage.toFixed(0)}% para o próximo nível
                                    </span>
                                </div>
                            </div>

                            {/* Leitor */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Leitor
                                    </span>
                                    <span className="text-[10px] font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50 shrink-0">
                                        Nível {readerProgress.currentLevel}
                                    </span>
                                </div>
                                <div className="space-y-1.5">
                                    <Progress 
                                        value={readerProgress.progressPercentage} 
                                        className="h-1.5 bg-muted" 
                                        indicatorClassName="bg-primary" 
                                    />
                                    <span className="text-[10px] text-muted-foreground font-medium block">
                                        {readerProgress.progressPercentage.toFixed(0)}% para o próximo nível
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Divisor Sutil */}
                        <div className="h-px bg-border w-full" />

                        {/* Contador de Comentários */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                <MessageSquare size={14} className="text-primary shrink-0" />
                                <span>Comentários realizados</span>
                            </div>
                            <span className="font-bold text-foreground">
                                {totalComments !== null ? totalComments.toLocaleString("pt-BR") : "..."}
                            </span>
                        </div>

                        {/* Dica interativa para abrir informações */}
                        <div className="pt-3 mt-1 border-t border-border/50 flex items-center justify-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                            <Info size={14} className="shrink-0" />
                            <span>Clique aqui para saber como funciona</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <XPInfoModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                totalXP={mainProgress.totalXP}
            />
        </>
    );
}
