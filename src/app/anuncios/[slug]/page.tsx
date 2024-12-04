import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ContentViewer from "@/components/content-viewer";
import { formatTitle, extractIdFromSlug, generateSlug } from "@/lib/utils";
import { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

// Helper to validate if string is UUID or Number
function isValidId(id: string | null): boolean {
    if (!id) return false;
    // Check for UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    // Check for Numeric ID format (assuming ids can be numbers too, based on utils)
    const isNumber = /^\d+$/.test(id);
    return isUUID || isNumber;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const { slug } = resolvedParams;
        const id = extractIdFromSlug(slug);
        const hasValidId = isValidId(id);

        const supabase = await createServerSupabaseClient();

        let announcement = null;

        // 1. Try announcements table (Only if ID exists and is valid)
        if (hasValidId && id) {
            const { data } = await supabase
                .from("announcements")
                .select("title, message, created_at")
                .eq("id", id)
                .single();
            // Assuming successful fetch implies valid ID usage
            if (data) announcement = data;
        }

        if (announcement) {
            const description = announcement.message
                ? announcement.message.substring(0, 160).replace(/<[^>]*>/g, '').trim() + "..."
                : "Anúncio da Casa dos Escritores";

            return {
                title: formatTitle(announcement.title || "Anúncio"),
                description: description,
                alternates: {
                    canonical: `https://casadosescritores.com.br/anuncios/${slug}`,
                },
            };
        }

        // 2. Try chapters table (Editorial Announcements)
        let query = supabase.from("chapters").select("title, content");

        if (hasValidId && id) {
            query = query.eq("id", id);
        } else {
            // Fallback to pure slug query
            query = query.eq("slug", slug);
        }

        const { data: chapter } = await query.maybeSingle();

        if (chapter) {
            // @ts-ignore
            const description = chapter.content
                // @ts-ignore
                ? chapter.content.substring(0, 160).replace(/<[^>]*>/g, '').trim() + "..."
                : "Anúncio da Casa dos Escritores";

            return {
                // @ts-ignore
                title: formatTitle(chapter.title),
                description: description,
                alternates: {
                    canonical: `https://casadosescritores.com.br/anuncios/${slug}`,
                },
            };
        }

        return { 
            title: "Anúncio não encontrado",
            alternates: {
                canonical: `https://casadosescritores.com.br/anuncios/${slug}`,
            },
        };

    } catch (error) {
        return { title: "Anúncio" };
    }
}

export default async function AnnouncementPage({ params }: Props) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const id = extractIdFromSlug(slug);
    const hasValidId = isValidId(id);

    const supabase = await createServerSupabaseClient();

    let announcement = null;
    let isEditorial = false;
    let editorialAuthor = null;

    // 1. Try announcements table (Only if ID exists AND is valid)
    if (hasValidId && id) {
        const { data, error } = await supabase
            .from("announcements")
            .select("*")
            .eq("id", id)
            .single();

        if (data && !error) {
            announcement = data;
        }
    }

    // 2. If not found, try chapters table (Editorial Announcements)
    if (!announcement) {
        let query: any = supabase
            .from("chapters")
            .select(`
                id, 
                title, 
                content, 
                created_at,
                author:profiles!author_id(id, username, avatar_url, bio, first_name, last_name)
            `);

        if (hasValidId && id) {
            query = query.eq("id", id);
        } else {
            // Fallback to pure slug query
            query = query.eq("slug", slug);
        }

        const { data: chapter, error: chapterError } = await query.maybeSingle();

        if (chapter && !chapterError) {
            announcement = {
                id: (chapter as any).id,
                title: (chapter as any).title,
                message: (chapter as any).content,
                created_at: (chapter as any).created_at,
            } as any;
            isEditorial = true;
            // @ts-ignore
            editorialAuthor = (chapter as any).author;
        } else if (hasValidId) {
            // Double check: if valid ID search failed, try slug anyway.
            // This handles edge cases where extractIdFromSlug() incorrectly identifies a part of the slug as an ID
            // or if the ID extracted doesn't match the DB content for some reason.
            const { data: chapterSlug, error: slugError } = await (supabase
                .from("chapters")
                .select(`
                    id, 
                    title, 
                    content, 
                    created_at,
                    author:profiles!author_id(id, username, avatar_url, bio, first_name, last_name)
                `)
                .eq("slug", slug)
                .maybeSingle() as any);

            if (chapterSlug && !slugError) {
                announcement = {
                    id: chapterSlug.id,
                    title: chapterSlug.title,
                    message: chapterSlug.content,
                    created_at: chapterSlug.created_at,
                } as any;
                isEditorial = true;
                // @ts-ignore
                editorialAuthor = chapterSlug.author;
            }
        }
    }

    if (!announcement) {
        notFound();
    }

    // Canonical Redirect logic
    const expectedSlug = generateSlug(announcement.title, announcement.id);
    if (slug !== expectedSlug) {
        redirect(`/anuncios/${expectedSlug}`);
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Determine author to display
    let authorProfile;

    if (isEditorial && editorialAuthor) {
        authorProfile = editorialAuthor;
    } else {
        // Fallback for system announcements: fetch admin profile
        const { data: adminProfile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, bio")
            .eq("username", "administrador")
            .single();

        authorProfile = adminProfile || {
            id: "system",
            username: "administrador",
            avatar_url: "/logo.png"
        };
    }

    return (
        <div className="content-wrapper">
            <ContentViewer
                id={announcement.id}
                title={formatTitle(announcement.title || "Anúncio")}
                content={announcement.message || ""}
                createdAt={announcement.created_at}
                author={authorProfile}
                contentType={isEditorial ? "chapter" : "announcement"}
                userId={user?.id}
            />
        </div>
    );
}
