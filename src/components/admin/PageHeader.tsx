"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * Componente padrão para cabeçalhos de páginas administrativas.
 * Inclui título, descrição opcional e área para ação (ex: botão "Novo").
 */
export function PageHeader({
    title,
    description,
    action,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("space-y-4 mb-8", className)}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60">
                        <span>Admin</span>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-primary/80">{title}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
                    )}
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>
        </div>
    );
}
