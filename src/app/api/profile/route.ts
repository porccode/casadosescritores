import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { grantXP } from "@/services/xp";

/**
 * Profile Update API.
 * 
 * Handles profile updates and awards XP for completion, bio, etc.
 */

export async function PUT(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request, 'profile_update');
        if (rateLimitResponse) return rateLimitResponse;

        // ✅ SEGURANÇA: Validar sessão
        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const body = await request.json();
        const { first_name, last_name, bio, website_url, twitter_url, facebook_url, instagram_url, avatar_url } = body;

        const supabase = authSupabase;
        const adminSupabase = createAdminSupabaseClient();

        // 1. Fetch current profile to compare for XP logic
        let oldProfile: any = null;
        const { data: profile1 } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (!profile1) {
            const { data: profile2 } = await adminSupabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();
            oldProfile = profile2;
        } else {
            oldProfile = profile1;
        }

        // 2. Perform Update / Upsert
        const updates: any = {
            id: user.id,
            updated_at: new Date().toISOString(),
        };

        if (first_name !== undefined) updates.first_name = first_name.trim();
        if (last_name !== undefined) updates.last_name = last_name.trim();
        if (bio !== undefined) updates.bio = bio?.trim() || null;
        if (website_url !== undefined) updates.website_url = website_url?.trim() || null;
        if (twitter_url !== undefined) updates.twitter_url = twitter_url?.trim() || null;
        if (facebook_url !== undefined) updates.facebook_url = facebook_url?.trim() || null;
        if (instagram_url !== undefined) updates.instagram_url = instagram_url?.trim() || null;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        let newProfile: any = null;
        let updateError: any = null;

        const { data: upData1, error: upErr1 } = await (supabase as any)
            .from("profiles")
            .upsert(updates)
            .select()
            .maybeSingle();

        if (upErr1 || !upData1) {
            const resUp2 = await (adminSupabase as any)
                .from("profiles")
                .upsert(updates)
                .select()
                .maybeSingle();
            newProfile = resUp2.data;
            updateError = resUp2.error;
        } else {
            newProfile = upData1;
        }

        if (updateError || !newProfile) {
            return NextResponse.json({ error: updateError?.message || "Erro ao salvar perfil no banco" }, { status: 500 });
        }

        // 3. XP logic (Server Side)
        const xpResults = [];


        // Bônus de retorno por inatividade (7+ dias sem atualizar)
        const today = new Date().toISOString().split('T')[0];
        if (oldProfile.updated_at) {
            const lastUpdate = new Date(oldProfile.updated_at);
            const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate >= 7) {
                const xpResult = await grantXP(user.id, 'RETURN_INACTIVITY', `${user.id}:return:${today}`);
                if (xpResult) xpResults.push(xpResult);
            }
        }

        return NextResponse.json({
            success: true,
            profile: newProfile,
            xpAwarded: xpResults.filter(r => r.awarded)
        });

    } catch (error: any) {
        console.error("Error in profile update API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
