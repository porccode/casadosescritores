import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createNotificationAction } from "@/app/actions/notifications";

/**
 * Follow API.
 * 
 * Handles following and unfollowing users with XP awarding and notifications.
 */

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'follow_actions');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const { targetUserId, action } = await request.json();

        if (!targetUserId || !['follow', 'unfollow'].includes(action)) {
            return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
        }

        if (user.id === targetUserId) {
            return NextResponse.json({ error: "Você não pode seguir a si mesmo" }, { status: 400 });
        }

        const supabase = createAdminSupabaseClient();
        let xpGranted = false;

        if (action === 'follow') {
            // 1. Verificar se já segue
            const { data: existingFollow } = await supabase
                .from("follows")
                .select("*")
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId)
                .maybeSingle();

            if (existingFollow) {
                return NextResponse.json({ success: true, alreadyFollowing: true });
            }

            // 2. Criar Follow
            const { error: followError } = await supabase
                .from("follows")
                .insert({
                    follower_id: user.id,
                    following_id: targetUserId
                });

            if (followError) throw followError;

            // 3. Notificar o usuário seguido
            try {
                // Obter username do seguidor (o usuário logado)
                const { data: followerProfile } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("id", user.id)
                    .single();

                await createNotificationAction({
                    userId: targetUserId,
                    targetId: user.id,
                    type: 'follow',
                    content: `${followerProfile?.username || "Alguém"} começou a seguir você`
                });
            } catch (notifError) {
                console.error("Erro ao enviar notificação de follow:", notifError);
            }

        } else {
            // Deixar de seguir
            const { error: unfollowError } = await supabase
                .from("follows")
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId);

            if (unfollowError) throw unfollowError;
        }

        return NextResponse.json({
            success: true,
            action,
            xpAwarded: xpGranted
        });

    } catch (error: any) {
        console.error("Erro na API de Follow:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
