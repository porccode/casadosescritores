"use client";

import { Shield, Info, Computer } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types/admin";

interface AuditLogDetailsProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getActionBadgeVariant: (action: string) => any;
}

/**
 * AuditLogDetails Component.
 * Displays exhaustive details about a security/activity event.
 */
export function AuditLogDetails({ log, open, onOpenChange, getActionBadgeVariant }: AuditLogDetailsProps) {
    if (!log) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 overflow-hidden border-border shadow-xl">
                <div className="border-b p-6 bg-muted/5">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold">
                                    Detalhes do Evento
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground font-mono">
                                    ID: {log.id}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border rounded-sm overflow-hidden">
                        <div className="p-4 bg-muted/10 border-r border-b md:border-b-0">
                            <span className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</span>
                            <span className="text-xs font-mono">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="p-4 bg-muted/10 border-r border-b md:border-b-0">
                            <span className="text-xs font-semibold text-muted-foreground block mb-1.5">Ação</span>
                            <Badge variant={getActionBadgeVariant(log.action)} className="text-xs px-2 h-5">
                                {log.action}
                            </Badge>
                        </div>
                        <div className="p-4 bg-muted/10 border-r col-span-2">
                            <span className="text-xs font-semibold text-muted-foreground block mb-1.5">Endereço IP</span>
                            <span className="text-xs font-mono tracking-wider">{log.ip_address}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Info className="h-3.5 w-3.5" /> Metadata
                        </h4>
                        <div className="bg-zinc-950 p-6 border-l-4 border-primary shadow-none overflow-x-auto rounded-sm">
                            <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                            <Computer className="h-3.5 w-3.5" /> Agente do Usuário
                        </h4>
                        <div className="p-4 bg-muted/30 border-l border-muted-foreground/20 italic rounded-sm">
                            <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                                {log.user_agent}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className=""
                        >
                            Fechar Detalhes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
