"use client";

import React from "react";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadMoreButtonProps {
    onClick: () => void;
    loading?: boolean;
    label?: string;
    loadingLabel?: string;
    className?: string;
    variant?: "default" | "outline" | "ghost";
}

/**
 * LoadMoreButton
 * 
 * Unified button for "Load More", "See More", etc.
 * Design: Compact, primary background, consistent aesthetics.
 */
export function LoadMoreButton({
    onClick,
    loading = false,
    label = "Carregar mais",
    loadingLabel = "Carregando...",
    className,
    variant = "default",
}: LoadMoreButtonProps) {
    return (
        <Button
            variant={variant}
            size="sm"
            onClick={onClick}
            disabled={loading}
            className={cn(
                "h-8 w-[220px] text-xs font-bold rounded-xl shadow-sm transition-all",
                variant === "default" && "bg-primary hover:bg-primary/90 text-primary-foreground border-none",
                className
            )}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    {loadingLabel}
                </>
            ) : (
                label
            )}
        </Button>
    );
}
