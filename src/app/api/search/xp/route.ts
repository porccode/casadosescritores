import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { grantXP } from "@/services/xp";

export async function POST(req: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { query } = await req.json();
        
        // Se a query for muito curta, não dar XP (opcional)
        if (!query || query.trim().length < 3) {
            return NextResponse.json({ success: true, awarded: false });
        }

        // Premiar XP por realizar a busca
        // O grantXP na XPService já lida com o cooldown de 5 minutos
        const result = await grantXP(user.id, 'SEARCH_PERFORM', 'SEARCH_ACTION');

        return NextResponse.json({ 
            success: true, 
            awarded: result.awarded,
            amount: result.amount
        });
    } catch (error) {
        console.error("[API/Search/XP] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
