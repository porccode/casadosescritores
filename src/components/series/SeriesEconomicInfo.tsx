"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, Globe, Share2, PenLine, Sparkles, Bot, ImageIcon } from "lucide-react";

interface SeriesEconomicInfoProps {
    copyrightType?: string;
    isAiGenerated?: string;
    aiCoverGenerated?: string;
    className?: string;
}

export function SeriesEconomicInfo({
    copyrightType,
    isAiGenerated,
    aiCoverGenerated,
}: SeriesEconomicInfoProps) {

    // Estilo unificado para todos os badges
    const badgeStyle = "gap-2 text-xs font-semibold py-1.5 px-3 border border-border/40 bg-secondary/50 text-secondary-foreground hover:bg-secondary/50 shadow-none rounded-lg w-fit transition-all duration-200";

    // Copyright badge
    const getCopyrightBadge = () => {
        if (copyrightType === 'public_domain') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Globe className="h-3.5 w-3.5" />
                    Domínio Público
                </Badge>
            );
        }
        if (copyrightType === 'cc_by_nc') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Share2 className="h-3.5 w-3.5" />
                    Creative Commons (CC BY-NC)
                </Badge>
            );
        }
        // Default: all_rights_reserved
        return (
            <Badge variant="secondary" className={badgeStyle}>
                <Lock className="h-3.5 w-3.5" />
                © Todos os direitos reservados
            </Badge>
        );
    };

    // Text IA badge
    const getTextAiBadge = () => {
        const value = isAiGenerated;
        if (!value || value === 'no') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <PenLine className="h-3.5 w-3.5" />
                    Texto escrito por humano
                </Badge>
            );
        }
        if (value === 'assisted' || value === 'enhanced') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Texto com auxílio de IA
                </Badge>
            );
        }
        if (value === 'generated' || value === 'yes' || value === 'text_only') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Bot className="h-3.5 w-3.5" />
                    Texto gerado por IA
                </Badge>
            );
        }
        if (value === 'cover_only') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <PenLine className="h-3.5 w-3.5" />
                    Texto escrito por humano
                </Badge>
            );
        }
        return null;
    };

    // Cover IA badge
    const getCoverAiBadge = () => {
        const coverValue = aiCoverGenerated;
        const textValue = isAiGenerated;

        let value = coverValue;

        if (!value || value === 'no') {
            if (textValue === 'cover_only' || textValue === 'yes') {
                value = 'generated';
            } else {
                value = 'no';
            }
        }

        if (value === 'no') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <ImageIcon className="h-3.5 w-3.5" />
                    Capa por humano
                </Badge>
            );
        }
        if (value === 'assisted') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Capa com auxílio de IA
                </Badge>
            );
        }
        if (value === 'generated') {
            return (
                <Badge variant="secondary" className={badgeStyle}>
                    <Bot className="h-3.5 w-3.5" />
                    Capa gerada por IA
                </Badge>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4 w-fit items-start sm:items-center">
            {getCopyrightBadge()}
            {getTextAiBadge()}
            {getCoverAiBadge()}
        </div>
    );
}
