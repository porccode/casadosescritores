import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calculateLevel } from "@/lib/gamification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, BookOpen, Lock, Feather } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const revalidate = 3600; // Cache por 1 hora no servidor

export const metadata: Metadata = {
    title: "Hall da Fama | Casa dos Escritores",
    description: "Os talentos mais brilhantes e os leitores mais dedicados da comunidade.",
    alternates: {
        canonical: "https://casadosescritores.com.br/rankings",
    },
    openGraph: {
        title: "Hall da Fama | Casa dos Escritores",
        description: "Os talentos mais brilhantes e os leitores mais dedicados da comunidade.",
        url: "https://casadosescritores.com.br/rankings",
        siteName: "Casa dos Escritores",
        locale: "pt_BR",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Hall da Fama | Casa dos Escritores",
        description: "Conheça os principais escritores e leitores do Hall da Fama da Casa dos Escritores.",
    },
};

interface RankedUser {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    level: number;
    xp: number;
    rank: number;
    metricValue: number;
    metricLabel: string;
    created_at?: string | null;
    rawViews?: number;
}

function PodiumCard({ user, size = "md" }: { user: RankedUser; size?: "lg" | "md" | "sm" }) {
    const rankColors = {
        1: { ring: "ring-amber-400", badge: "bg-amber-400 text-amber-950", icon: "text-amber-500" },
        2: { ring: "ring-slate-400", badge: "bg-slate-300 text-slate-800", icon: "text-slate-400" },
        3: { ring: "ring-orange-400", badge: "bg-orange-300 text-orange-900", icon: "text-orange-500" },
    }[user.rank] ?? { ring: "ring-border", badge: "bg-muted text-muted-foreground", icon: "text-muted-foreground" };

    const sizeMap = {
        lg: "h-20 w-20",
        md: "h-16 w-16",
        sm: "h-14 w-14",
    };

    const displayName = user.first_name
        ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
        : user.username;

    const isNewcomer = user.created_at
        ? (new Date().getTime() - new Date(user.created_at).getTime()) <= 30 * 24 * 60 * 60 * 1000
        : false;

    return (
        <Link href={`/profile/${user.username}`} className="flex flex-col items-center gap-2 group relative">
            <div className="relative">
                <Avatar className={cn("ring-2 ring-offset-2 ring-offset-background transition-transform group-hover:scale-105", sizeMap[size], rankColors.ring)}>
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="font-bold text-lg">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={cn("absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm font-black text-xs", rankColors.badge)}>
                    {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                </div>
            </div>
            <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1 max-w-[100px] justify-center">
                    <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{displayName}</p>
                    {isNewcomer && (
                        <span className="text-[10px]" title="Escritor Revelação: Novo membro com boost de visibilidade!">⚡</span>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
                <Badge variant="secondary" className="mt-1 text-[10px] px-2">
                    Nível {user.level}
                </Badge>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">{user.metricValue.toLocaleString("pt-BR")} {user.metricLabel}</p>
        </Link>
    );
}

function renderRankingList(users: RankedUser[], type: "writer" | "reader") {
    if (users.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum {type === "writer" ? "escritor" : "leitor"} ranqueado ainda.</p>
            </div>
        );
    }

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <div className="space-y-8">
            {/* Pódio Top 3 */}
            <div className="flex items-end justify-center gap-6 pt-4 pb-6">
                {/* 2nd place */}
                {top3[1] && (
                    <div className="flex flex-col items-center gap-3">
                        <PodiumCard user={top3[1]} size="md" />
                        <div className="w-20 h-12 bg-slate-200 dark:bg-slate-800 rounded-t-lg flex items-center justify-center">
                            <span className="font-black text-2xl text-slate-400">2</span>
                        </div>
                    </div>
                )}
                {/* 1st place */}
                {top3[0] && (
                    <div className="flex flex-col items-center gap-3 -translate-y-4">
                        <PodiumCard user={top3[0]} size="lg" />
                        <div className="w-20 h-20 bg-amber-200 dark:bg-amber-900/40 rounded-t-lg flex items-center justify-center">
                            <span className="font-black text-3xl text-amber-500">1</span>
                        </div>
                    </div>
                )}
                {/* 3rd place */}
                {top3[2] && (
                    <div className="flex flex-col items-center gap-3">
                        <PodiumCard user={top3[2]} size="sm" />
                        <div className="w-20 h-8 bg-orange-200 dark:bg-orange-900/30 rounded-t-lg flex items-center justify-center">
                            <span className="font-black text-xl text-orange-500">3</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Lista restante */}
            {rest.length > 0 && (
                <div className="space-y-2">
                    {rest.map((item) => {
                        const displayName = item.first_name
                            ? `${item.first_name}${item.last_name ? ` ${item.last_name}` : ""}`
                            : item.username;
                        
                        const isNewcomer = item.created_at
                            ? (new Date().getTime() - new Date(item.created_at).getTime()) <= 30 * 24 * 60 * 60 * 1000
                            : false;

                        return (
                            <Link key={item.id} href={`/profile/${item.username}`}>
                                <Card className="group hover:bg-accent/40 transition-colors border-border/60">
                                    <CardContent className="p-3 flex items-center gap-4">
                                        <span className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums shrink-0">
                                            #{item.rank}
                                        </span>

                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarImage src={item.avatar_url} />
                                            <AvatarFallback className="text-sm font-semibold">
                                                {item.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {displayName}
                                                </p>
                                                {isNewcomer && (
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="text-[9px] px-1.5 py-0 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 font-semibold gap-0.5 rounded shadow-sm shrink-0"
                                                        title="Escritor Revelação: Novo membro com boost de visibilidade!"
                                                    >
                                                        ⚡ Revelação
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">@{item.username}</p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <Badge variant="outline" className="text-[10px] px-2 hidden sm:flex">
                                                Nível {item.level}
                                            </Badge>
                                            <div className="text-right">
                                                <p className="text-sm font-bold tabular-nums">{item.metricValue.toLocaleString("pt-BR")}</p>
                                                <p className="text-[10px] text-muted-foreground">{item.metricLabel}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default async function RankingsPage() {
    const adminSupabase = createAdminSupabaseClient();
    const serverSupabase = await createServerSupabaseClient();

    const { data: { user } } = await serverSupabase.auth.getUser();

    // 1. Fetch Writers + Engagement Scores in parallel
    const [writerResult, engagementResult] = await Promise.all([
        adminSupabase
            .from("profiles")
            .select(`
                id, username, first_name, last_name, avatar_url, writer_level, writer_xp, xp, created_at
            `)
            .eq("is_admin", false)
            .neq("role", "admin"),

        // Batch engagement scores (1 query instead of N×M RPCs)
        (adminSupabase as any).rpc("get_writer_engagement_scores"),
    ]);

    const writerData = writerResult.data;
    const engagementData = engagementResult.data;

    let writers: RankedUser[] = [];

    if (writerData) {
        // Build engagement score map for O(1) lookup
        const engagementMap = new Map<string, number>();
        if (engagementData) {
            for (const row of engagementData as any[]) {
                engagementMap.set(row.author_id, Number(row.total_engagement) || 0);
            }
        }

        const mappedWriters = writerData.map((p: any) => {
            const totalEngagement = engagementMap.get(p.id) || 0;

            // Boost para novatos (contas com até 30 dias recebem multiplicador)
            let boostMultiplier = 1;
            if (p.created_at) {
                const createdDate = new Date(p.created_at);
                const diffTime = Math.max(0, Date.now() - createdDate.getTime());
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                if (diffDays <= 30) {
                    boostMultiplier = 1 + (30 - diffDays) * 0.05;
                }
            }

            return {
                id: p.id,
                username: p.username || "Usuário",
                first_name: p.first_name || "",
                last_name: p.last_name || "",
                avatar_url: p.avatar_url || "",
                level: calculateLevel(p.xp || 0),
                xp: p.xp || 0,
                metricValue: Math.round(totalEngagement * boostMultiplier),
                metricLabel: "pontos",
                created_at: p.created_at,
                rawViews: totalEngagement
            };
        });

        mappedWriters.sort((a, b) => b.metricValue - a.metricValue);

        writers = mappedWriters.slice(0, 20).map((w, i) => ({
            ...w,
            rank: i + 1,
        }));
    }

    // 2. Fetch Readers if User logged in
    let readers: RankedUser[] = [];
    if (user) {
        const { data: readerData } = await adminSupabase
            .from("profiles")
            .select("id, username, first_name, last_name, avatar_url, reader_level, reader_xp, xp")
            .eq("is_admin", false)
            .neq("role", "admin")
            .order("reader_xp", { ascending: false })
            .limit(20);

        if (readerData) {
            readers = readerData.map((p: any, i) => ({
                id: p.id,
                username: p.username || "Usuário",
                first_name: p.first_name || "",
                last_name: p.last_name || "",
                avatar_url: p.avatar_url || "",
                level: calculateLevel(p.xp || 0),
                xp: p.xp || 0,
                rank: i + 1,
                metricValue: p.reader_xp || 0,
                metricLabel: "XP",
            }));
        }
    }

    return (
        <div className="content-wrapper min-h-screen pb-24 pt-10 px-4 lg:px-0">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    Hall da Fama
                </h1>
                <p className="text-muted-foreground text-base max-w-md">
                    Os talentos mais brilhantes e os leitores mais dedicados da comunidade.
                </p>
            </div>

            <Tabs defaultValue="escritores" className="w-full max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="escritores" className="gap-2">
                        <Feather className="h-4 w-4" />
                        Escritores
                    </TabsTrigger>
                    <TabsTrigger value="leitores" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Leitores
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="escritores" className="mt-0 focus-visible:ring-0">
                    {renderRankingList(writers, "writer")}
                </TabsContent>

                <TabsContent value="leitores" className="mt-0 focus-visible:ring-0">
                    {!user ? (
                        <Card className="py-16 text-center">
                            <CardContent className="flex flex-col items-center gap-4">
                                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center">
                                    <Lock className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold mb-1">Apenas para membros</h2>
                                    <p className="text-sm text-muted-foreground max-w-xs">
                                        O ranking de leitores é exclusivo para quem faz parte da comunidade.
                                    </p>
                                </div>
                                <Button asChild size="sm" className="rounded-full px-6">
                                    <Link href="/login">Entrar para ver</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        renderRankingList(readers, "reader")
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
