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
        const { notificationId } = await req.json();
        
        if (!notificationId) {
            return NextResponse.json({ error: "Missing notificationId" }, { status: 400 });
        }

        // Premiar XP por ver a notificação
        const result = await grantXP(user.id, 'NOTIFICATION_CLICK', notificationId);

        return NextResponse.json({ 
            success: true, 
            awarded: result.awarded,
            amount: result.amount
        });
    } catch (error) {
        console.error("[API/Notifications/XP] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
