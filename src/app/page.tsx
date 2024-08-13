export const revalidate = 60; // 1 minuto para conteúdo mais fresco

import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Casa dos Escritores | Publique Histórias Grátis e Ilimitadas",
    description: "A melhor plataforma para escritores independentes. Publique suas histórias, contos, fanfics e livros de forma 100% gratuita e ilimitada. Conecte-se com leitores e cresça na carreira literária.",
    alternates: {
        canonical: "https://casadosescritores.com.br",
    },
    openGraph: {
        title: "Casa dos Escritores | Publique Histórias Grátis e Ilimitadas",
        description: "Publique suas histórias, contos e livros de forma 100% gratuita e ilimitada. A comunidade ideal para escritores e leitores.",
        url: "https://casadosescritores.com.br",
        siteName: "Casa dos Escritores",
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Casa dos Escritores | Publique Histórias Grátis e Ilimitadas",
        description: "Publique suas histórias, contos e livros de forma 100% gratuita e ilimitada.",
    },
};
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { calculateLevel } from "@/lib/gamification";
import dynamic from "next/dynamic";

import RankedSeriesList from "@/components/RankedSeriesList";
import RecentContentList from "@/components/RecentContentList";
import MostCommentedList from "@/components/MostCommentedList";
import WelcomeBack from "@/components/WelcomeBack";
import HomeFeed from "@/components/HomeFeed";
import HomeHero from "@/components/HomeHero";
import HomeAnnouncementHero from "@/components/HomeAnnouncementHero";
import ContinueLendo from "@/components/ContinueLendo";

const UserRankingList = dynamic(() => import("@/components/UserRankingList"));
const HomeMobileTabs = dynamic(() => import("@/components/HomeMobileTabs"));
import { Section } from "@/components/layout/Section";
import { GuestCTA } from "@/components/ui/GuestCTA";
import { Container } from "@/components/layout/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { Separator } from "@/components/ui/separator";
import {
    TopUser,
    RecentContentItem,
    MostCommentedItem,
    FeaturedSeriesItem,
    SeriesWithAuthorRaw
} from "@/types/home";
import { isAdminRole } from "@/lib/roles";

/**
 * Casa dos Escritores Home Page (Index).
 * 
 * ARCHITECTURE:
 * - Server-Side Rendering (SSR) com revalidação a cada 60s.
 * - Parallel Data Fetching: Uses Promise.all and RPC functions for maximum performance.
 * - Layout Rhythm Sync: Uses standardized Section and Container components.
 * 
 * PERFORMANCE:
 * - Todas as listas (incluindo "Novas Séries") são buscadas no servidor.
 * - Revalidation de 60s garante conteúdo fresco sem pressão excessiva.
 */
export default async function HomePage() {
    const supabase = await createServerSupabaseClient();

    // ─── Round 1: Auth (não tem como paralelizar com queries autenticadas) ───────
    let user = null;
    try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError && !userError.message.includes("Auth session missing")) {
            console.warn("[ Server ] Auth error on Home:", userError.message);
        } else if (data) {
            user = data.user;
        }
    } catch (e) {
        console.error("[ Server ] Exception in auth:", e);
    }

    // ─── Round 2: Todos os dados em paralelo (1 único round-trip) ────────────────
    const SERIES_FIELDS = `
        id, title, slug, cover_url, genre, view_count, is_completed, is_explicit,
        author_id, author_username, author_first_name, author_last_name,
        created_at, chapter_count
    `;

    const [
        profileResult,          // 0
        recentResult,           // 1
        commentedResult,        // 2
        allSeriesResult,        // 3
        newSeriesResult,        // 4
        postsResult,            // 5
        usersResult,            // 6
        completedSeriesResult,  // 7
        shortStoriesResult,     // 8
        longAnnouncementResult, // 9
        engagementResult        // 10 — Batch engagement scores (1 query instead of N×M)
    ] = await Promise.all([
        // Profile do usuário logado (0)
        user
            ? supabase.from("profiles").select("username, avatar_url, role, is_admin").eq("id", user.id).single()
            : Promise.resolve({ data: null }),

        // Recentes (1)
        (supabase.rpc as any)("get_recent_content", { p_limit: 40, p_offset: 0 }),

        // Mais comentados (2)
        (supabase.rpc as any)('get_most_commented_content', { p_limit: 40, p_offset: 0 }),

        // Séries em Destaque (3)
        supabase.from("series_with_author" as any)
            .select(SERIES_FIELDS)
            .neq('title', 'Comunicados Oficiais')
            .eq('is_archived', false)
            .not('cover_url', 'is', null)
            .gt('chapter_count', 0)
            .order('view_count', { ascending: false })
            .limit(24),

        // Novas Séries (4)
        supabase.from("series_with_author" as any)
            .select(SERIES_FIELDS)
            .neq('title', 'Comunicados Oficiais')
            .eq('is_archived', false)
            .not('cover_url', 'is', null)
            .gt('chapter_count', 0)
            .order('created_at', { ascending: false })
            .limit(24),

        // Posts (5)
        supabase.from("posts" as any)
            .select(`
                id, content, created_at, like_count, reply_count:recursive_reply_count, repost_count, is_pinned,
                author:profiles!author_id!inner(id, username, avatar_url, first_name, last_name, is_admin)
            `)
            .is('parent_id', null)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(40),

        // Users Ranking (6)
        supabase.from("profiles")
            .select(`
                id, username, writer_level, writer_xp, xp, avatar_url, first_name, last_name, role, is_admin, created_at
            `)
            .eq("is_admin", false)
            .neq("role", "admin"),

        // Obras Completas (>1 capítulo) (7)
        supabase.from("series_with_author" as any)
            .select(SERIES_FIELDS)
            .neq('title', 'Comunicados Oficiais')
            .eq('is_archived', false)
            .eq('is_completed', true)
            .not('cover_url', 'is', null)
            .gt('chapter_count', 1)
            .order('view_count', { ascending: false })
            .limit(24),

        // Contos e Histórias Curtas (==1 capítulo) (8)
        supabase.from("series_with_author" as any)
            .select(SERIES_FIELDS)
            .neq('title', 'Comunicados Oficiais')
            .eq('is_archived', false)
            .eq('is_completed', true)
            .not('cover_url', 'is', null)
            .eq('chapter_count', 1)
            .order('view_count', { ascending: false })
            .limit(27),

        // Anúncio Hero (9)
        supabase.from("announcements")
            .select("*")
            .eq("is_active", true)
            .eq("type", "long")
            .lte("start_date", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),

        // Engagement scores batch (10) — 1 query replaces N×M RPCs
        (createAdminSupabaseClient() as any).rpc("get_writer_engagement_scores"),
    ]);

    const currentUserProfile = profileResult.data;
    const { data: recentContentData, error: recentError } = recentResult;
    const { data: mostCommentedContent, error: commentedError } = commentedResult;
    const { data: allSeriesData, error: allSeriesError } = allSeriesResult;
    const { data: newSeriesData, error: newSeriesError } = newSeriesResult;
    const { data: recentPosts, error: recentPostsError } = postsResult;
    const { data: topUsers, error: topUsersError } = usersResult;
    const { data: completedSeriesData, error: completedError } = completedSeriesResult;
    const { data: shortStoriesData, error: shortStoriesError } = shortStoriesResult;
    const { data: longAnnouncement, error: announcementError } = longAnnouncementResult;
    const { data: engagementData, error: engagementError } = engagementResult;

    if (allSeriesError) console.error("[ Server ] Erro séries destaque:", allSeriesError);
    if (newSeriesError) console.error("[ Server ] Erro novas séries:", newSeriesError);
    if (topUsersError) console.error("[ Server ] Erro ranking:", topUsersError);
    if (recentError) console.error("[ Server ] Erro recentes:", recentError);
    if (commentedError) console.error("[ Server ] Erro comentados:", commentedError);
    if (completedError) console.error("[ Server ] Erro obras completas:", completedError);
    if (shortStoriesError) console.error("[ Server ] Erro contos:", shortStoriesError);
    if (engagementError) console.error("[ Server ] Erro engagement scores:", engagementError);

    const mapSeries = (list: SeriesWithAuthorRaw[]) => (list || []).map((s) => ({
        ...s,
        author_name: s.author_first_name && s.author_last_name
            ? `${s.author_first_name} ${s.author_last_name}`.trim()
            : s.author_username || 'Autor'
    })) as FeaturedSeriesItem[];

    const allSeries = (allSeriesData as unknown as SeriesWithAuthorRaw[]) || [];
    const seriesWithChapters = mapSeries(allSeries);
    const newSeriesWithChapters = mapSeries((newSeriesData as unknown as SeriesWithAuthorRaw[]) || []);
    const completedSeries = mapSeries((completedSeriesData as unknown as SeriesWithAuthorRaw[]) || []);
    const shortStories = mapSeries((shortStoriesData as unknown as SeriesWithAuthorRaw[]) || []);

    // Writer ranking — batch engagement scores (O(1) lookup instead of N×M RPCs)
    const engagementMap = new Map<string, number>();
    if (engagementData) {
        for (const row of engagementData as any[]) {
            engagementMap.set(row.author_id, Number(row.total_engagement) || 0);
        }
    }

    const writersWithViews = ((topUsers || []) as any[]).map((profile: any) => ({
        ...profile,
        xp: profile.xp || 0,
        level: calculateLevel(profile.xp || 0),
        totalViews: engagementMap.get(profile.id) || 0
    }));

    // Ordenar por engagement score descendo
    writersWithViews.sort((a: any, b: any) => b.totalViews - a.totalViews);
    const visibleTopUsers = writersWithViews.slice(0, 15);

    // Build do mapa de covers
    const seriesCoverMap: Record<string, { cover_url: string | null; genre: string | null; is_explicit: boolean }> = {};
    for (const s of allSeries) {
        if (s.title) seriesCoverMap[s.title] = { cover_url: s.cover_url, genre: s.genre, is_explicit: s.is_explicit || false };
    }

    // Filtros de conteúdo (Remover duplicados se houver bug no RPC)
    let recentContentFiltered = (recentContentData as any[] || [])
        .filter((item, index, self) => 
            index === self.findIndex((t) => t.id === item.id && t.type === item.type)
        );

    const mostCommentedFiltered = (mostCommentedContent as any[] || [])
        .filter((item: any) => item.series_title !== "Comunicados Oficiais");

    // ─── Round 3: Queries dependentes em paralelo ─────────────────────────────
    const recentChapterIds = recentContentFiltered.map((i: any) => i.id);
    const allRpcTitles = [
        ...new Set([
            ...recentContentFiltered.map((i: any) => i.series_title),
            ...mostCommentedFiltered.map((i: any) => i.series_title),
        ].filter(Boolean))
    ] as string[];
    const missingTitles = allRpcTitles.filter(t => !seriesCoverMap[t]);
    const feedPostIds = (recentPosts as any[] || []).map((p: any) => p.id);

    const [commentCountsResult, missingCoversResult, likesResult, repostsResult] = await Promise.all([
        // Comment counts para itens recentes
        recentChapterIds.length > 0
            ? supabase.from("comments").select("chapter_id").in("chapter_id", recentChapterIds)
            : Promise.resolve({ data: null }),

        // Covers faltantes lookup
        missingTitles.length > 0
            ? supabase.from("series_with_author" as any).select("title, cover_url, genre, is_explicit").in("title", missingTitles).limit(missingTitles.length + 5)
            : Promise.resolve({ data: null }),

        // Post likes
        feedPostIds.length > 0 && user
            ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", feedPostIds)
            : Promise.resolve({ data: null }),

        // Post reposts
        feedPostIds.length > 0 && user
            ? supabase.from("post_reposts").select("post_id").eq("user_id", user.id).in("post_id", feedPostIds)
            : Promise.resolve({ data: null }),
    ]);

    // Processar comment counts
    let recentCommentCounts: Record<string, number> = {};
    if (commentCountsResult.data) {
        (commentCountsResult.data as any[]).forEach((c: any) => {
            if (c.chapter_id) {
                recentCommentCounts[c.chapter_id] = (recentCommentCounts[c.chapter_id] || 0) + 1;
            }
        });
    }

    recentContentFiltered = recentContentFiltered.map((item: any) => ({
        ...item,
        comment_count: recentCommentCounts[item.id] || 0
    }));

    // Processar covers faltantes
    if (missingCoversResult.data) {
        for (const s of (missingCoversResult.data as any[])) {
            if (s.title) seriesCoverMap[s.title] = { cover_url: s.cover_url, genre: s.genre, is_explicit: s.is_explicit || false };
        }
    }

    // Enriquecimento final
    const enrichContent = (list: any[]) => list.map((item: any) => ({
        ...item,
        cover_url: item.series_title ? seriesCoverMap[item.series_title]?.cover_url ?? null : null,
        genre:     item.series_title ? seriesCoverMap[item.series_title]?.genre     ?? null : null,
        is_explicit: item.series_title ? (seriesCoverMap[item.series_title]?.is_explicit ?? false) : (item.is_explicit ?? false),
    }));

    const enrichedRecentContent = enrichContent(recentContentFiltered);
    const enrichedMostCommented = enrichContent(mostCommentedFiltered);

    // Interações do feed
    let likedPostIds = new Set<string>();
    let repostedPostIds = new Set<string>();
    if (likesResult?.data) (likesResult.data as any[]).forEach((l: any) => likedPostIds.add(l.post_id));
    if (repostsResult?.data) (repostsResult.data as any[]).forEach((r: any) => repostedPostIds.add(r.post_id));

    const recentPostsWithInteractions = (recentPosts as any[] || []).map((post: any) => ({
        ...post,
        reply_count: post.reply_count || 0,
        isLiked: likedPostIds.has(post.id),
        isReposted: repostedPostIds.has(post.id)
    }));



    // FAQ Schema
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "O que é a Casa dos Escritores?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Casa dos Escritores é uma plataforma moderna para escritores independentes publicarem suas histórias, contos, fanfics e livros de forma totalmente gratuita e ilimitada."
                }
            },
            {
                "@type": "Question",
                "name": "Como posso publicar minha história?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Basta criar uma conta, clicar em 'Escrever' e começar a criar sua série ou capítulo. É simples, rápido e 100% gratuito."
                }
            },
            {
                "@type": "Question",
                "name": "A publicação é realmente ilimitada?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim! Você pode publicar quantas séries e capítulos desejar, sem custos ou limites de armazenamento."
                }
            },
            {
                "@type": "Question",
                "name": "Posso publicar fanfics na Casa dos Escritores?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim! A plataforma aceita fanfics, contos, romances, ficção científica, terror e todos os outros gêneros literários."
                }
            },
            {
                "@type": "Question",
                "name": "Preciso criar conta para ler as histórias?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Não! Qualquer pessoa pode ler as histórias publicadas na plataforma sem precisar criar uma conta."
                }
            },
            {
                "@type": "Question",
                "name": "Como funciona o sistema de XP e níveis?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Você acumula XP ao publicar capítulos, receber comentários e interagir com a comunidade. À medida que sobe de nível, desbloqueia novas funcionalidades."
                }
            }
        ]
    };

    // Conteúdo das colunas
    const recentColContent = <RecentContentList contentList={enrichedRecentContent as any} />;
    const mostCommentedColContent = <MostCommentedList contentList={enrichedMostCommented as any} />;
    const feedColContent = user ? (
        <HomeFeed
            initialPosts={recentPostsWithInteractions as any}
            currentUserId={user?.id}
            currentUsername={currentUserProfile?.username}
            currentUserAvatar={currentUserProfile?.avatar_url}
            currentUserIsAdmin={isAdminRole(currentUserProfile)}
            isLoggedIn={!!user}
            disableInfiniteScroll={true}
        />
    ) : (
        <GuestCTA 
            title="Feed da Comunidade"
            description="Faça login ou crie sua conta para acompanhar as postagens e interagir com os outros escritores."
        />
    );

    return (
        <PageLayout className="min-h-[auto] lg:min-h-screen">
            <Suspense fallback={null}>
                <WelcomeBack />
            </Suspense>

            {longAnnouncement && (
                <HomeAnnouncementHero announcement={longAnnouncement as any} />
            )}

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            
            {!user && <HomeHero />}
            {user && <h1 className="sr-only">Casa dos Escritores - Publique Histórias Grátis e Ilimitadas</h1>}

            {user && (
                <Section size="sm" container>
                    <ContinueLendo />
                </Section>
            )}

            <Section size="sm" container>
                <RankedSeriesList
                    title="Mais Populares"
                    titleHref="/series"
                    orderByField="view_count"
                    orderByAscending={false}
                    limit={24}
                    layout="responsive-grid"
                    showRank={true}
                    cardSizeMultiplier={0.8}
                    titlePosition="below"
                    initialData={seriesWithChapters.slice(0, 24) as any}
                />
            </Section>

            <Separator className="w-full my-6 lg:my-8" />

            <Section size="sm" container>
                <RankedSeriesList
                    title="Novas Séries"
                    titleHref="/series"
                    orderByField="created_at"
                    orderByAscending={false}
                    limit={24}
                    showRank={false}
                    layout="responsive-grid"
                    cardSizeMultiplier={0.8}
                    titlePosition="below"
                    initialData={newSeriesWithChapters.slice(0, 24) as any}
                />
            </Section>

            <Separator className="w-full my-6 lg:my-8" />

            <Section size="sm" container className="mb-0 lg:mb-2">
                <HomeMobileTabs
                    recentContent={recentColContent}
                    mostCommented={mostCommentedColContent}
                    feed={feedColContent}
                />

                <div className="hidden lg:grid grid-cols-[3fr_3fr_4fr] gap-x-6 items-stretch">
                    <div className="flex flex-col">
                        <h2 className="scroll-m-20 text-lg lg:text-xl font-semibold tracking-tight text-foreground mb-4">Recentes</h2>
                        <div className="overflow-y-auto no-scrollbar max-h-[800px] pb-4">
                            {recentColContent}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h2 className="scroll-m-20 text-lg lg:text-xl font-semibold tracking-tight text-foreground mb-4">Mais Comentados</h2>
                        <div className="overflow-y-auto no-scrollbar max-h-[800px] pb-4">
                            {mostCommentedColContent}
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <h2 className="scroll-m-20 text-lg lg:text-xl font-semibold tracking-tight text-foreground mb-4">Feed da Comunidade</h2>
                        <div className="overflow-y-auto no-scrollbar max-h-[800px] pb-4">
                            {feedColContent}
                        </div>
                    </div>
                </div>
            </Section>

            <Separator className="w-full my-6 lg:my-8" />

            {completedSeries.length > 0 && (
                <Section size="sm" container>
                    <RankedSeriesList
                        title="Obras Completas"
                        titleHref="/series"
                        orderByField="updated_at"
                        orderByAscending={false}
                        limit={24}
                        showRank={false}
                        layout="responsive-grid"
                        cardSizeMultiplier={0.8}
                        titlePosition="below"
                        initialData={completedSeries.slice(0, 24) as any}
                        isCompleted={true}
                        minChapterCount={1}
                    />
                </Section>
            )}

            <Separator className="w-full my-6 lg:my-8" />

            <Section size="sm" container>
                <UserRankingList users={visibleTopUsers as any} />
            </Section>
        </PageLayout>
    );
}
