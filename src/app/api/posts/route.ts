import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: posts, error } = await (supabase as any)
        .from("posts")
        .select(`
            id,
            content,
            created_at,
            like_count,
            reply_count:recursive_reply_count,
            repost_count,
            author:profiles!author_id!inner(id, username, avatar_url, first_name, last_name, is_admin)
        `)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("[ API Posts ] Erro:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (posts && posts.length > 0) {
        const postIds = posts.map(p => p.id);

        const [likesRes, repostsRes] = user ? await Promise.all([
            (supabase as any).from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
            (supabase as any).from("post_reposts").select("post_id").eq("user_id", user.id).in("post_id", postIds)
        ]) : [null, null];

        const likedPostIds = new Set(likesRes?.data?.map((l: any) => l.post_id) || []);
        const repostedPostIds = new Set(repostsRes?.data?.map((r: any) => r.post_id) || []);

        const enrichedPosts = posts.map(post => ({
            ...post,
            reply_count: post.reply_count || 0,
            isLiked: likedPostIds.has(post.id),
            isReposted: repostedPostIds.has(post.id)
        }));

        return NextResponse.json(enrichedPosts);
    }

    return NextResponse.json(posts);
}
