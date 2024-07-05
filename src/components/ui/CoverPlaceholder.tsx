"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Book } from "lucide-react";

export interface CoverPlaceholderProps {
    className?: string;
    variant?: "default" | "minimal";
}

/**
 * CoverPlaceholder.
 * 
 * DESIGN:
 * - Ultra-minimalist clean design with subtle book-like aesthetic.
 * - Solid off-white (#FAFAFA) with subtle inner border.
 * - Responsive, non-clipping typography.
 */
export default function CoverPlaceholder({ className, variant = "default" }: CoverPlaceholderProps) {
    return (
        <div className={cn(
            "absolute inset-0 w-full h-full bg-secondary flex flex-col items-center justify-center p-2 text-center select-none border border-border/50 rounded-md overflow-hidden",
            className
        )}>
            {/* Subtle inner border to look like a book edge */}
            <div className="absolute inset-[3px] border border-border/30 rounded-sm pointer-events-none" />
            
            {variant === "minimal" ? (
                <Book className="w-4 h-4 text-muted-foreground/50 stroke-[1.5]" />
            ) : (
                <div className="font-sans text-muted-foreground flex flex-col items-center justify-center gap-1 px-1">
                    <Book className="w-5 h-5 opacity-55 mb-0.5 stroke-[1.5]" />
                    <span className="text-[11px] leading-tight font-medium max-w-[95%] text-balance">
                        Série sem capa
                    </span>
                </div>
            )}
        </div>
    );
}
