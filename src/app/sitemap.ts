import { MetadataRoute } from 'next';
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { fetchAllCategoriesWithCounts } from "@/lib/categories";
import { generateSlug } from "@/lib/utils";

const URL_BASE = "https://casadosescritores.com.br";
const DEFAULT_LIMIT = 5000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createServerSupabaseClient();
    const lastModified = new Date();

    // 1. Buscar Séries (excluindo arquivadas)
    const { data: series } = await supabase
        .from("series")
        .select("id, title, slug, updated_at")
        .eq("is_archived", false)
        .eq("is_draft", false)
        .gt("chapter_count", 0)
        .not("cover_url", "is", null)
        .limit(DEFAULT_LIMIT);

    const seriesUrls = ((series as any[]) || []).map((serie) => ({
        url: `${URL_BASE}/series/${serie.slug || generateSlug(serie.title, serie.id)}`,
        lastModified: serie.updated_at ? new Date(serie.updated_at) : lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    // 2. Buscar Perfis
    const { data: profiles } = await supabase
        .from("profiles")
        .select("username, updated_at")
        .limit(DEFAULT_LIMIT);

    const profileUrls = ((profiles as any[]) || []).map((profile) => ({
        url: `${URL_BASE}/profile/${encodeURIComponent(profile.username || '')}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.5,
    }));

    // 3. Buscar Capítulos (apenas de séries não arquivadas)
    const { data: chapters } = await supabase
        .from("chapters")
        .select("id, title, slug, updated_at, series!inner(is_archived)")
        .eq("series.is_archived", false)
        .eq("is_draft", false)
        .lte("published_at", new Date().toISOString())
        .limit(DEFAULT_LIMIT);

    const chapterUrls = ((chapters as any[]) || []).map((chapter) => ({
        url: `${URL_BASE}/capitulo/${chapter.slug || generateSlug(chapter.title, chapter.id)}`,
        lastModified: chapter.updated_at ? new Date(chapter.updated_at) : lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    // 4. Buscar Posts (Feed)
    const { data: posts } = await supabase
        .from("posts")
        .select("id, content, updated_at")
        .limit(DEFAULT_LIMIT);

    const postUrls = ((posts as any[]) || []).map((post) => ({
        url: `${URL_BASE}/post/${generateSlug(post.content || '', post.id)}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : lastModified,
        changeFrequency: "daily" as const,
        priority: 0.4,
    }));

    // 5. Buscar Anúncios/Comunicados
    const { data: announcements } = await supabase
        .from("announcements")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

    const announcementUrls = ((announcements as any[]) || []).map((ann) => ({
        url: `${URL_BASE}/anuncios/${generateSlug(ann.title || '', ann.id)}`,
        lastModified: ann.created_at ? new Date(ann.created_at) : lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.5,
    }));

    // 6. Buscar Comunidades Públicas
    const { data: communities } = await supabase
        .from("communities")
        .select("slug, updated_at, created_at")
        .eq("is_private", false)
        .limit(DEFAULT_LIMIT);

    const communityUrls = ((communities as any[]) || []).map((comm) => ({
        url: `${URL_BASE}/comunidades/${comm.slug}`,
        lastModified: comm.updated_at ? new Date(comm.updated_at) : (comm.created_at ? new Date(comm.created_at) : lastModified),
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    // 7. Páginas de Documentação
    const docSlugs = [
        "cadastro-e-perfil",
        "sistema-de-xp",
        "series-e-obras",
        "capitulos-e-edicao",
        "escrita-assistida",
        "posts-e-interacao",
        "comentarios",
        "busca-e-rankings",
        "notificacoes-e-chat",
        "seguranca-e-regras",
        "suporte-e-feedback"
    ];
    const docUrls: MetadataRoute.Sitemap = [
        {
            url: `${URL_BASE}/docs`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        },
        ...docSlugs.map(slug => ({
            url: `${URL_BASE}/docs/${slug}`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }))
    ];

    // 8. Buscar Categorias
    const categories = await fetchAllCategoriesWithCounts();
    const categoryUrls = categories.map((category) => ({
        url: `${URL_BASE}/explorar/${category.slug}`,
        lastModified: lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    // 9. URLs Estáticas Indexáveis
    const staticUrls: MetadataRoute.Sitemap = [
        {
            url: `${URL_BASE}/`,
            lastModified: lastModified,
            changeFrequency: "daily" as const,
            priority: 1.0,
        },
        {
            url: `${URL_BASE}/series`,
            lastModified: lastModified,
            changeFrequency: "daily" as const,
            priority: 0.8,
        },
        {
            url: `${URL_BASE}/comunidades`,
            lastModified: lastModified,
            changeFrequency: "daily" as const,
            priority: 0.7,
        },
        {
            url: `${URL_BASE}/rankings`,
            lastModified: lastModified,
            changeFrequency: "daily" as const,
            priority: 0.7,
        },
        {
            url: `${URL_BASE}/register`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.4,
        },
        {
            url: `${URL_BASE}/about`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${URL_BASE}/guidelines`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${URL_BASE}/support`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        },
        {
            url: `${URL_BASE}/privacy`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
        {
            url: `${URL_BASE}/terms`,
            lastModified: lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.3,
        },
        {
            url: `${URL_BASE}/search`,
            lastModified: lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.5,
        }
    ];

    return [
        ...staticUrls,
        ...docUrls,
        ...seriesUrls,
        ...chapterUrls,
        ...profileUrls,
        ...communityUrls,
        ...categoryUrls,
        ...announcementUrls,
        ...postUrls,
    ];
}
