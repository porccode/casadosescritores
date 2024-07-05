// src/components/ui/InfiniteScrollList.tsx
"use client";

import { ReactNode } from 'react';
import { LoadingSpinner, ButtonSpinner } from './loading-states';

interface InfiniteScrollListProps<T> {
    data: T[];
    renderItem: (item: T, index: number) => ReactNode;
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    hasMore?: boolean;
    sentinelRef?: React.RefObject<HTMLDivElement>;
    loadingPlaceholder?: ReactNode;
    emptyState?: ReactNode;
    className?: string;
    itemClassName?: string;
}

export function InfiniteScrollList<T>({
    data,
    renderItem,
    keyExtractor,
    isLoading = false,
    isLoadingMore = false,
    hasMore = false,
    sentinelRef,
    loadingPlaceholder,
    emptyState,
    className = '',
    itemClassName = '',
}: InfiniteScrollListProps<T>) {
    // Loading inicial
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center p-8 ${className}`}>
                {loadingPlaceholder || (
                    <LoadingSpinner size="sm" message="Carregando..." />
                )}
            </div>
        );
    }

    // Estado vazio
    if (data.length === 0) {
        return (
            <div className={className}>
                {emptyState || (
                    <div className="flex items-center justify-center p-8 text-muted-foreground">
                        Nenhum item encontrado
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            {data.map((item, index) => (
                <div key={keyExtractor(item)} className={itemClassName}>
                    {renderItem(item, index)}
                </div>
            ))}

            {/* Sentinel para scroll infinito */}
            {sentinelRef && hasMore && (
                <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            )}

            {/* Loading mais itens */}
            {isLoadingMore && (
                <div className="flex items-center justify-center p-4">
                    <ButtonSpinner className="text-muted-foreground" />
                </div>
            )}

            {/* Fim da lista */}
            {!hasMore && data.length > 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                    Fim da lista
                </div>
            )}
        </div>
    );
}
