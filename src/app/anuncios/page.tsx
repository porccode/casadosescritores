import { createServerSupabaseClient } from "@/lib/supabase-server";
import { formatTitle, generateSlug } from "@/lib/utils";
import ContentCard from "@/components/ContentCard";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { Megaphone, FileText } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Comunicados e Novidades | Casa dos Escritores",
    description: "Fique por dentro das últimas atualizações, melhorias e novidades da plataforma.",
    alternates: {
        canonical: "https://casadosescritores.com.br/anuncios",
    },
};

export const revalidate = 60; // Revalidate every minute

export default async function AnnouncementsListPage() {
    const supabase = await createServerSupabaseClient();

    // 1. Fetch System Announcements
    const { data: systemAnnouncements } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // 2. Fetch Editorial Announcements (Stories)
    const { data: editorialAnnouncements } = await supabase
        .from("chapters")
        .select(`
            id, 
            title, 
            content, 
            created_at, 
            slug,
            series!inner(title)
        `)
        .eq("series.title", "Comunicados Oficiais")
        .eq("is_draft", false)
        .lte("published_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    // 3. Normalize and Merge
    const normalizedSystem = ((systemAnnouncements || []) as any[]).map(a => ({
        id: a.id,
        title: a.title,
        excerpt: a.message,
        created_at: a.created_at,
        type: 'system',
        slug: generateSlug(a.title, a.id),
        author: { username: "Administrador" }
    }));

    const normalizedEditorial = ((editorialAnnouncements || []) as any[]).map(c => ({
        id: c.id,
        title: c.title,
        excerpt: c.content,
        created_at: c.created_at,
        type: 'editorial',
        slug: c.slug || generateSlug(c.title, c.id), // Use DB slug if available
        author: { username: "Equipe Editorial" }
    }));

    const allAnnouncements = [...normalizedSystem, ...normalizedEditorial].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <PageLayout>
            <Section size="sm" container>
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Comunicados</h1>
                        <p className="text-muted-foreground">
                            Acompanhe as novidades e atualizações oficiais da Casa dos Escritores.
                        </p>
                    </div>

                    {allAnnouncements.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                            <p>Nenhum comunicado no momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allAnnouncements.map((item) => (
                                <ContentCard
                                    key={`${item.type}-${item.id}`}
                                    variant="horizontal" // Fixed variant type
                                    title={item.title}
                                    href={`/anuncios/${item.slug}`}
                                    summary={item.excerpt ? item.excerpt.substring(0, 120) + "..." : ""}
                                    footer={{
                                        author: item.author.username,
                                        date: new Date(item.created_at).toLocaleDateString('pt-BR')
                                    }}
                                    badges={{
                                        topRight: item.type === 'system' ? "Sistema" : "Editorial"
                                    }}
                                    subtitle={{
                                        text: item.type === 'system' ? "Aviso" : "Artigo",
                                        icon: item.type === 'system' ? Megaphone : FileText
                                    }}
                                    isAnnouncementPost={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Section>
        </PageLayout>
    );
}
