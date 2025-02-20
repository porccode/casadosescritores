// src/hooks/useCachedData.ts
import useSWR, { SWRConfiguration } from 'swr';
import { createBrowserClient } from '@/lib/supabase-browser';

// Configuração padrão de cache - dados ficam válidos por 5 minutos
const defaultConfig: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minuto de dedupe
    errorRetryCount: 2,
};

// Fetcher genérico para Supabase
const supabaseFetcher = async (key: string) => {
    const supabase = createBrowserClient();
    const [table, ...rest] = key.split(':');
    const params = rest.join(':');

    // Parse query params
    const queryParams = new URLSearchParams(params);
    const orderBy = queryParams.get('orderBy') || 'created_at';
    const ascending = queryParams.get('asc') === 'true';
    const limit = parseInt(queryParams.get('limit') || '15');
    const select = queryParams.get('select') || '*';

    // @ts-ignore - bypass union type restriction for generic fetcher
    const { data, error } = await supabase
        .from(table as any)
        .select(select)
        .order(orderBy, { ascending })
        .limit(limit);

    if (error) throw error;
    return data;
};

// Hook para buscar séries em destaque com cache
export function useFeaturedSeries(limit = 15) {
    const key = `series:orderBy=view_count&asc=false&limit=${limit}&select=id,title,cover_url,genre,view_count,is_completed,author_id,created_at`;

    const { data, error, isLoading, mutate } = useSWR(key, supabaseFetcher, {
        ...defaultConfig,
        revalidateIfStale: true,
        // Dados ficam "frescos" por 5 minutos
        focusThrottleInterval: 300000,
    });

    return {
        series: data || [],
        isLoading,
        isError: error,
        refresh: mutate,
    };
}

// Hook para buscar ranking de usuários com cache
export function useUserRanking(limit = 15) {
    const key = `profiles:orderBy=xp&asc=false&limit=${limit}&select=id,username,level,xp,avatar_url,first_name,last_name`;

    const { data, error, isLoading, mutate } = useSWR(key, supabaseFetcher, {
        ...defaultConfig,
        revalidateIfStale: true,
    });

    return {
        users: data || [],
        isLoading,
        isError: error,
        refresh: mutate,
    };
}

// Hook genérico para queries com cache
export function useCachedQuery<T>(
    table: string,
    options: {
        select?: string;
        orderBy?: string;
        ascending?: boolean;
        limit?: number;
        enabled?: boolean;
    } = {}
) {
    const {
        select = '*',
        orderBy = 'created_at',
        ascending = false,
        limit = 20,
        enabled = true,
    } = options;

    const key = enabled
        ? `${table}:orderBy=${orderBy}&asc=${ascending}&limit=${limit}&select=${select}`
        : null;

    // @ts-ignore
    const { data, error, isLoading, mutate } = useSWR<T[]>(key as any, supabaseFetcher, defaultConfig);

    return {
        data: data || [],
        isLoading,
        isError: error,
        refresh: mutate,
    };
}

// Hook para invalidar cache específico
export function useInvalidateCache() {
    const { mutate } = useSWR(null);

    return {
        invalidate: (keyPattern: string) => {
            // Invalida todas as chaves que começam com o pattern
            // @ts-ignore
            mutate(
                (key: any) => typeof key === 'string' && key.startsWith(keyPattern),
                { revalidate: true }
            );
        },
        invalidateAll: () => {
            // @ts-ignore
            mutate(() => true, { revalidate: true });
        },
    };
}
