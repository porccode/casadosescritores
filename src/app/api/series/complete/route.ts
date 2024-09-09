// src/app/api/series/complete/route.ts
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// ✅ Mudado de GET para POST para operação de mutação
export async function POST(request: NextRequest) {
    try {
        const { seriesId, isCompleted } = await request.json();

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

        // Usar factory centralizado para operações de banco
        const supabase = createAdminSupabaseClient();

        // ✅ SEGURANÇA: Verificar se o usuário é o autor da série
        const { data: series, error: seriesError } = await supabase
            .from("series")
            .select("author_id, title, is_completed")
            .eq("id", seriesId)
            .single();

        if (seriesError || !series) {
            return NextResponse.json(
                { error: "Série não encontrada" },
                { status: 404 }
            );
        }

        if (series.author_id !== user.id) {
            console.error(`[SECURITY] Tentativa de alteração não autorizada: user=${user.id}, series_author=${series.author_id}`);
            return NextResponse.json(
                { error: "Apenas o autor pode alterar o status desta série" },
                { status: 403 }
            );
        }

        // Determinar novo status (toggle se não especificado)
        const newStatus = isCompleted !== undefined ? isCompleted : !series.is_completed;

        // Marcar a série como completa/incompleta
        const { error: updateError } = await supabase
            .from("series")
            .update({
                is_completed: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", seriesId);

        if (updateError) {
            console.error("Erro ao atualizar série:", updateError);
            return NextResponse.json(
                { error: `Erro ao atualizar série: ${updateError.message}` },
                { status: 500 }
            );
        }

        let xpAwarded = false;

        return NextResponse.json({
            success: true,
            is_completed: newStatus,
            xpAwarded,
            message: newStatus
                ? `Série "${series.title}" marcada como concluída`
                : `Série "${series.title}" marcada como em andamento`
        });

    } catch (error: any) {
        console.error("Erro ao atualizar série:", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}
