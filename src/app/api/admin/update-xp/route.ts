// src/app/api/admin/update-xp/route.ts
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
} from "@/lib/roles";

export async function POST(request: NextRequest) {
    try {
        // Aplicar rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'admin');
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        // Aplicar proteção CSRF
        const csrfResponse = csrfProtection(request, 'admin_update_xp');
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
            logPrivilegeEscalation(adminUser.id, 'update_xp_attempt', getEffectiveRole(adminProfile), request);
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        // 2. Extrair dados da requisição
        const { userId, xp } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
        }

        if (typeof xp !== "number" || xp < 0) {
            return NextResponse.json({ error: "XP deve ser um número positivo" }, { status: 400 });
        }

        // Fórmula: level = floor(sqrt(xp/100)) + 1
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;

        // 3. Cliente Supabase com Service Role para atualizar Perfil (bypassa RLS)
        const supabaseAdmin = createAdminSupabaseClient();

        // 4. Atualizar perfil público
        const { error: profileUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({
                xp,
                level,
                updated_at: new Date().toISOString()
            })
            .eq("id", userId);

        if (profileUpdateError) {
            console.error("Erro ao atualizar XP no Perfil:", profileUpdateError);
            return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
        }

        logAdminAction(adminUser.id, 'update_xp_success', userId, request);

        return NextResponse.json({ success: true, xp, level });

    } catch (error: any) {
        console.error("Erro no servidor ao atualizar XP:", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
