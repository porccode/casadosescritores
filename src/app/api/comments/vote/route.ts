import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { logAuditAction } from "@/services/audit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";


export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'comment_votes');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const supabase = createAdminSupabaseClient();
        const { commentId, voteType } = await request.json();

        if (!commentId || !voteType) {
            return NextResponse.json(
                { error: "commentId e voteType são obrigatórios" },
                { status: 400 }
            );
        }

        if (!['like', 'dislike'].includes(voteType)) {
            return NextResponse.json({ error: "voteType inválido" }, { status: 400 });
        }

        const userId = user.id;

        // 1. Verificar se já existe um voto
        const { data: existingVote, error: fetchError } = await supabase
            .from('comment_votes')
            .select('*')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchError) {
            return NextResponse.json({ error: "Erro ao buscar voto" }, { status: 500 });
        }

        let action = '';
        let xpGranted = false;

        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // Remove o voto (toggle off)
                const { error: deleteError } = await supabase
                    .from('comment_votes')
                    .delete()
                    .eq('id', existingVote.id);

                if (deleteError) throw deleteError;
                action = 'removed';
            } else {
                // Atualiza o voto
                const { error: updateError } = await supabase
                    .from('comment_votes')
                    .update({ vote_type: voteType })
                    .eq('id', existingVote.id);

                if (updateError) throw updateError;
                action = 'updated';
            }
        } else {
            // Cria um novo voto
            const { error: insertError } = await supabase
                .from('comment_votes')
                .insert({
                    comment_id: commentId,
                    user_id: userId,
                    vote_type: voteType
                });

            if (insertError) throw insertError;
            action = 'inserted';


        }

        // Auditoria
        await logAuditAction({
            userId,
            action: `vote.${action}`,
            entityType: 'comment_vote',
            entityId: commentId,
            metadata: { vote_type: voteType },
            request
        });

        return NextResponse.json({ success: true, action, xpAwarded: xpGranted });

    } catch (error) {
        console.error("Erro na API de votos de comentários:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
