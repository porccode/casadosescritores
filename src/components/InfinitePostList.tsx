"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./profile/PostCard";
import { Loader2 } from "lucide-react";

import { Post } from "@/types/post";

interface InfinitePostListProps {
    initialPosts: Post[];
    currentUserId?: string | null;
    currentUsername?: string;
    currentUserAvatar?: string | null;
    currentUserIsAdmin?: boolean;
    onPostCreated?: (post: Post) => void;
    prependedPosts?: Post[];
    disableInfiniteScroll?: boolean;
}

const POSTS_PER_PAGE = 4;

export default function InfinitePostList({
    initialPosts,
    currentUserId,
    currentUsername,
    currentUserAvatar,
    currentUserIsAdmin,
    prependedPosts = [],
    disableInfiniteScroll = false,
}: InfinitePostListProps) {
    const [posts,     setPosts]     = useState<Post[]>(initialPosts);
    const [offset,    setOffset]    = useState(initialPosts.length);
    const [hasMore,   setHasMore]   = useState(!disableInfiniteScroll);
    const [isLoading, setIsLoading] = useState(false);

    const sentinelRef  = useRef<HTMLDivElement>(null);
    // Ref para a versão mais recente de loadMore — evita recriar o observer a cada render
    const loadMoreRef  = useRef<() => void>(() => {});

    // Sync prepended posts (novos posts criados pelo usuário)
    useEffect(() => {
        if (prependedPosts.length === 0) return;
        const uniqueNew = prependedPosts.filter(np => !posts.find(p => p.id === np.id));
        if (uniqueNew.length > 0) setPosts(prev => [...uniqueNew, ...prev]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prependedPosts]);

    // Sync fresh server data sem sobrescrever itens carregados via "load more"
    useEffect(() => {
        if (isLoading) return;
        setPosts(prev => {
            const freshMap = new Map(initialPosts.map(p => [p.id, p]));
            return prev.map(p => freshMap.get(p.id) || p);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPosts]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || disableInfiniteScroll) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/posts?limit=${POSTS_PER_PAGE}&offset=${offset}`);
            if (!res.ok) throw new Error("fetch failed");
            const newPosts: Post[] = await res.json();
            if (newPosts.length < POSTS_PER_PAGE) setHasMore(false);
            
            if (newPosts.length > 0) {
                setPosts(prev => {
                    // Evita chaves duplicadas filtrando posts que já existem no estado
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newPosts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                setOffset(prev => prev + newPosts.length);
            }
        } catch {
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [offset, hasMore, isLoading]);

    // Mantém a ref sempre com a versão mais recente de loadMore
    useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

    // Observer criado UMA VEZ — chama loadMoreRef.current para ter sempre a versão atual
    useEffect(() => {
        if (disableInfiniteScroll) return;

        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
            { rootMargin: "200px" }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
         
    }, [disableInfiniteScroll]); // sem deps — observer criado apenas uma vez

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm divide-y">
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    currentUsername={currentUsername}
                    currentUserAvatar={currentUserAvatar}
                    currentUserIsAdmin={currentUserIsAdmin}
                />
            ))}

            {/* Sentinel invisível — triggado pelo IntersectionObserver */}
            {hasMore && <div ref={sentinelRef} className="h-px" />}

            {isLoading && (
                <div className="flex justify-center py-3">
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
