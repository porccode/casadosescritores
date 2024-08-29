"use client";

import { Check, Cloud, CloudOff, Loader2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AutosaveStatus } from "@/hooks/editor/useAutosave";

interface AutosaveIndicatorProps {
    status: AutosaveStatus;
    lastSavedAt: Date | null;
}

const statusConfig: Record<AutosaveStatus, {
    icon: React.ReactNode;
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
}> = {
    idle: { icon: <Cloud className="h-3 w-3" />, label: "Pronto", variant: "outline" },
    saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, label: "Salvando...", variant: "secondary" },
    saved: { icon: <Check className="h-3 w-3" />, label: "Salvo", variant: "default" },
    error: { icon: <CloudOff className="h-3 w-3" />, label: "Erro ao salvar", variant: "destructive" },
    recovered: { icon: <RotateCcw className="h-3 w-3" />, label: "Recuperado", variant: "secondary" },
};

/**
 * Indicador visual compacto de status do autosave.
 * Usa Shadcn Badge para manter consistência visual.
 */
export default function AutosaveIndicator({ status, lastSavedAt }: AutosaveIndicatorProps) {
    const config = statusConfig[status];

    const timeLabel = lastSavedAt
        ? `às ${lastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : "";

    return (
        <Badge variant={config.variant} className="gap-1.5 text-[11px] font-medium h-6 px-2">
            {config.icon}
            <span>{config.label}</span>
            {status === "saved" && timeLabel && (
                <span className="text-muted-foreground">{timeLabel}</span>
            )}
        </Badge>
    );
}
