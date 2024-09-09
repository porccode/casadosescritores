import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import ArchivedContent from "@/components/ArchivedContent";
import ContentViewer from "@/components/content-viewer";
import ReadingTracker from "@/components/ReadingTracker";
import ViewIncrementer from "@/components/ViewIncrementer";
import { extractIdFromSlug, generateSlug, formatTitle, getMediaUrl, createSummary } from "@/lib/utils";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { AdultContentModal } from "@/components/series/AdultContentModal";

/**
 * ChapterPage.
 * 
 * ARCHITECTURE:
 * - High-authority reader entry point with dynamic ISR.
 * - Logic: Handles ID/Slug redirects, user-specific masking (Author/Admin vs Anonymous).
 * - Standardizes the reading experience across all content types.
 */

export const revalidate = 60; // ISR - 1m

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createAdminSupabaseClient();

    let { data: chapter } = await supabase
        .from("chapters")
        .select("id, title, slug, series(title, cover_url, description, slug)")
        .eq("slug", slug)
        .single();

    if (!chapter) {
        const id = extractIdFromSlug(slug);
        if (id) {
            const { data: byId } = await supabase
                .from("chapters")
                .select("id, title, slug, series(title, cover_url, description, slug)")
                .eq("id", id)
                .single();
            chapter = byId;
        }
    }

    if (!chapter || !chapter.series) return { title: "Capítulo não encontrado" };

    const seriesData = chapter.series as any;
    const chapterTitle = formatTitle(chapter.title);
    const seriesTitle = formatTitle(seriesData.title);
    const pageTitle = `${chapterTitle} | ${seriesTitle}`;

    // Richer description including cleaned series context
    const cleanSeriesDesc = seriesData.description ? createSummary(seriesData.description, 100) : "";
    const description = `${chapterTitle} — Capítulo de ${seriesTitle}.${cleanSeriesDesc ? " " + cleanSeriesDesc : ""}`;

    const imageUrl = seriesData.cover_url || "";
    const seriesCoverAbsolute = imageUrl ? getMediaUrl(imageUrl) : "";

    // Build dynamic OG Image URL
    const ogUrl = new URL("https://casadosescritores.com.br/api/og");
    ogUrl.searchParams.set("title", chapterTitle);
    ogUrl.searchParams.set("type", seriesTitle); // Use series title as the supertitle
    if (seriesCoverAbsolute) ogUrl.searchParams.set("cover", seriesCoverAbsolute);

    const finalImageUrl = ogUrl.toString();

    return {
        title: pageTitle,
        description,
        alternates: {
            canonical: `https://casadosescritores.com.br/capitulo/${chapter.slug}`,
        },
        openGraph: {
            title: pageTitle,
            description,
            images: [{ 
                url: finalImageUrl,
                width: 1200,
                height: 630,
                alt: pageTitle
            }],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description,
            images: [finalImageUrl],
        },
    };
}

export default async function ChapterPage({ params }: Props) {
    const { slug } = await params;
    const supabase = createAdminSupabaseClient();

    // 1. Auth & Chapter Data Fetch in parallel (Round 1)
    const supabaseAuth = await createServerSupabaseClient();
    const [authRes, res] = await Promise.all([
        supabaseAuth.auth.getUser(),
        supabase
            .from("chapters")
            .select(`
                *,
                series!inner(title, id, cover_url, genre, tags, is_archived, is_explicit, slug, comments_enabled),
                author:profiles!author_id!inner(id, username, avatar_url, bio, first_name, last_name)
            `)
            .eq("slug", slug)
            .single()
    ]);

    const user = authRes.data.user;
    let chapter = res.data;
    if (res.error && res.error.code !== "PGRST116") {
        console.error("[ChapterPage] Error fetching by slug:", {
            message: res.error.message,
            code: res.error.code,
            hint: res.error.hint,
            details: res.error.details,
            slug: slug
        });
    }

    // 2.1 Fallback: Lookup by ID
    if (!chapter) {
        const id = extractIdFromSlug(slug);
        if (id) {
            const resById = await supabase
                .from("chapters")
                .select(`
                    *,
                    series!inner(title, id, cover_url, genre, tags, is_archived, is_explicit, slug, comments_enabled),
                    author:profiles!author_id!inner(id, username, avatar_url, bio, first_name, last_name)
                `)
                .eq("id", id)
                .single();
            if (resById.error && resById.error.code !== "PGRST116") {
                console.error("[ChapterPage] Error fetching by ID fallback:", {
                    message: resById.error.message,
                    code: resById.error.code,
                    hint: resById.error.hint,
                    id: id
                });
            }
            if (resById.data) {
                if (resById.data.slug && resById.data.slug !== slug) redirect(`/capitulo/${resById.data.slug}`);
                chapter = resById.data;
            }
        }
    }

    if (!chapter) return notFound();

    const seriesData = chapter.series as any;
    const author = chapter.author as any;

    // 3. Fetch Observer Profile and Chapter Siblings in parallel (Round 2)
    const [profileRes, siblingsRes] = await Promise.all([
        user
            ? supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        supabase
            .from("chapters")
            .select("id, chapter_number, title, slug")
            .eq("series_id", chapter.series_id)
            .eq("is_draft", false)
            .filter("published_at", "lte", new Date().toISOString())
            .order("chapter_number", { ascending: true })
    ]);

    const profile = profileRes.data;
    const siblings = siblingsRes.data;

    // 4. Permissions Masking
    const isAdmin = !!profile?.is_admin;
    const isAuthor = user?.id === chapter.author_id;
    const canViewUnpublished = isAuthor || isAdmin;

    const isDraft = chapter.is_draft === true;
    const publishedAt = chapter.published_at ? new Date(chapter.published_at) : null;
    const isScheduled = !isDraft && publishedAt && publishedAt > new Date();

    if ((seriesData.is_archived || isScheduled || isDraft) && !canViewUnpublished) {
        if (isDraft) return <DraftAccessMask chapterNumber={chapter.chapter_number} seriesSlug={seriesData.slug} />;
        if (isScheduled) return <ScheduledAccessMask publishedAt={chapter.published_at!} seriesSlug={seriesData.slug} />;
        return <div className="content-wrapper py-12"><ArchivedContent /></div>;
    }

    const currentIndex = siblings?.findIndex(s => s.id === chapter.id) ?? -1;
    const prevChapter = currentIndex > 0 ? siblings?.[currentIndex - 1] : null;
    const nextChapter = currentIndex !== -1 && currentIndex < (siblings?.length || 0) - 1 ? siblings?.[currentIndex + 1] : null;

    // 5. Related Content (other chapters from same series)
    const relatedChapters = siblings?.filter(s => s.id !== chapter.id).slice(0, 5) || [];

    // Calcular a duração ISO 8601 baseada em 200 palavras/minuto
    const minutesToRead = Math.ceil(((chapter as any).word_count || 0) / 200) || 1;
    const durationISO = `PT${minutesToRead}M`;

    return (
        <div className="min-h-screen bg-background">
            <AdultContentModal isExplicit={seriesData.is_explicit || false} />
            <ViewIncrementer id={chapter.id} type="chapter" />
            {user && <ReadingTracker chapterId={chapter.id} seriesId={chapter.series_id} userId={user.id} />}



            <ContentViewer
                id={chapter.id}
                title={formatTitle(chapter.title)}
                content={chapter.content}
                createdAt={chapter.created_at}
                author={author}
                viewCount={chapter.view_count}
                likeCount={chapter.like_count || 0}
                userId={user?.id || null}
                contentType="chapter"
                category={seriesData.genre}
                seriesId={chapter.series_id}
                seriesTitle={formatTitle(seriesData.title)}
                seriesSlug={seriesData.slug}
                chapterNumber={chapter.chapter_number}
                tags={seriesData.tags}
                prevChapter={prevChapter ? { ...prevChapter, title: formatTitle(prevChapter.title) } : null}
                nextChapter={nextChapter ? { ...nextChapter, title: formatTitle(nextChapter.title) } : null}
                relatedItems={relatedChapters.map(ch => ({ ...ch, title: formatTitle(ch.title) }))}
                authorNote={(chapter as any).author_note}
                commentsEnabled={seriesData.comments_enabled !== false}
            />

            {/* JSON-LD Structured Data (Com estatísticas de leitura expostas para o Google) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": "Chapter",
                                "name": formatTitle(chapter.title),
                                "position": chapter.chapter_number,
                                "wordCount": (chapter as any).word_count || undefined,
                                "timeRequired": durationISO,
                                "author": { "@type": "Person", "name": author.username, "url": `https://casadosescritores.com.br/profile/${author.username}` },
                                "publisher": {
                                    "@type": "Organization",
                                    "name": "Casa dos Escritores",
                                    "url": "https://casadosescritores.com.br"
                                },
                                "isPartOf": {
                                    "@type": "BookSeries",
                                    "name": formatTitle(seriesData.title),
                                    "url": `https://casadosescritores.com.br/series/${seriesData.slug}`
                                },
                                "datePublished": chapter.published_at || chapter.created_at,
                                "interactionStatistic": [
                                    {
                                        "@type": "InteractionCounter",
                                        "interactionType": "https://schema.org/WatchAction",
                                        "userInteractionCount": chapter.view_count || 0
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
                                        "name": formatTitle(seriesData.title),
                                        "item": `https://casadosescritores.com.br/series/${seriesData.slug}`
                                    },
                                    {
                                        "@type": "ListItem",
                                        "position": 3,
                                        "name": formatTitle(chapter.title),
                                        "item": `https://casadosescritores.com.br/capitulo/${chapter.slug}`
                                    }
                                ]
                            }
                        ]
                    })
                }}
            />
        </div>
    );
}

// ACCESS MASKS (Extracted locally for brevity, could be moved to separate files)

function DraftAccessMask({ chapterNumber, seriesSlug }: { chapterNumber: number; seriesSlug: string }) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-background px-4">
            <div className="max-w-xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Capítulo em Edição</h1>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                        O autor está refinando o capítulo {chapterNumber} no momento.
                        Este conteúdo estará disponível em breve.
                    </p>
                </div>
                <div className="p-12 bg-muted/30 rounded-2xl border border-dashed border-border/60 flex flex-col items-center gap-4">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse delay-150" />
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">Sincronizando Rascunho</span>
                </div>
                <Button asChild variant="outline" className="h-11 px-8 rounded-full font-medium transition-all hover:bg-muted">
                    <Link href={`/series/${seriesSlug}`}>Voltar para a obra</Link>
                </Button>
            </div>
        </div>
    );
}

function ScheduledAccessMask({ publishedAt, seriesSlug }: { publishedAt: string; seriesSlug: string }) {
    const pubDate = new Date(publishedAt);
    const date = pubDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    const time = pubDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-background px-4">
            <div className="max-w-xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                        Lançamento Programado
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Novos segredos em breve</h1>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Este capítulo terá seu conteúdo revelado para todos os leitores na data abaixo.
                    </p>
                </div>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/0 rounded-2xl blur opacity-30 transition duration-1000 group-hover:opacity-50" />
                    <div className="relative p-12 bg-card rounded-2xl border border-border shadow-sm text-primary">
                        <span className="block text-xs font-medium text-muted-foreground transition mb-2">Revelação em</span>
                        <div className="text-3xl font-bold tracking-tight">{date}</div>
                        <span className="block text-[10px] font-mono text-muted-foreground/60 mt-2">às {time}</span>
                    </div>
                </div>
                <Button asChild variant="ghost" className="h-11 px-8 rounded-full font-medium transition-all">
                    <Link href={`/series/${seriesSlug}`}>Voltar para a obra</Link>
                </Button>
            </div>
        </div>
    );
}
