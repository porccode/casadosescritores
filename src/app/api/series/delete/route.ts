// src/app/api/series/delete/route.ts
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// ✅ Mudado de GET para POST para operação de mutação
export async function POST(request: NextRequest) {
    try {
        const { seriesId } = await request.json();

        if (!seriesId) {
            return NextResponse.json(
                { error: "ID da série é obrigatório" },
                { status: 400 }
            );
        }

        // ✅ SEGURANÇA: Validar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(seriesId)) {
            return NextResponse.json(
                { error: "Formato de ID inválido" },
                { status: 400 }
            );
        }

        // ✅ SEGURANÇA: Autenticação via cookies (corrigido)
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        // Usar service role para operações de banco
        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é o autor da série
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id, title, slug, genre")
            .eq("id", seriesId)
            .single();

        if (seriesError || !series) {
            return NextResponse.json(
                { error: "Série não encontrada" },
                { status: 404 }
            );
        }

        // ✅ SEGURANÇA: Verificar se o usuário é o autor da série OU administrador
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        const isAdmin = profile?.is_admin === true;

        if (series.author_id !== user.id && !isAdmin) {
            console.error(`[SECURITY] Tentativa de exclusão não autorizada: user=${user.id}, series_author=${series.author_id}`);
            return NextResponse.json(
                { error: "Apenas o autor ou administradores podem excluir esta série" },
                { status: 403 }
            );
        }

        // Buscar username do autor para revalidar seu perfil
        let authorUsername = "";
        if (series.author_id) {
            const { data: authorProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", series.author_id)
                .single();
            authorUsername = authorProfile?.username || "";
        }

        // Excluir capítulos da série primeiro
        const { error: chaptersError } = await supabase
            .from("chapters")
            .delete()
            .eq("series_id", seriesId);

        if (chaptersError) {
            console.error("Erro ao excluir capítulos:", chaptersError);
        }

        // Excluir comentários da série
        const { error: commentsError } = await supabase
            .from("comments")
            .delete()
            .eq("series_id", seriesId);

        if (commentsError) {
            console.error("Erro ao excluir comentários:", commentsError);
        }

        // Excluir a série
        const { error: deleteError } = await supabase
            .from("series")
            .delete()
            .eq("id", seriesId);

        if (deleteError) {
            console.error("Erro ao excluir série:", deleteError);
            return NextResponse.json(
                { error: `Erro ao excluir série: ${deleteError.message}` },
                { status: 500 }
            );
        }

        // Revalidar caminhos no Next.js para refletir a exclusão instantaneamente
        try {
            const { revalidatePath } = await import("next/cache");
            const { sanitizeSlug } = await import("@/lib/utils");

            revalidatePath("/");
            revalidatePath("/series");
            
            if (series.slug) {
                revalidatePath(`/series/${series.slug}`);
            }
            if (authorUsername) {
                revalidatePath(`/profile/${authorUsername}`);
            }
            if (series.genre) {
                const categorySlug = sanitizeSlug(series.genre);
                revalidatePath(`/explorar/${categorySlug}`);
            }
        } catch (revalError) {
            console.error("Erro ao revalidar caminhos após exclusão da série:", revalError);
        }

        return NextResponse.json({
            success: true,
            message: `Série "${series.title}" excluída com sucesso`
        });

    } catch (error: any) {
        console.error("Erro ao excluir série:", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}
