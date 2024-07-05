"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { Book } from "lucide-react";
import CoverPlaceholder from "./CoverPlaceholder";

interface OptimizedImageProps extends ImageProps {
    fallbackClassName?: string;
    /** Defaults to "cover". Determines what type of visual placeholder to show when src is missing. */
    fallbackType?: "cover" | "cover-minimal" | "avatar" | "none";
}

/**
 * A wrapper around next/image that automatically falls back to unoptimized
 * loading if the image fails to load (e.g. 402 Payment Required for optimization limits).
 * Also handles empty/null src gracefully by rendering a fallback placeholder template.
 */
export function OptimizedImage({
    src,
    alt,
    className,
    fallbackClassName,
    fallbackType = "cover",
    onError,
    ...props
}: OptimizedImageProps) {
    const [useUnoptimized, setUseUnoptimized] = useState(false);
    const [hasError, setHasError] = useState(false);

    // If src is empty/null/undefined, render a styled placeholder or default image
    const isPlaceholder = !src || src === '' || src === '{}';
  
    // Filter out zoom and transition classes ONLY for placeholders to keep them static
    const filteredClassName = (isPlaceholder && className)
      ? className.split(' ').filter(c => 
          !c.includes('scale-') && 
          !c.includes('transition') && 
          !c.includes('duration-') &&
          !c.includes('group-hover')
        ).join(' ')
      : className;

    if (isPlaceholder) {
        if (fallbackType === "cover" || fallbackType === "cover-minimal") {
            return (
                <CoverPlaceholder 
                    variant={fallbackType === "cover-minimal" ? "minimal" : "default"} 
                    className={filteredClassName} 
                />
            );
        }

        return (
            <div
                className={cn(
                    "bg-muted flex items-center justify-center text-muted-foreground/30",
                    fallbackClassName,
                    className,
                    props.fill ? "absolute inset-0" : ""
                )}
                aria-label={alt}
            />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            className={cn(className, hasError ? "opacity-50" : "")}
            unoptimized={useUnoptimized}
            onError={(e) => {
                if (!useUnoptimized) {
                    setUseUnoptimized(true);
                } else {
                    setHasError(true);
                    if (onError) onError(e);
                }
            }}
            {...props}
        />
    );
}
