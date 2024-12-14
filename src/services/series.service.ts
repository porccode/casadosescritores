import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { extractIdFromSlug } from "@/lib/utils";
import { cache } from "react";

/**
 * Busca os detalhes de uma série de forma cacheada no escopo do request (Server Components).
 * Isso previne requisições duplicadas entre `generateMetadata` e a renderização da página.
 */
export const getSeriesBySlugCached = cache(async (slug: string) => {
    const adminSupabase = createAdminSupabaseClient();
    const extractedId = extractIdFromSlug(slug);
    const isUuid = extractedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(extractedId);

    // 1. Busca inicial pelo slug
    let { data: series, error } = await adminSupabase
        .from("series")
        .select(`
            *,
            profiles:author_id (
                id, username, first_name, last_name, bio, avatar_url
            )
        `)
        .eq("slug", slug)
        .maybeSingle();

    // 2. Fallback: busca pelo ID caso seja uma URL antiga
    if (!series && isUuid) {
        const { data: byId } = await adminSupabase
            .from("series")
            .select(`
                *,
                profiles:author_id (
                    id, username, first_name, last_name, bio, avatar_url
                )
            `)
            .eq("id", extractedId)
            .maybeSingle();
        series = byId;
    }

    if (error) {
        console.error("Erro ao buscar série no getSeriesBySlugCached:", error);
    }

    return series;
});
