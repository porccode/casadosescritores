"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleDescriptionProps {
    description: string;
    maxLength?: number;
}

/**
 * Collapsible description that works on both mobile and desktop.
 * Shows truncated text with "ver mais" button when content is long.
 */
export function CollapsibleDescription({
    description,
    maxLength = 250,
}: CollapsibleDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Remove parágrafos e quebras de linha para manter a sinopse em uma linha contínua
    const normalizedDescription = description
        ? description.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
        : "";

    const shouldTruncate = normalizedDescription.length > maxLength;
    const displayText = shouldTruncate && !isExpanded
        ? normalizedDescription.slice(0, maxLength).trim() + "..."
        : normalizedDescription;

    return (
        <div className="m-0 p-0">
            <p className="m-0 p-0 text-sm md:text-base text-muted-foreground leading-relaxed">
                {displayText}
            </p>
            {shouldTruncate && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent font-medium"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Ver menos
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Ver sinopse completa
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}
