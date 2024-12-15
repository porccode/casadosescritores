// src/app/api/admin/restore-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logAdminAction } from "@/lib/security-logger";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { csrfProtection } from "@/lib/csrf-protection";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'admin');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Proteção CSRF
        const csrfResponse = await csrfProtection(request, 'admin_restore_user');
        if (csrfResponse) {
            return csrfResponse;
        }

        // Verificar autenticação
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verificar se é administrador
        const { data: profile } = await supabaseAuth
            .from("profiles")
            .select(ADMIN_ACCESS_PROFILE_SELECT)
            .eq("id", user.id)
            .single();

        if (!profile || !isAdminRole(profile)) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "ID de usuário não informado" }, { status: 400 });
        }

        const supabase = createAdminSupabaseClient();

        // 1. Restaurar perfil
        const { error: restoreError } = await supabase
            .from("profiles")
            .update({
                account_status: 'active',
                deleted_at: null,
                deletion_scheduled_at: null
            })
            .eq("id", userId);

        if (restoreError) {
            console.error("Erro ao restaurar perfil:", restoreError);
            return NextResponse.json({ error: "Erro ao restaurar perfil no banco" }, { status: 500 });
        }

        // 2. Desbloquear no Auth (remover banimento)
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
            ban_duration: '0h', // Remove o banimento
        });

        if (authError) {
            console.error("Erro ao remover banimento no Auth:", authError);
            // Avisar que foi restaurado no DB mas pode haver problemas no login
        }

        // Log de auditoria
        logAdminAction(user.id, 'restore_user_success', userId, request);

        return NextResponse.json({
            success: true,
            message: "Usuário restaurado com sucesso"
        });

    } catch (error) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
