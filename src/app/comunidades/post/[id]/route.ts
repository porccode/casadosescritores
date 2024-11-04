import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get("commentId");

        const supabase = createAdminSupabaseClient();

        // Buscar o slug da comunidade ligada ao post
        const { data: post, error } = await (supabase as any)
            .from("community_posts")
            .select(`
                community_id,
                communities:communities(slug)
            `)
            .eq("id", postId)
            .single();

        if (error || !post) {
            console.error("Erro ao buscar post da comunidade no redirecionamento:", error);
            return NextResponse.redirect(new URL("/comunidades", request.url));
        }

        const slug = (post.communities as any)?.slug;
        if (!slug) {
            console.error("Comunidade sem slug para o post:", postId);
            return NextResponse.redirect(new URL("/comunidades", request.url));
        }

        // Construir URL de redirecionamento elegante
        let targetUrl = `/comunidades/${slug}?post=${postId}`;
        if (commentId) {
            targetUrl += `#comment-${commentId}`;
        }

        return NextResponse.redirect(new URL(targetUrl, request.url));
    } catch (error) {
        console.error("Erro interno no redirecionamento do post da comunidade:", error);
        return NextResponse.redirect(new URL("/comunidades", request.url));
    }
}
