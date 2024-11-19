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
        const { conversationId, recipientId } = await req.json();
        
        if (!conversationId && !recipientId) {
            return NextResponse.json({ error: "Missing conversation/recipient ID" }, { status: 400 });
        }

        // Premiar XP por enviar mensagem
        // XPService lida com:
        // - Upgrade para MESSAGE_SEND_FIRST (se for a primeira entre eles)
        // - Trava de 10 XP de msg por conversa/dia
        const entityId = conversationId || recipientId;
        const result = await grantXP(user.id, 'MESSAGE_SEND', entityId);

        return NextResponse.json({ 
            success: true, 
            awarded: result.awarded,
            amount: result.amount
        });
    } catch (error) {
        console.error("[API/Messages/XP] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
