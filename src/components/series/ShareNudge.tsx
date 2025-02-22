"use client";

import { useState } from "react";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ShareNudgeProps {
    seriesTitle: string;
    seriesUrl: string;
    viewCount: number;
    /** Threshold para exibir o nudge (padrão: 10 views) */
    threshold?: number;
    className?: string;
}

/**
 * ShareNudge
 *
 * Exibe um callout editorial para o autor quando a série tem poucas visualizações,
 * incentivando o compartilhamento. Usa `navigator.share` quando disponível,
 * com fallback para cópia de link.
 *
 * Só renderiza quando `viewCount < threshold` (padrão: 10).
 */
export function ShareNudge({
    seriesTitle,
    seriesUrl,
    viewCount,
    threshold = 10,
    className,
}: ShareNudgeProps) {
    const [copied, setCopied] = useState(false);

    // Só aparece para o autor, quando views estão abaixo do threshold
    if (viewCount >= threshold) return null;

    const handleShare = async () => {
        const shareData = {
            title: seriesTitle,
            text: `Leia "${seriesTitle}" na Casa dos Escritores`,
            url: seriesUrl,
        };

        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // Usuário cancelou — sem ação necessária
            }
        } else {
            // Fallback: copiar link
            try {
                await navigator.clipboard.writeText(seriesUrl);
                setCopied(true);
                toast.success("Link copiado para a área de transferência!");
                setTimeout(() => setCopied(false), 2500);
            } catch {
                toast.error("Não foi possível copiar o link.");
            }
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row items-start sm:items-center gap-3",
                "rounded-xl border border-border bg-muted/30 px-4 py-3",
                className
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Share2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-snug">
                    Compartilhe{" "}
                    <span className="font-semibold text-foreground">
                        {seriesTitle}
                    </span>{" "}
                    com seus amigos para ganhar novas visualizações.
                </p>
            </div>

            <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="shrink-0 gap-2 h-8 text-xs"
            >
                {copied ? (
                    <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Copiado!
                    </>
                ) : (
                    <>
                        {typeof navigator !== "undefined" && "share" in navigator ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                        Compartilhar
                    </>
                )}
            </Button>
        </div>
    );
}
