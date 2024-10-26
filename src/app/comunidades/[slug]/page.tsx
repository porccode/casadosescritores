import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import CommunityDetailClient from "@/components/comunidades/CommunityDetailClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminSupabase = createAdminSupabaseClient();

  const { data: community } = await adminSupabase
    .from("communities")
    .select("name, description, avatar_url, cover_url")
    .eq("slug", slug)
    .single();

  if (!community) {
    return { title: "Comunidade não encontrada | Casa dos Escritores" };
  }

  return {
    title: `${community.name} | Comunidade | Casa dos Escritores`,
    description: community.description || `Participe da comunidade ${community.name} na Casa dos Escritores.`,
    openGraph: {
      title: `${community.name} | Casa dos Escritores`,
      description: community.description || `Participe da comunidade ${community.name}.`,
      images: community.avatar_url ? [{ url: community.avatar_url }] : [],
    },
  };
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const adminSupabase = createAdminSupabaseClient();

  // 1. Fetch community
  const { data: community, error: commError } = await adminSupabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (commError || !community) {
    return notFound();
  }

  // 2. Fetch members in parallel with posts
  const [membersRes, postsRes] = await Promise.all([
    adminSupabase
      .from("community_members")
      .select(`
        *,
        profile:profiles(id, username, first_name, last_name, avatar_url)
      `)
      .eq("community_id", community.id),
    adminSupabase
      .from("community_posts")
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(id, username, first_name, last_name, avatar_url),
        likes:community_post_likes(user_id),
        comments:comments!comments_community_post_id_fkey(id)
      `)
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
  ]);

  const initialMembers = (membersRes.data || []).map((m: any) => ({
    ...m,
    profile: m.profile
  }));

  const initialPosts = (postsRes.data || []).map((p: any) => ({
    ...p,
    author: p.author,
    likes: p.likes || [],
    likes_count: p.likes?.length || 0,
    comments_count: p.comments?.length || 0,
  }));

  return (
    <CommunityDetailClient
      initialCommunity={community}
      initialMembers={initialMembers}
      initialPosts={initialPosts}
      slug={slug}
    />
  );
}
