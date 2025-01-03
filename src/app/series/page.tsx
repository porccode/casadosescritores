import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import DesktopHeader from "@/components/navigation/DesktopHeader";
import SeriesHubClient from "@/components/series/SeriesHubClient";
import { FeaturedSeriesItem as SeriesWithAuthor } from "@/types/home";
import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiscoveryHeader } from "@/components/series/DiscoveryHeader";

import { Metadata } from "next";

/**
 * SeriesHubPage.
 * 
 * ARCHITECTURE:
 * - Server-side ISR (5m) for high performance discovery.
 * - Data: Fetches all active series (excluding communications) and groups by genre.
 * - Client: `SeriesHubClient` handles tab orchestration (Discovery vs User Library).
 */
export const revalidate = 300;

export const metadata: Metadata = {
    title: "Explorar Histórias e Obras | Casa dos Escritores",
    description: "Descubra e leia histórias gratuitas, livros independentes, fanfics e contos organizados por gêneros.",
    alternates: {
        canonical: "https://casadosescritores.com.br/series",
    },
    openGraph: {
        title: "Explorar Histórias e Obras | Casa dos Escritores",
        description: "Descubra e leia histórias gratuitas, livros independentes, fanfics e contos na Casa dos Escritores.",
        url: "https://casadosescritores.com.br/series",
        siteName: "Casa dos Escritores",
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Explorar Histórias e Obras | Casa dos Escritores",
        description: "Descubra e leia histórias gratuitas e livros independentes online.",
    },
};

interface CategoryWithContent {
    name: string;
    items: SeriesWithAuthor[];
}

export default async function SeriesHubPage() {
    const supabase = createAdminSupabaseClient();

    // Fetch all public active series
    const { data: allObras } = await supabase
        .from("series_with_author" as any)
        .select(`
            id, title, slug, genre, genres, cover_url, is_completed, is_explicit, 
            view_count, author_id, author_username, author_first_name, 
            author_last_name, created_at, is_archived, chapter_count
        `)
        .eq("is_archived", false)
        .neq("title", "Comunicados Oficiais")
        .not("cover_url", "is", null)
        .gt("chapter_count", 0)
        .order("view_count", { ascending: false });

    const categories: CategoryWithContent[] = [];

    if (allObras && allObras.length > 0) {
        const categoryMap = new Map<string, SeriesWithAuthor[]>();

        (allObras as any[]).forEach((obra) => {
            const mappedObra = {
                ...obra,
                author_name: obra.author_first_name && obra.author_last_name
                    ? `${obra.author_first_name} ${obra.author_last_name}`.trim()
                    : obra.author_username || 'Autor'
            };

            const rawGenres = Array.isArray(obra.genres) ? obra.genres : [];
            const primaryGenre = obra.genre ? [obra.genre] : [];
            const allGenres = Array.from(new Set([...primaryGenre, ...rawGenres])).filter(Boolean);
            const categoriesList = allGenres.length > 0 ? allGenres : ["Nacionais"];

            categoriesList.forEach((categoryName: string) => {
                if (!categoryMap.has(categoryName)) categoryMap.set(categoryName, []);
                if (!categoryMap.get(categoryName)!.some((item: any) => item.id === mappedObra.id)) {
                    categoryMap.get(categoryName)!.push(mappedObra as SeriesWithAuthor);
                }
            });
        });

        const sorted = Array.from(categoryMap.entries())
            .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
            .map(([name, items]) => ({ name, items }));

        categories.push(...sorted);
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <DesktopHeader pageTitle="Séries Hub" />

            <DiscoveryHeader
                title="Séries Hub"
                description="Explore novos mundos, personagens inesquecíveis e gerencie seu acervo literário pessoal."
            />

            <main>
                <SeriesHubClient initialCategories={categories} />
            </main>

            {/* Explore More CTA */}
            <section className="py-20 border-t border-border bg-muted/20 mt-20">
                <div className="content-wrapper px-4 text-center">
                    <Compass className="h-10 w-10 text-muted-foreground/20 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold tracking-tight mb-3">Perdido na biblioteca?</h3>
                    <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                        Há sempre algo novo para ler na Casa dos Escritores. Deixe nossa IA sugerir algo único para você.
                    </p>
                    <Button variant="outline" asChild>
                        <Link href="/">Voltar ao Início</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
