"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Componente para estados vazios (listas sem itens).
 * Exibe ícone, título e descrição opcional.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                className
            )}
        >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-large text-foreground mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground max-w-sm mt-0">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
