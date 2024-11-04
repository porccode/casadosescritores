import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import PostDetailReplies from "@/components/profile/PostDetailReplies";
import { extractIdFromSlug, generateSlug } from "@/lib/utils";
import DesktopHeader from "@/components/navigation/DesktopHeader";
import { GuestCTA } from "@/components/ui/GuestCTA";

/**
 * PostPage.
 * 
 * ARCHITECTURE:
 * - High-authority entry point for specific social interactions.
 * - Logic: Handles slug redirection, ancestor (thread) discovery, and permissions.
 * - Visualization: Standardizes the thread hierarchy via Breadcrumbs.
 */

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const id = extractIdFromSlug(slug);
    if (!id) return { title: "Post não encontrado" };

    const supabase = createAdminSupabaseClient();
    const { data: post } = await supabase
        .from("posts")
        .select("content, author:profiles!posts_author_id_fkey(username, first_name, last_name)")
        .eq("id", id)
        .single();

    if (!post) return { title: "Post não encontrado" };

    const authorName = post.author?.first_name || post.author?.last_name
        ? `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim()
        : post.author?.username;

    const preview = post.content.replace(/<[^>]*>/g, '').slice(0, 160);
    const title = `${authorName} na Casa dos Escritores: "${preview.slice(0, 50)}..."`;

    return {
        title,
        description: preview,
        openGraph: {
            title,
            description: preview,
            type: "article",
        }
    };
}

export default async function PostPage({ params }: Props) {
    const { slug } = await params;
    const id = extractIdFromSlug(slug);

    if (!id) return notFound();

    const supabaseAuth = await createServerSupabaseClient();

    // 1. Fetch Auth
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const currentUserId = user?.id || null;

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <DesktopHeader pageTitle="Post Privado" />
                <main className="max-w-2xl mx-auto py-8 px-4 lg:px-0">
                    <GuestCTA 
                        title="Post Privado"
                        description="Este post faz parte da comunidade privada. Faça login para ver a conversa completa e interagir."
                    />
                </main>
            </div>
        );
    }

    const supabaseAdmin = createAdminSupabaseClient();

    const { data: post } = await supabaseAdmin
        .from("posts")
        .select(`
            *,
            author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name, subscription_plan)
        `)
        .eq("id", id)
        .single();

    if (!post) return notFound();

    // 2. Canonical Redirect
    const titleSnippet = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 50) : "post";
    const expectedSlug = generateSlug(titleSnippet, post.id);

    if (slug !== expectedSlug) {
        return redirect(`/post/${expectedSlug}`);
    }

    // 3. Fetch Thread Data (Parallel)
    const [ancestors, replies, userCtxRes] = await Promise.all([
        getAncestors(post.parent_id, supabaseAdmin),
        getDescendants(post.id, post.author.username, supabaseAdmin),
        currentUserId
            ? supabaseAdmin.from("profiles").select("username, avatar_url").eq("id", currentUserId).single()
            : Promise.resolve({ data: null })
    ]);

    const observer = userCtxRes.data;

    // 4. Thread Interaction Context (Likes/Reposts)
    let isLiked = false;
    let isReposted = false;
    let likedThreadPostIds = new Set<string>();
    let repostedThreadPostIds = new Set<string>();

    if (currentUserId) {
        const queryIds = [id, ...ancestors.map(a => a.id), ...replies.map(r => r.id)];
        const [likesRes, repostsRes] = await Promise.all([
            supabaseAdmin.from("post_likes").select("post_id").eq("user_id", currentUserId).in("post_id", queryIds),
            supabaseAdmin.from("post_reposts").select("post_id").eq("user_id", currentUserId).in("post_id", queryIds)
        ]);
        
        likesRes.data?.forEach((l: any) => likedThreadPostIds.add(l.post_id));
        repostsRes.data?.forEach((r: any) => repostedThreadPostIds.add(r.post_id));
        
        isLiked = likedThreadPostIds.has(id);
        isReposted = repostedThreadPostIds.has(id);
    }

    const enrichedAncestors = ancestors.map(a => ({
        ...a,
        isLiked: likedThreadPostIds.has(a.id),
        isReposted: repostedThreadPostIds.has(a.id)
    }));

    const enrichedReplies = replies.map(r => ({
        ...r,
        isLiked: likedThreadPostIds.has(r.id),
        isReposted: repostedThreadPostIds.has(r.id)
    }));

    const enrichedPost = { ...post, isLiked, isReposted, reply_count: replies.length };

    return (
        <div className="min-h-screen bg-background">
            <DesktopHeader pageTitle={`Post de @${post.author.username}`} />

            <main className="max-w-2xl mx-auto py-8 px-4 lg:px-0">
                {user ? (
                    <PostDetailReplies
                        mainPost={enrichedPost as any}
                        initialReplies={enrichedReplies as any}
                        ancestors={enrichedAncestors as any}
                        currentUserId={currentUserId}
                        currentUserAvatar={observer?.avatar_url}
                        currentUsername={observer?.username}
                    />
                ) : (
                    <GuestCTA 
                        title="Post Privado"
                        description="Este post faz parte da comunidade privada. Faça login para ver a conversa completa e interagir."
                    />
                )}
            </main>
        </div>
    );
}

// Thread Discovery Helper
async function getAncestors(parentId: string | null, supabase: any) {
    const ancestors = [];
    let currentId = parentId;
    while (currentId) {
        const { data, error } = await supabase
            .from("posts")
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name, subscription_plan)
            `)
            .eq("id", currentId)
            .single();
        if (error || !data) break;
        ancestors.unshift(data);
        currentId = data.parent_id;
        if (ancestors.length >= 10) break;
    }
    return ancestors;
}

// Descendants Discovery Helper (Recursive Thread)
async function getDescendants(parentId: string, mainPostAuthorUsername: string, supabase: any) {
    let allDescendants: any[] = [];
    let currentParentIds = [parentId];

    // Map to store id -> username for resolving parent usernames
    const usernameMap: Record<string, string> = {
        [parentId]: mainPostAuthorUsername
    };

    while (currentParentIds.length > 0) {
        const { data, error } = await supabase
            .from("posts")
            .select(`
                *,
                author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name, subscription_plan)
            `)
            .in("parent_id", currentParentIds)
            .order("created_at", { ascending: true });

        if (error || !data || data.length === 0) break;

        // Add found authors to the map
        data.forEach((d: any) => {
            if (d.author?.username) {
                usernameMap[d.id] = d.author.username;
            }
        });

        const processed = data.map((d: any) => ({
            ...d,
            parent_author_username: usernameMap[d.parent_id] || null,
            isLiked: false,
            isReposted: false
        }));

        allDescendants = [...allDescendants, ...processed];
        currentParentIds = data.map((d: any) => d.id);

        if (allDescendants.length >= 150) break; // Safety limit
    }

    // Sort by created_at (ascending)
    return allDescendants.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
    });
}
