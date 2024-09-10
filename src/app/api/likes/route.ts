import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { grantXP } from "@/services/xp";

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'likes');
        if (rateLimitResponse) return rateLimitResponse;

        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();
        const { id, type, action } = await request.json();

        if (!id || !type) {
            return NextResponse.json({ error: "ID e tipo são obrigatórios" }, { status: 400 });
        }

        // ✅ SEGURANÇA: Validar tipo
        const allowedTypes = ["chapter", "series"];
        if (!allowedTypes.includes(type)) {
            return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
        }

        const table = type === "chapter" ? "chapters" : "series";
        const increment = action === "unlike" ? -1 : 1;

        // Buscar contador atual
        const { data: currentData, error: fetchError } = await (supabase
            .from(table as any)
            .select("like_count")
            .eq("id", id)
            .single() as any);

        if (fetchError) {
            return NextResponse.json({ error: "Conteúdo não encontrado" }, { status: 404 });
        }

        const currentCount = (currentData as any)?.like_count || 0;
        const newCount = Math.max(0, currentCount + increment);

        // Atualizar
        const { data, error } = await (supabase
            .from(table as any)
            .update({ like_count: newCount } as any)
            .eq("id", id)
            .select("like_count")
            .single() as any);

        if (error) {
            return NextResponse.json({ error: "Erro ao processar like" }, { status: 500 });
        }

        // ✅ Gamificação: Premiar XP pelo Like (apenas se for 'like')
        let xpGranted = false;
        if (action !== "unlike") {
            const xpResult = await grantXP(user.id, 'POST_LIKE', id);
            xpGranted = xpResult.awarded;
        }

        return NextResponse.json({
            success: true,
            likes: (data as any).like_count,
            xpAwarded: xpGranted
        });

    } catch (error) {
        console.error("Erro na API de likes:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
