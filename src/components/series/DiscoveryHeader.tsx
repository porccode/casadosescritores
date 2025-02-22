"use client";

import { cn } from "@/lib/utils";

interface DiscoveryHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    centered?: boolean;
}

export function DiscoveryHeader({
    title,
    description,
    action,
    className,
    centered = true,
}: DiscoveryHeaderProps) {
    return (
        <header className={cn(
            "py-10 md:py-16 border-b border-border bg-muted/20 mb-10",
            centered && "text-center",
            className
        )}>
            <div className="content-wrapper px-4">
                <div className={cn(
                    "flex flex-col gap-3",
                    centered ? "items-center max-w-2xl mx-auto" : "items-start"
                )}>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    )}
                    {action && <div className="mt-2">{action}</div>}
                </div>
            </div>
        </header>
    );
}
