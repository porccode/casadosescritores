"use client";

import { Container } from "./Container";
import { cn } from "@/lib/utils";

interface LegalContainerProps {
    children: React.ReactNode;
    className?: string;
    asCard?: boolean;
}

/**
 * Dedicated container for Legal and Static content.
 * Enforces max-width 4xl and provides optional card styling.
 * Integrated with tailwind-typography (prose).
 */
export function LegalContainer({
    children,
    className,
    asCard = true,
}: LegalContainerProps) {
    return (
        <Container className={cn("max-w-4xl py-12 -mt-8 relative z-10", className)}>
            <div className={cn(
                asCard && "bg-card border border-border rounded-2xl shadow-lg shadow-black/5 p-8 md:p-12",
                "prose prose-slate dark:prose-invert max-w-none text-foreground leading-loose",
                "prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight",
                "prose-p:text-muted-foreground prose-li:text-muted-foreground",
                "prose-strong:text-foreground prose-strong:font-bold",
                "prose-hr:border-border",
                className
            )}>
                {children}
            </div>
        </Container>
    );
}
