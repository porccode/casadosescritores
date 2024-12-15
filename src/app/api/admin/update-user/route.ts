// src/app/api/admin/update-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logAdminAction, logPrivilegeEscalation } from "@/lib/security-logger";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { csrfProtection } from "@/lib/csrf-protection";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import {
    ADMIN_ACCESS_PROFILE_SELECT,
    getEffectiveRole,
    isAdminRole,
    isKnownRole,
    shouldSyncLegacyAdminFlag,
} from "@/lib/roles";

export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'admin');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Aplicar proteção CSRF
        const csrfResponse = csrfProtection(request, 'admin_update_user');
        if (csrfResponse) {
            return csrfResponse;
        }

        // 1. Verificar autenticação e permissão de admin
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user: adminUser }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !adminUser) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { data: adminProfile } = await supabaseAuth
            .from("profiles")
            .select(ADMIN_ACCESS_PROFILE_SELECT)
            .eq("id", adminUser.id)
            .single();

        if (!isAdminRole(adminProfile)) {
            logPrivilegeEscalation(adminUser.id, 'update_user_attempt', getEffectiveRole(adminProfile), request);
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // 2. Extrair dados da requisição
        const { userId, email, username, first_name, last_name, role } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Formato de e-mail inválido" }, { status: 400 });
        }

        if (!isKnownRole(role)) {
            return NextResponse.json({ error: "Role inválido" }, { status: 400 });
        }

        const nextIsAdmin = shouldSyncLegacyAdminFlag(role);
        // 3. Cliente Supabase com Service Role para atualizar Auth
        const supabaseAdmin = createAdminSupabaseClient();

        // 4. Atualizar auth.users (necessário para mudar e-mail de login)
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { email: email, user_metadata: { username } }
        );

        if (authUpdateError) {
            console.error("Erro ao atualizar Auth:", authUpdateError);
            return NextResponse.json({ error: `Erro ao atualizar autenticação: ${authUpdateError.message}` }, { status: 500 });
        }

        // 5. Atualizar perfil público
        const { error: profileUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({
                email,
                username,
                first_name,
                last_name,
                role,
                is_admin: nextIsAdmin,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (profileUpdateError) {
            console.error("Erro ao atualizar Perfil:", profileUpdateError);
            return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
        }

        logAdminAction(adminUser.id, 'update_user_success', userId, request);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
