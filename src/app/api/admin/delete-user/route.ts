// src/app/api/admin/delete-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logAdminAction, logPrivilegeEscalation } from "@/lib/security-logger";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { csrfProtection } from "@/lib/csrf-protection";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ADMIN_ACCESS_PROFILE_SELECT, getEffectiveRole, isAdminRole } from "@/lib/roles";
import { wipeUserDataHard } from "@/lib/delete-user";
export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting para operações administrativas
        const rateLimitResponse = await rateLimitMiddleware(request, 'admin');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Aplicar proteção CSRF crítica para operações administrativas
        const csrfResponse = await csrfProtection(request, 'admin_delete_user');
        if (csrfResponse) {
            return csrfResponse;
        }

        // Verificar autenticação primeiro
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Não autorizado - faça login" },
                { status: 401 }
            );
        }

        // Verificar se o usuário é administrador
        const { data: profile, error: profileError } = await supabaseAuth
            .from("profiles")
            .select(ADMIN_ACCESS_PROFILE_SELECT)
            .eq("id", user.id)
            .single();

        if (profileError || !profile || !isAdminRole(profile)) {
            // Log tentativa de escalação de privilégios
            logPrivilegeEscalation(
                user.id,
                'delete_user',
                getEffectiveRole(profile),
                request
            );

            return NextResponse.json(
                { error: "Acesso negado - privilégios de administrador necessários" },
                { status: 403 }
            );
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "ID de usuário não informado" },
                { status: 400 }
            );
        }

        // Validar formato do userId (UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return NextResponse.json(
                { error: "Formato de ID de usuário inválido" },
                { status: 400 }
            );
        }

        // Impedir que admin exclua a própria conta
        if (userId === user.id) {
            return NextResponse.json(
                { error: "Não é possível excluir sua própria conta" },
                { status: 400 }
            );
        }

        // Cliente Supabase com Service Role para operações administrativas
        const supabase = createAdminSupabaseClient();

        // Verificar se o usuário a ser excluído existe e obter informações
        const { data: targetUser, error: getUserError } = await supabase
            .from("profiles")
            .select("username, role, account_status")
            .eq("id", userId)
            .single();

        if (getUserError || !targetUser) {
            return NextResponse.json(
                { error: "Usuário não encontrado" },
                { status: 404 }
            );
        }

        // Impedir exclusão de outros administradores (proteção adicional)
        if (targetUser.role === 'admin') {
            logAdminAction(
                user.id,
                'delete_admin_attempt',
                userId,
                request
            );

            return NextResponse.json(
                { error: "Não é possível excluir outro administrador" },
                { status: 403 }
            );
        }

        // Verificar se já está deletado
        if (targetUser.account_status === 'deleted') {
            return NextResponse.json(
                { error: "Este usuário já está marcado como deletado" },
                { status: 400 }
            );
        }

        // Etapa: Hard Delete com limpeza manual de dependências
        const hardDeleteError = await wipeUserDataHard(supabase, userId);

        if (hardDeleteError) {
            console.error("Erro final ao aplicar hard delete no auth.users:", hardDeleteError);
            return NextResponse.json(
                { error: "Erro ao excluir permanentemente o usuário.", details: hardDeleteError },
                { status: 500 }
            );
        }

        // Log de auditoria após hard delete bem-sucedido
        logAdminAction(user.id, 'hard_delete_user', userId, request);

        return NextResponse.json({
            success: true,
            message: "Usuário excluído permanentemente do sistema.",
        });

    } catch (error: any) {
        console.error("Erro no servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
