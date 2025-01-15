// src/hooks/useInfiniteScroll.ts
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
    // Função que busca dados com offset/limit
    fetchData: (offset: number, limit: number) => Promise<T[]>;
    // Tamanho da página (quantos itens por vez)
    pageSize?: number;
    // Dados iniciais (para SSR)
    initialData?: T[];
    // Distância do fundo para disparar carregamento (px)
    threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
    data: T[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: Error | null;
    loadMore: () => void;
    refresh: () => void;
    sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>({
    fetchData,
    pageSize = 20,
    initialData = [],
    threshold = 200,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
    const [data, setData] = useState<T[]>(initialData);
    const [isLoading, setIsLoading] = useState(!initialData.length);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [offset, setOffset] = useState(initialData.length);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Carregar página inicial
    useEffect(() => {
        if (initialData.length === 0) {
            loadInitial();
        }
    }, []);

    const loadInitial = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newData = await fetchData(0, pageSize);
            setData(newData);
            setOffset(newData.length);
            setHasMore(newData.length >= pageSize);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        setError(null);
        try {
            const newData = await fetchData(offset, pageSize);
            setData(prev => [...prev, ...newData]);
            setOffset(prev => prev + newData.length);
            setHasMore(newData.length >= pageSize);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [offset, pageSize, hasMore, isLoadingMore, fetchData]);

    const refresh = useCallback(async () => {
        setData([]);
        setOffset(0);
        setHasMore(true);
        await loadInitial();
    }, []);

    // Intersection Observer para scroll infinito automático
    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoadingMore && hasMore) {
                    loadMore();
                }
            },
            {
                root: null,
                rootMargin: `${threshold}px`,
                threshold: 0,
            }
        );

        observerRef.current.observe(sentinelRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loadMore, hasMore, isLoadingMore, threshold]);

    return {
        data,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        loadMore,
        refresh,
        sentinelRef: sentinelRef as React.RefObject<HTMLDivElement>,
    };
}
