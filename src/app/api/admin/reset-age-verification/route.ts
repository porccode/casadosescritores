import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Admin API: Reset all users' age verification data.
 * 
 * Resets birth_date to NULL, age_verified to NULL, and birth_date_change_count to 0
 * for all profiles in the database.
 */
export async function POST(request: NextRequest) {
    try {
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const adminSupabase = createAdminSupabaseClient();

        // Verify if calling user is admin
        const { data: profile } = await adminSupabase
            .from("profiles")
            .select("is_admin, role")
            .eq("id", user.id)
            .single();

        if (!profile || (!profile.is_admin && profile.role !== "admin")) {
            return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
        }

        // Reset all age verification fields across all users
        const { error: resetError } = await adminSupabase
            .from("profiles")
            .update({
                birth_date: null,
                age_verified: null,
                birth_date_change_count: 0,
                updated_at: new Date().toISOString(),
            })
            .not("id", "is", null);

        if (resetError) {
            console.error("Erro ao resetar dados de verificação de idade:", resetError);
            return NextResponse.json({ error: "Falha ao resetar dados dos usuários" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Todos os dados de verificação de idade foram resetados com sucesso. Todos os usuários precisarão confirmar a data de nascimento novamente.",
        });
    } catch (error: any) {
        console.error("Admin Reset Age Verification Error:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
    }
}
