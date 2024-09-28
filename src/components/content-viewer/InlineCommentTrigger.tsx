"use client";

import React from "react";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineCommentTriggerProps {
    blockId: string | null;
    count: number;
    top: number;
    /** Whether to force-show (paragraph has comments) or only on hover */
    alwaysVisible?: boolean;
    isHovered?: boolean;
    onClick: (blockId: string) => void;
}

/**
 * InlineCommentTrigger
 * 
 * Left-side icon indicator for paragraph-level comments.
 * - Paragraphs WITH comments: always visible, filled icon + count badge
 * - Paragraphs WITHOUT comments: only visible on hover, outline icon
 */
export default function InlineCommentTrigger({
    blockId,
    count,
    top,
    alwaysVisible = false,
    isHovered = false,
    onClick,
}: InlineCommentTriggerProps) {
    if (!blockId) return null;

    const visible = alwaysVisible || isHovered;

    return (
        <button
            className={cn(
                "absolute -left-12 flex items-center gap-1 transition-all duration-200 z-10 group",
                "rounded-full p-1",
                visible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-1 pointer-events-none",
            )}
            style={{ top: `${top}px` }}
            onClick={() => onClick(blockId)}
            aria-label={count > 0 ? `${count} comentários neste parágrafo` : "Comentar neste parágrafo"}
            title={count > 0 ? `${count} comentário${count > 1 ? "s" : ""}` : "Comentar"}
        >
            {count > 0 ? (
                <span className="flex items-center gap-0.5 text-primary">
                    <MessageSquare
                        className="h-4 w-4 fill-primary/20 stroke-primary transition-transform group-hover:scale-110"
                    />
                    {count > 0 && (
                        <span className="text-[10px] font-bold leading-none tabular-nums">
                            {count > 99 ? "99+" : count}
                        </span>
                    )}
                </span>
            ) : (
                <MessageSquarePlus
                    className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:text-primary group-hover:scale-110"
                />
            )}
        </button>
    );
}
