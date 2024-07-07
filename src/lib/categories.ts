import { createServerSupabaseClient } from "@/lib/supabase-server";

// Fallback categories only needed if DB is empty or for seeding
export const defaultCategories = [
    "Fantasia",
    "Romance",
    "Terror",
    "Humor",
    "Poesia",
    "Ficção Científica",
    "Brasileiro",
    "Anime",
    "Biografias",
    "Contos",
    "Outros",
];

function generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, '');
}

export type CategoryWithCount = {
    id?: string;
    name: string;
    slug: string;
    description: string;
    count: number;
}

/**
 * Busca todas as categorias do banco de dados e conta publicações.
 */
export async function fetchAllCategoriesWithCounts(): Promise<CategoryWithCount[]> {
    try {
        const supabase = await createServerSupabaseClient();

        // 1. Buscar categorias oficiais do banco
        const { data: dbCategories, error: catError } = await (supabase as any)
            .from("categories")
            .select("*")
            .order("name");

        if (catError) {
            console.error("Erro ao buscar tabela de categorias:", catError);
            // Fallback para hardcoded se der erro (ex: tabela não existe ainda)
            return defaultCategories.map(name => ({
                name,
                slug: generateSlug(name),
                description: `Explore publicações na categoria ${name}.`,
                count: 0
            }));
        }

        // 2. Contar uso em séries
        const { data: seriesCategoriesData } = await supabase
            .from("series" as any)
            .select("genre, genres");

        // Mapa de contagem
        const categoryCountMap: Record<string, number> = {};

        // Inicializar com 0 para categorias do DB
        (dbCategories as any[])?.forEach(cat => {
            categoryCountMap[cat.name] = 0;
        });

        // Somar séries por categoria
        if (seriesCategoriesData) {
            seriesCategoriesData.forEach((item: any) => {
                const rawGenres = Array.isArray(item.genres) ? item.genres : [];
                const primaryGenre = item.genre ? [item.genre] : [];
                const allGenres = Array.from(new Set([...primaryGenre, ...rawGenres])).filter(Boolean);

                allGenres.forEach((g: string) => {
                    categoryCountMap[g] = (categoryCountMap[g] || 0) + 1;
                });
            });
        }

        // 3. Montar lista final (apenas categorias com publicações)
        const result = dbCategories
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description || `Explore publicações na categoria ${cat.name}.`,
                count: categoryCountMap[cat.name] || 0
            }))
            .filter(cat => cat.count > 0); // Só mostrar categorias com publicações

        return result;

    } catch (error) {
        console.error("Erro inesperado ao buscar categorias:", error);
        return [];
    }
}
