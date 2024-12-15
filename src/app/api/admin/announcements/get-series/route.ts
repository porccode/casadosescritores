// src/app/api/admin/announcements/get-series/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { ADMIN_ACCESS_PROFILE_SELECT, isAdminRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
    try {
        const supabaseAuth = await createServerSupabaseClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        // Verificar se é admin
        const { data: profile } = await supabaseAuth
            .from("profiles")
            .select(ADMIN_ACCESS_PROFILE_SELECT)
            .eq("id", user.id)
            .single();

        if (!isAdminRole(profile)) {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
        }

        const supabaseAdmin = createAdminSupabaseClient();

        const SERIES_TITLE = "Comunicados Oficiais";

        // 1. Tentar encontrar a série existente
        const { data: existingSeries, error: findError } = await supabaseAdmin
            .from("series")
            .select("id")
            .eq("author_id", user.id)
            .eq("title", SERIES_TITLE)
            .maybeSingle();

        if (existingSeries) {
            return NextResponse.json({ seriesId: existingSeries.id });
        }

        // 2. Se não existir, criar
        const { data: newSeries, error: createError } = await supabaseAdmin
            .from("series")
            .insert({
                title: SERIES_TITLE,
                description: "Comunicados e atualizações oficiais da plataforma.",
                author_id: user.id,
                genre: "Informativo",
                work_type: "series",
                is_completed: false
            })
            .select("id")
            .single();

        if (createError) {
            console.error("Erro ao criar série de anúncios:", createError);
            return NextResponse.json({ error: "Erro ao criar série" }, { status: 500 });
        }

        return NextResponse.json({ seriesId: newSeries.id });

    } catch (error: any) {
        console.error("Erro no servidor:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
