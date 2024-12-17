import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        // 1. Validar sessão do usuário (Autenticação Segura)
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        const authorId = user.id;

        // 2. Extrair dados da requisição
        const body = await request.json();
        const { contentType, contentId, contentTitle, seriesId, seriesTitle } = body;

        // Validação dos parâmetros básicos
        if (!contentType || !contentId || !contentTitle) {
            return NextResponse.json(
                { error: "Parâmetros obrigatórios ausentes: contentType, contentId, contentTitle" },
                { status: 400 }
            );
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(contentId)) {
            return NextResponse.json({ error: "Formato de ID de conteúdo inválido" }, { status: 400 });
        }

        if (seriesId && !uuidRegex.test(seriesId)) {
            return NextResponse.json({ error: "Formato de ID de série inválido" }, { status: 400 });
        }

        const adminSupabase = createAdminSupabaseClient();

        // 3. Obter seguidores do Autor
        const { data: authorFollowers, error: followersError } = await adminSupabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', authorId);

        if (followersError) {
            console.error("[notify-followers] Erro ao obter seguidores do autor:", followersError);
            throw followersError;
        }

        // 4. Obter seguidores da Série (se aplicável)
        let seriesFollowerIds: string[] = [];
        if (contentType === 'chapter' && seriesId) {
            const { data: seriesFollowers } = await adminSupabase
                .from('series_follows')
                .select('user_id')
                .eq('series_id', seriesId)
                .eq('notify_new_chapter', true);

            if (seriesFollowers) {
                seriesFollowerIds = seriesFollowers.map(f => f.user_id);
            }
        }

        // 5. Unir e deduplicar (sem incluir o próprio autor)
        const authorFollowerIds = (authorFollowers || []).map(f => f.follower_id);
        const allFollowerIds = [...new Set([...authorFollowerIds, ...seriesFollowerIds])]
            .filter(id => id !== authorId);

        if (allFollowerIds.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: "Nenhum seguidor para notificar" });
        }

        // 6. Obter username do Autor
        const { data: author } = await adminSupabase
            .from('profiles')
            .select('username')
            .eq('id', authorId)
            .single();

        // 7. Preparar Payloads
        const notificationType = contentType === 'chapter' ? 'new_chapter' : 'new_story';
        const additionalData: any = {
            username: author?.username
        };

        if (contentType === 'story') {
            additionalData.story_id = contentId;
            additionalData.story_title = contentTitle;
        } else if (contentType === 'series') {
            additionalData.series_id = contentId;
            additionalData.series_title = contentTitle;
            additionalData.story_title = `Série: ${contentTitle}`;
        } else if (contentType === 'chapter') {
            additionalData.chapter_id = contentId;
            additionalData.chapter_title = contentTitle;
            additionalData.series_id = seriesId;
            additionalData.series_title = seriesTitle;
        }

        const notifications = allFollowerIds.map(followerId => ({
            target_user_id: followerId,
            actor_id: authorId,
            type: notificationType,
            is_read: false,
            additional_data: additionalData,
            related_id: contentId
        }));

        // 8. Inserir notificações em lote (Batch Insert)
        const { error: insertError } = await adminSupabase
            .from('notifications')
            .insert(notifications);

        if (insertError) {
            console.error("[notify-followers] Erro ao inserir notificações:", insertError);
            throw insertError;
        }

        return NextResponse.json({ success: true, count: allFollowerIds.length });

    } catch (error: any) {
        console.error("[notify-followers] Erro no servidor:", error);
        return NextResponse.json(
            { error: `Erro interno do servidor: ${error.message}` },
            { status: 500 }
        );
    }
}
