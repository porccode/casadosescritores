"use client";

import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Filter, SlidersHorizontal, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchFilterBarProps {
    currentGenre: string | null;
    currentStatus: string | null;
    currentOrder: string;
    onFilterChange: (filters: { genre?: string | null; status?: string | null; order?: string }) => void;
}

const GENRES = [
    "Romance", "Fantasia Medieval", "Fantasia", "Ficção Científica",
    "Poesia", "Outros", "Contos", "Terror", "Futurista",
    "Religião", "Informativo", "Brasileiro"
];

export default function SearchFilterBar({
    currentGenre,
    currentStatus,
    currentOrder,
    onFilterChange,
}: SearchFilterBarProps) {

    // ✅ Gamificação: Premiar XP por realizar busca/filtro (com cooldown no servidor)
    React.useEffect(() => {
        const hasActiveFilters = currentGenre || currentStatus || currentOrder !== "relevance";
        if (hasActiveFilters) {
            // Pequeno delay para evitar chamadas enquanto o usuário clica rápido em filtros
            const timer = setTimeout(() => {
                fetch('/api/search/xp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: 'filter_applied' })
                }).catch(() => {}); // Silencioso se der erro
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentGenre, currentStatus, currentOrder]);

    const handleClearFilters = () => {
        onFilterChange({ genre: null, status: null, order: "relevance" });
    };

    const hasFilters = currentGenre || currentStatus || currentOrder !== "relevance";

    return (
        <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-xl border border-border mb-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <SlidersHorizontal size={16} />
                    Filtros & Ordenação
                </div>
                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                    >
                        Limpar
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gênero */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Gênero
                    </label>
                    <Select
                        value={currentGenre || "all"}
                        onValueChange={(val) => onFilterChange({ genre: val === "all" ? null : val })}
                    >
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="Todos os gêneros" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os gêneros</SelectItem>
                            {GENRES.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Status
                    </label>
                    <Select
                        value={currentStatus || "all"}
                        onValueChange={(val) => onFilterChange({ status: val === "all" ? null : val })}
                    >
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue placeholder="Qualquer status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Qualquer status</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="ongoing">Em andamento</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Ordenação */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Ordenar por
                    </label>
                    <Select
                        value={currentOrder}
                        onValueChange={(val) => onFilterChange({ order: val })}
                    >
                        <SelectTrigger className="h-9 bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="relevance">Mais Relevantes</SelectItem>
                            <SelectItem value="views">Mais Vistos</SelectItem>
                            <SelectItem value="recent">Mais Recentes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
