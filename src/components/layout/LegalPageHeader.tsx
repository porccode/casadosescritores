"use client";

import { Section } from "./Section";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

interface LegalPageHeaderProps {
    title: string;
    description?: string;
    lastUpdated?: string;
    className?: string;
}

/**
 * Clean, standard header for Legal and Static pages.
 * Aligns with the "Premium Identity" without administrative noise.
 */
export function LegalPageHeader({
    title,
    description,
    lastUpdated,
    className,
}: LegalPageHeaderProps) {
    return (
        <div className={cn("w-full bg-muted/30 border-b py-16 lg:py-24", className)}>
            <Container className="max-w-4xl text-center">
                <div className="space-y-6">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            {description}
                        </p>
                    )}
                    {lastUpdated && (
                        <div className="flex items-center justify-center pt-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                                Atualizado em {lastUpdated}
                            </span>
                        </div>
                    )}
                </div>
            </Container>
        </div>
    );
}
