import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { Metadata } from "next";
import { getMediaUrl } from "@/lib/utils";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileContentManager from "@/components/profile/ProfileContentManager";
import DesktopHeader from "@/components/navigation/DesktopHeader";

/**
 * ProfilePage.
 * 
 * ARCHITECTURE:
 * - High-authority public profile entry point.
 * - Logic: Handles cross-reference permissions (Admin vs Public), stats orchestration, and canonical metadata.
 * - Layout: Follows the Section/Container rhythm sync standards.
 */

export const revalidate = 5; // ISR - 5s

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const supabase = createAdminSupabaseClient();

  const { data: profile } = await (supabase
    .from("profiles")
    .select("username, first_name, last_name, bio, avatar_url")
    .ilike("username", decodedUsername)
    .single() as any);

  if (!profile) return { title: "Perfil não encontrado" };

  const displayName = profile.first_name || profile.last_name
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : profile.username;

  const pageTitle = `${displayName} (@${profile.username})`;
  const description = profile.bio || `Confira o perfil de ${displayName} na Casa dos Escritores.`;
  
  // Build dynamic OG Image URL for Author
  const ogUrl = new URL("https://casadosescritores.com.br/api/og");
  ogUrl.searchParams.set("title", displayName);
  ogUrl.searchParams.set("type", "Perfil do Autor");
  if (profile.avatar_url) ogUrl.searchParams.set("cover", getMediaUrl(profile.avatar_url, 'avatars'));

  const finalImageUrl = ogUrl.toString();

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: `https://casadosescritores.com.br/profile/${profile.username}`,
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
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [finalImageUrl],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const supabaseAdmin = createAdminSupabaseClient();
  const supabaseAuth = await createServerSupabaseClient();

  // 1. Auth & Profile Base Fetch in parallel (Round 1)
  const [authRes, profileRes] = await Promise.all([
    supabaseAuth.auth.getUser(),
    supabaseAdmin.from("profiles").select("*").ilike("username", decodedUsername).single()
  ]);

  const user = authRes.data.user;
  const currentUserId = user?.id || null;
  const profile = profileRes.data;

  if (!profile) return notFound();

  const isOwnProfile = currentUserId === profile.id;

  // 2. Fetch Observer Profile, Stats, Relationships, Observer Data, Comments Count and Pinned Series in parallel (Round 2)
  const [
    observerProfileRes,
    followersRes,
    followingRes,
    postsRes,
    commentsRes,
    followCheckRes,
    observerDataRes,
    pinnedSeriesRes
  ] = await Promise.all([
    currentUserId
      ? supabaseAdmin.from("profiles").select("is_admin").eq("id", currentUserId).single()
      : Promise.resolve({ data: null }),
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).eq("author_id", profile.id).is("parent_id", null),
    supabaseAdmin.from("comments").select("*", { count: "exact", head: true }).eq("author_id", profile.id),
    currentUserId && !isOwnProfile
      ? supabaseAdmin.from("follows").select("id").eq("follower_id", currentUserId).eq("following_id", profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    currentUserId
      ? supabaseAdmin.from("profiles").select("username, avatar_url").eq("id", currentUserId).single()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("series")
      .select("id, title, slug, cover_url, updated_at, genre, chapter_count, description")
      .eq("author_id", profile.id)
      .eq("is_pinned", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const observerProfile = observerProfileRes.data;
  const isObserverAdmin = !!observerProfile?.is_admin;
  const commentsCount = commentsRes.count || 0;

  const stats = {
    followersCount: followersRes.count || 0,
    followingCount: followingRes.count || 0,
    postsCount: postsRes.count || 0,
  };

  const isFollowing = !!followCheckRes.data;
  const observerData = observerDataRes.data;
  let pinnedSeries = pinnedSeriesRes.data;
  if (pinnedSeries && (pinnedSeries.chapter_count || 0) === 0 && !isOwnProfile && !isObserverAdmin) {
    pinnedSeries = null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopHeader pageTitle={profile.username} />

      {/* Structural Hierarchy: Header -> Manager (Tabs/Feed) */}
      <ProfileHeader
        profile={profile}
        stats={stats}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
        isFollowing={isFollowing}
      />

      <main className="content-wrapper py-8 px-4 lg:px-0">
        <ProfileContentManager
          profileId={profile.id}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
          currentUserAvatar={observerData?.avatar_url}
          currentUsername={observerData?.username}
          canPost={true}
          profile={profile}
          isAdmin={isObserverAdmin}
          featuredSeries={pinnedSeries}
          commentsCount={commentsCount}
        />
      </main>

      {/* JSON-LD for Search Indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username,
            "alternateName": profile.username,
            "description": profile.bio,
            "image": profile.avatar_url,
            "url": `https://casadosescritores.com.br/profile/${encodeURIComponent(profile.username)}`
          })
        }}
      />
    </div>
  );
}
