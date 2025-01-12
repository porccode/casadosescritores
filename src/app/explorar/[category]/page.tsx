import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import CategoryInfiniteList from "@/components/series/CategoryInfiniteList";
import { Metadata } from "next";
import { DiscoveryHeader } from "@/components/series/DiscoveryHeader";
import DesktopHeader from "@/components/navigation/DesktopHeader";
import { Compass } from "lucide-react";

/**
 * CategoryPage.
 * 
 * ARCHITECTURE:
 * - Specific landing page for genre/category discovery.
 * - Uses DiscoveryHeader for standardized high-authority layout.
 * - Orchestrates server-side fetching for initial results and counts.
 */

interface Props {
    params: Promise<{ category: string }>;
}

async function getCategoryData(slug: string) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
        .from("categories")
        .select("name, slug, description")
        .eq("slug", slug)
        .single();
    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: slug } = await params;
    const category = await getCategoryData(slug);
    const categoryName = category?.name || decodeURIComponent(slug).replace(/-/g, " ");
    const title = `${categoryName} | Casa dos Escritores`;
    const description = category?.description || `Explore as melhores séries de ${categoryName} na Casa dos Escritores.`;

    return {
        title,
        description,
        alternates: {
            canonical: `https://casadosescritores.com.br/explorar/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://casadosescritores.com.br/explorar/${slug}`,
            siteName: "Casa dos Escritores",
            locale: "pt_BR",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function CategoryPage({ params }: Props) {
    const { category: slug } = await params;
    const supabase = createAdminSupabaseClient();

    const category = await getCategoryData(slug);
    const categoryName = category?.name || decodeURIComponent(slug).replace(/-/g, " ");

    // Initial Fetch (First 12 items)
    const { data: initialSeries, count } = await supabase
        .from("series")
        .select(`
            id,
            title,
            description,
            genre,
            genres,
            cover_url,
            view_count,
            is_completed,
            is_explicit,
            author_id,
            slug,
            profiles:author_id(username)
        `, { count: "exact" })
        .eq("is_archived", false)
        .eq("is_draft", false)
        .contains("genres", [categoryName])
        .not("cover_url", "is", null)
        .gt("chapter_count", 0)
        .order("view_count", { ascending: false })
        .range(0, 11);

    const totalCount = count || 0;
    const initialResults = (initialSeries || []).map((s: any) => ({
        ...s,
        author_username: s.profiles?.username
    }));

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Início",
                "item": "https://casadosescritores.com.br"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Explorar",
                "item": "https://casadosescritores.com.br/series"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": categoryName,
                "item": `https://casadosescritores.com.br/explorar/${slug}`
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <DesktopHeader pageTitle={categoryName} />

            <DiscoveryHeader
                title={categoryName}
                description={category?.description || `${totalCount} ${totalCount === 1 ? "série encontrada" : "séries encontradas"} nesta curadoria.`}
                className="mb-12"
            />

            <main className="content-wrapper px-4 lg:px-0">
                {totalCount === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <Compass className="h-12 w-12 mx-auto text-muted-foreground/30" strokeWidth={1.5} />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">Nenhuma série aqui ainda</p>
                            <p className="text-sm text-muted-foreground">Esta categoria ainda não tem conteúdo publicado.</p>
                        </div>
                    </div>
                ) : (
                    <CategoryInfiniteList
                        categoryName={categoryName}
                        initialData={initialResults}
                    />
                )}
            </main>
        </div>
    );
}
