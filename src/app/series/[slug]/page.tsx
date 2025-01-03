import { notFound, redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatTitle, getMediaUrl, extractIdFromSlug, cn, createSummary } from "@/lib/utils";
import { getSeriesBySlugCached } from "@/services/series.service";
import DesktopHeader from "@/components/navigation/DesktopHeader";
import SeriesActions from "@/components/SeriesActions";
import SeriesChaptersList from "@/components/SeriesChaptersList";
import { Metadata } from "next";
import { CollapsibleDescription } from "@/components/series/CollapsibleDescription";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SeriesStatusBadge from "@/components/SeriesStatusBadge";
import { AdultContentModal } from "@/components/series/AdultContentModal";
import ViewIncrementer from "@/components/ViewIncrementer";
import Comments from "@/components/Comments";
import SeriesMobileHero from "@/components/series/SeriesMobileHero";
import { OptimizedImage as Image } from "@/components/ui/optimized-image";
import { Eye, Feather, BookOpen, ExternalLink, Library, ArrowRight } from "lucide-react";
import { SeriesMetadata } from "@/components/series/SeriesMetadata";
import { SeriesEconomicInfo } from "@/components/series/SeriesEconomicInfo";
import { ShareNudge } from "@/components/series/ShareNudge";
import { Button } from "@/components/ui/button";
import ContentCard from "@/components/ContentCard";
import Link from "next/link";
import { CoverLightbox } from "@/components/series/CoverLightbox";


/**
 * SeriesPage.
 * 
 * ARCHITECTURE:
 * - High-authority detail page with dynamic ISR and slug redirects.
 * - Modularized into SeriesHero, SeriesEconomicInfo, and SeriesChaptersList.
 * - Logic: Handles ID/Slug redirects, user-specific masking (Author/Admin vs Anonymous).
 */

interface SeriesPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
    const { slug } = await params;
    const series = await getSeriesBySlugCached(slug);

    if (!series) return { title: "Série não encontrada" };

    const title = `${formatTitle(series.title || "")} | Casa dos Escritores`;
    const description = createSummary(series.description, 160);

    const authorName = series.profiles
        ? (series.profiles.first_name && series.profiles.last_name
            ? `${series.profiles.first_name} ${series.profiles.last_name}`
            : series.profiles.username)
        : "";

    // Build dynamic OG Image URL
    const ogUrl = new URL("https://casadosescritores.com.br/api/og");
    ogUrl.searchParams.set("title", formatTitle(series.title || ""));
    ogUrl.searchParams.set("type", "Série");
    if (authorName) ogUrl.searchParams.set("author", authorName);
    if (series.cover_url) ogUrl.searchParams.set("cover", getMediaUrl(series.cover_url));

    const finalImageUrl = ogUrl.toString();

    return {
        title,
        description,
        alternates: {
            canonical: `https://casadosescritores.com.br/series/${series.slug}`,
        },
        openGraph: {
            title,
            description,
            images: [{ 
                url: finalImageUrl,
                width: 1200,
                height: 630,
                alt: title
            }],
            type: "book",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [finalImageUrl],
        },
        icons: {
            apple: "/favicon/apple-touch-icon.png",
        }
    };
}

export default async function SeriesPage({ params }: SeriesPageProps) {
    const { slug } = await params;

    // 1. Clients
    const adminSupabase = createAdminSupabaseClient();
    const supabase = await createServerSupabaseClient();

    const extractedId = extractIdFromSlug(slug);
    const isUuid = extractedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(extractedId);

    // 2. Auth Check (Server-side)
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Fetch Series Data with author information (Cached)
    const series = await getSeriesBySlugCached(slug);

    if (!series) return notFound();



    // 3. Handle Canonical Slug Redirects
    if (series.slug && slug !== series.slug) {
        return redirect(`/series/${series.slug}`);
    }

    // 4. Permissions Logic
    const isAuthor = user?.id === series.author_id;
    const { data: profile } = user ? await adminSupabase.from("profiles").select("is_admin").eq("id", user.id).single() : { data: null };
    const isAdmin = !!profile?.is_admin;
    const canViewUnpublished = isAuthor || isAdmin;

    if ((series.is_archived || series.is_draft || (series.chapter_count || 0) === 0) && !canViewUnpublished) return notFound();

    // 5. Build queries for parallel execution
    let chaptersQuery: any = adminSupabase // Usar admin para garantir fetch mesmo se RLS travar
        .from("chapters")
        .select("*")
        .eq("series_id", series.id)
        .order("chapter_number", { ascending: true });

    if (!canViewUnpublished) {
        chaptersQuery = chaptersQuery.eq("is_draft", false);
    }

    const topSeriesQuery = supabase
        .from("series")
        .select("id")
        .eq("is_archived", false)
        .neq("title", "Comunicados Oficiais")
        .order("view_count", { ascending: false })
        .limit(3);

    const otherSeriesQuery = supabase
        .from("series")
        .select("id, title, slug, cover_url, genre, genres, is_completed, is_explicit")
        .eq("author_id", series.author_id)
        .neq("id", series.id)
        .eq("is_draft", false)
        .eq("is_archived", false)
        .limit(4);

    const relatedSeriesQuery = series.related_series_id
        ? supabase
            .from("series")
            .select("id, title, description, slug, cover_url, is_completed")
            .eq("id", series.related_series_id)
            .maybeSingle()
        : Promise.resolve({ data: null });

    // Run Chapters, Top Series, Other Series and Related Series fetch in parallel to save time
    const [chaptersResult, topSeriesResult, otherSeriesResult, relatedSeriesResult] = await Promise.all([
        chaptersQuery,
        topSeriesQuery,
        otherSeriesQuery,
        relatedSeriesQuery
    ]);
    
    const chapters = chaptersResult.data;
    const topSeries = topSeriesResult.data as any[] | null;
    const otherSeries = otherSeriesResult.data;
    const relatedSeries = relatedSeriesResult?.data;

    const rank = topSeries?.findIndex(r => r.id === series.id) !== -1
        ? (topSeries?.findIndex(r => r.id === series.id) ?? -1) + 1
        : null;

    const authorName = series.profiles
        ? (series.profiles.first_name && series.profiles.last_name
            ? `${series.profiles.first_name} ${series.profiles.last_name}`
            : series.profiles.username)
        : "Autor";



    // JSON-LD for Book Schema & BreadcrumbList (Com leituras expostas para o Google)
    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Book",
                "name": formatTitle(series.title),
                "author": {
                    "@type": "Person",
                    "name": authorName,
                    "url": series.profiles ? `https://casadosescritores.com.br/profile/${series.profiles.username}` : undefined
                },
                "url": `https://casadosescritores.com.br/series/${series.slug}`,
                "description": series.description || "",
                "image": series.cover_url ? getMediaUrl(series.cover_url) : "https://casadosescritores.com.br/og-default-image.png",
                "genre": series.genre || "Ficção",
                "inLanguage": "pt-BR",
                "datePublished": series.created_at,
                "dateModified": series.updated_at,
                "isFamilyFriendly": !series.is_explicit,
                "interactionStatistic": [
                    {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/WatchAction",
                        "userInteractionCount": series.view_count || 0
                    }
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://casadosescritores.com.br"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Obras",
                        "item": "https://casadosescritores.com.br/series"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": formatTitle(series.title),
                        "item": `https://casadosescritores.com.br/series/${series.slug}`
                    }
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen bg-background pb-0">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
            />
            <DesktopHeader
                pageTitle={series.title}
                seriesId={series.id}
                seriesTitle={series.title}
                seriesSlug={series.slug}
            />
            <section className="max-w-[75rem] mx-auto px-4 lg:px-0 flex flex-wrap items-start">
                <AdultContentModal
                    isExplicit={series.is_explicit}
                    bypassCheck={isAuthor || isAdmin}
                />
                <ViewIncrementer id={series.id} type="series" />

                <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 mt-12">
                    <SeriesMobileHero series={{ ...series, rank } as any} />
                    {/* Desktop Cover with Lightbox */}
                    <div className="hidden md:block w-56 lg:w-64 shrink-0">
                        <CoverLightbox
                            src={series.cover_url ? getMediaUrl(series.cover_url) : undefined}
                            alt={formatTitle(series.title)}
                        >
                            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-transparent shadow-lg font-sans">
                                <Image
                                    src={series.cover_url ? getMediaUrl(series.cover_url) : undefined}
                                    alt={formatTitle(series.title)}
                                    fill
                                    className="object-cover"
                                    priority
                                />

                                {/* Overlays on Cover */}
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end z-20 pointer-events-none">
                                    {/* Left Column (Rank + Status) */}
                                    <div className="flex flex-col gap-1 items-start">
                                        {/* Ranking Badge (Top #1, #2, #3) */}
                                        {rank && rank <= 3 && (
                                            <Badge
                                                variant="neutral"
                                                className={cn(
                                                    "text-[10px] h-5 px-1.5 border-none shadow-sm font-bold text-[#212121]",
                                                    rank === 1 ? "bg-[#FFB247]" :
                                                        rank === 2 ? "bg-[#2CFF5A]" :
                                                            "bg-[#FF73CC]"
                                                )}
                                            >
                                                Top #{rank}
                                            </Badge>
                                        )}

                                        <SeriesStatusBadge
                                            isCompleted={series.is_completed || false}
                                            isArchived={series.is_archived || false}
                                            isDraft={series.is_draft || false}
                                            size="sm"
                                            className="shadow-sm border-none"
                                        />
                                    </div>

                                    {/* Removed Views */}
                                </div>
                            </div>
                        </CoverLightbox>
                    </div>

                    <div className="flex-1 m-0 p-0">
                        <h1 className="h1 border-none pb-0 mb-4">
                            {formatTitle(series.title)}
                        </h1>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                            <SeriesMetadata
                                author={series.profiles}
                                createdAt={series.created_at}
                                genre={series.genre}
                            />

                            <div className="flex flex-wrap items-center gap-2">
                                {series.is_explicit && (
                                    <SeriesStatusBadge isExplicit={true} size="sm" />
                                )}
                                {series.genres && series.genres.length > 0 ? (
                                    series.genres.map((g: string) => (
                                        <SeriesStatusBadge key={g} genre={g} size="sm" />
                                    ))
                                ) : (
                                    series.genre && (
                                        <SeriesStatusBadge genre={series.genre} size="sm" />
                                    )
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <SeriesActions
                                series={series as any}
                                firstChapter={chapters && chapters.length > 0 ? chapters[0] : null}
                                initialIsAuthor={isAuthor}
                                initialIsAdmin={isAdmin}
                            />
                        </div>

                        {series.description && (
                            <div className="mb-4">
                                <CollapsibleDescription description={series.description} maxLength={150} />
                            </div>
                        )}

                        {series.author_note && (
                            <div className="mb-6 p-4 rounded-xl border border-primary/40 bg-blue-500/5 animate-in fade-in-50">
                                <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                                    <Feather className="h-4 w-4 text-primary" />
                                    Notas e Avisos do Autor
                                </h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                    {series.author_note}
                                </p>
                            </div>
                        )}

                        <SeriesEconomicInfo
                            copyrightType={series.copyright_type}
                            isAiGenerated={series.is_ai_generated}
                            aiCoverGenerated={series.ai_cover_generated}
                        />
                    </div>
                </div>

                {/* 2. Chapters (Left Column, 50%) */}
                <div className="w-full md:w-[calc(50%-1rem)] md:mr-4 mt-4 lg:mt-12">
                    <SeriesChaptersList
                        initialChapters={chapters as any[] || []}
                        seriesId={series.id}
                        seriesTitle={formatTitle(series.title)}
                        initialIsAuthor={isAuthor}
                        initialIsAdmin={isAdmin}
                        isCompleted={series.is_completed || false}
                        collapsible={false}
                        seriesAuthorId={series.author_id}
                    />
                </div>

                {/* 3. Comments (Right Column, 50%) */}
                <div className="w-full md:w-[50%] mt-4 lg:mt-12">
                    <Comments
                        contentId={series.id}
                        contentType="series"
                        authorId={series.author_id}
                        isSeriesComment={true}
                        commentsEnabled={series.comments_enabled !== false}
                    />
                </div>

                {/* Obra Relacionada / Continuação Banner (Abaixo dos capítulos e comentários) */}
                {relatedSeries ? (
                    <div className="w-full mt-10 animate-in fade-in-50">
                        <div className="relative flex flex-col sm:flex-row items-stretch gap-5 p-5 md:p-6 rounded-xl border border-muted bg-card/60 hover:bg-card shadow-sm hover:border-primary/40 transition-all duration-300 overflow-hidden group">
                            {/* Book Cover */}
                            <Link href={`/series/${relatedSeries.slug}`} className="shrink-0 mx-auto sm:mx-0">
                                <div className="relative w-24 sm:w-28 aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-md group-hover:shadow-lg transition-all duration-300">
                                    <Image
                                        src={relatedSeries.cover_url ? getMediaUrl(relatedSeries.cover_url) : undefined}
                                        alt={relatedSeries.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            </Link>

                            {/* Main Details */}
                            <div className="flex-1 flex flex-col justify-between min-w-0 text-center sm:text-left space-y-2">
                                <div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                                        <span className="text-[11px] font-bold text-primary tracking-wider flex items-center gap-1.5 uppercase">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            Continuação / Obra Relacionada
                                        </span>
                                        {relatedSeries.is_completed && (
                                            <SeriesStatusBadge isCompleted={true} size="sm" />
                                        )}
                                    </div>
                                    <Link href={`/series/${relatedSeries.slug}`}>
                                        <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {relatedSeries.title}
                                        </h3>
                                    </Link>
                                    {relatedSeries.description && (
                                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                                            {relatedSeries.description}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 flex items-center justify-center sm:justify-start">
                                    <Button asChild size="sm" variant="default" className="font-semibold text-xs gap-1.5 shadow-sm">
                                        <Link href={`/series/${relatedSeries.slug}`}>
                                            Conhecer esta história
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (series.related_title && series.related_url) ? (
                    <div className="w-full mt-10 animate-in fade-in-50">
                        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border border-muted bg-card/60 hover:bg-card shadow-sm hover:border-primary/40 transition-all duration-300 overflow-hidden group">
                            <div>
                                <span className="text-[11px] font-bold text-primary tracking-wider flex items-center gap-1.5 uppercase mb-1">
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Continuação / Obra Relacionada
                                </span>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {series.related_title}
                                </h3>
                            </div>
                            <Button asChild size="sm" variant="default" className="font-semibold text-xs gap-1.5 shrink-0 shadow-sm">
                                <Link href={series.related_url}>
                                    Acessar obra
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : null}
            </section>

            {otherSeries && otherSeries.length > 0 && (
                <section className="max-w-[75rem] mx-auto px-4 lg:px-0 mt-12 pt-8 border-t border-muted pb-16">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary" />
                        Outras obras de @{series.profiles?.username || "Autor"}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                        {otherSeries.map((obra: any) => (
                            <ContentCard
                                key={obra.id}
                                variant="cover"
                                title={obra.title}
                                href={`/series/${obra.slug}`}
                                coverUrl={obra.cover_url}
                                badges={{
                                    isCompleted: obra.is_completed || false,
                                    isExplicit: obra.is_explicit || false,
                                }}
                                subtitle={{ text: obra.genres && obra.genres.length > 0 ? obra.genres[0] : (obra.genre || "") }}
                                footer={{
                                    author: series.profiles?.username || "Autor",
                                    metrics: { views: obra.view_count || 0 },
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BookSeries",
                        "name": formatTitle(series.title || ""),
                        "description": series.description,
                        "genre": series.genre,
                        "author": {
                            "@type": "Person",
                            "name": authorName
                        },
                        "datePublished": series.created_at,
                        "image": series.cover_url ? getMediaUrl(series.cover_url) : undefined,
                        "numberOfEpisodes": chapters?.length || 0
                    })
                }}
            />
        </div>
    );
}
