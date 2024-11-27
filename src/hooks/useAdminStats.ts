// src/hooks/useAdminStats.ts
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase-browser';

export interface AdminStats {
    publications: number;
    users: number;
    comments: number;
    suggestions: number;
    messages: number;
    announcements: number;
    categories: number;
}

const fetcher = async () => {
    const supabase = createBrowserClient();

    // Chama a função RPC que criamos no banco
    const { data, error } = await (supabase as any).rpc('get_admin_stats');

    if (error) throw error;

    const stats = ((data as any[])?.[0] || {}) as any;

    return {
        publications: Number(stats.series_count),
        users: Number(stats.users_count),
        comments: Number(stats.comments_count),
        suggestions: Number(stats.unread_suggestions_count),
        messages: Number(stats.conversations_count),
        announcements: Number(stats.announcements_count),
        categories: Number(stats.categories_count),
    } as AdminStats;
};

export function useAdminStats() {
    const { data, error, isLoading, mutate } = useSWR('admin:stats', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minuto
    });

    return {
        stats: data || {
            publications: 0,
            users: 0,
            comments: 0,
            suggestions: 0,
            messages: 0,
            announcements: 0,
            categories: 0
        },
        isLoading,
        isError: error,
        refresh: mutate
    };
}
