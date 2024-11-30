"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column<T> {
    key: string;
    header: React.ReactNode;
    cell: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyState?: React.ReactNode;
    getRowKey: (item: T) => string;
    className?: string;
}

/**
 * Componente de tabela de dados padronizado.
 * Exibe loading, empty state e dados de forma consistente.
 */
export function DataTable<T>({
    columns,
    data,
    loading = false,
    emptyState,
    getRowKey,
    className,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className={cn("bg-card border border-border rounded-xl shadow-none", className)}>
                <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                        <span className="text-xs font-medium text-muted-foreground/60">Sincronizando Dados</span>
                    </div>
                </div>
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return <div className={cn("bg-card border border-border rounded-xl shadow-none animate-in fade-in slide-in-from-bottom-2", className)}>{emptyState}</div>;
    }

    return (
        <div className={cn("bg-card border border-border rounded-xl shadow-none overflow-hidden", className)}>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                            {columns.map((col) => (
                                <TableHead key={col.key} className={cn("h-11 text-xs font-semibold text-muted-foreground", col.className)}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow
                                key={getRowKey(item)}
                                className="group hover:bg-muted/20 border-b transition-colors last:border-0"
                                style={{ animationDelay: `${idx * 30}ms` }}
                            >
                                {columns.map((col) => (
                                    <TableCell key={col.key} className={cn("py-1 text-sm font-normal", col.className)}>
                                        {col.cell(item)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
