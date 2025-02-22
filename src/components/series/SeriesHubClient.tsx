"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Compass, Library, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import ProfileWorks from "@/components/profile/ProfileWorks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FeaturedSeriesItem as SeriesWithAuthor } from "@/types/home";
import ContentCard from "@/components/ContentCard";
import { sanitizeSlug, cn, isSeriesAbandoned } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CategoryWithContent {
    name: string;
    items: SeriesWithAuthor[];
}

interface SeriesHubClientProps {
    initialCategories: CategoryWithContent[];
}

/**
 * SeriesHubClient.
 * 
 * DESIGN:
 * - High-speed tab orchestration with shallow routing.
 * - Discovery sections with high-authority metadata indicators.
 * - Responsive grid optimized for visual immersion.
 * - Age verification filtering for minors (+18 content restriction).
 */
export default function SeriesHubClient({ initialCategories }: SeriesHubClientProps) {
    const { user } = useAuth();
    const { isMinor } = useAgeVerification();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "explorar");

    // Filter explicit works for minors
    const filteredCategories = useMemo(() => {
        if (!isMinor) return initialCategories;
        return initialCategories.map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => !item.is_explicit),
        })).filter((cat) => cat.items.length > 0);
    }, [initialCategories, isMinor]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", value);
            router.replace(`/series?${params.toString()}`, { scroll: false });
        });
    };

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        } else if (!tab && activeTab !== "explorar") {
            setActiveTab("explorar");
        }
    }, [searchParams, activeTab]);

    return (
        <div className="content-wrapper px-4 lg:px-0">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="explorar" className="gap-2">
                            <Compass className="h-4 w-4" />
                            Explorar
                        </TabsTrigger>
                        <TabsTrigger value="minhas" className="gap-2">
                            <Library className="h-4 w-4" />
                            Minhas Séries
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Tabs value={activeTab} className={cn("transition-opacity duration-300", isPending && "opacity-50")}>
                <TabsContent value="explorar" className="m-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-14">
                        {filteredCategories.map((category) => (
                            <section key={category.name} className="group/section">
                                <div className="flex items-center justify-between gap-6 mb-8">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
                                        {category.name}
                                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-muted/40 border-none font-semibold opacity-60 rounded-full">
                                            {category.items.length}
                                        </Badge>
                                    </h2>
                                    <div className="flex-1 flex items-center gap-6">
                                        <Separator className="flex-1" />
                                        <Button variant="ghost" size="sm" asChild className="text-muted-foreground gap-1.5">
                                            <Link href={`/explorar/${encodeURIComponent(category.name)}`}>
                                                Ver Acervo
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-6 gap-y-12">
                                    {category.items.slice(0, 8).map((obra) => (
                                        <div key={obra.id} className="animate-in fade-in zoom-in-95 duration-500">
                                            <ContentCard
                                                variant="cover"
                                                title={obra.title}
                                                href={`/series/${obra.slug || sanitizeSlug(obra.title)}`}
                                                coverUrl={obra.cover_url}
                                                subtitle={{ text: obra.genres && obra.genres.length > 0 ? obra.genres.join(", ") : (obra.genre || "") }}
                                                badges={{
                                                    isCompleted: obra.is_completed || false,
                                                    isExplicit: obra.is_explicit || false,
                                                    isAbandoned: isSeriesAbandoned(obra.chapter_count, obra.updated_at, obra.is_completed)
                                                }}
                                                footer={{
                                                    author: obra.author_name || "Autor",
                                                    metrics: {
                                                        views: obra.view_count,
                                                        chapters: obra.chapter_count
                                                    }
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {initialCategories.length === 0 && (
                            <div className="py-20 text-center space-y-4 opacity-40">
                                <Compass className="h-12 w-12 mx-auto text-muted-foreground/20" />
                                <p className="text-sm text-muted-foreground">Nenhuma série encontrada para esta curadoria.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="minhas" className="m-0 border-none p-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {!user ? (
                        <Card className="border-border shadow-sm bg-muted/5 py-24 text-center max-w-md mx-auto rounded-2xl overflow-hidden">
                            <CardContent className="flex flex-col items-center">
                                <Library className="h-12 w-12 text-muted-foreground/20 mb-6" />
                                <h2 className="text-2xl font-bold tracking-tight mb-4">Laboratório de Autoria</h2>
                                <p className="text-sm text-muted-foreground/70 mb-10 leading-relaxed px-10">
                                    Identifique-se para acessar suas séries privativas e gerenciar suas publicações de forma organizada.
                                </p>
                                <Button size="lg" asChild className="rounded-full px-10">
                                    <Link href="/login">
                                        Autenticar Acesso
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="max-w-6xl mx-auto pb-20">
                            <ProfileWorks profileId={user.id} isOwnProfile={true} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
