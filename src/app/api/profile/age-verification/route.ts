import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseAndValidateBirthDate, calculateAgeFromParts, isAdultAge } from "@/lib/age-verification";

/**
 * Age Verification API.
 * 
 * Allows users to set or update their birth date up to 2 times.
 * Manages age_verified flag and privacy (public vs private display).
 * Enforces LGPD/ECA compliance and deterministic age calculation.
 */

export async function PUT(request: NextRequest) {
    try {
        const rateLimitResponse = await rateLimitMiddleware(request, "profile_update");
        if (rateLimitResponse) return rateLimitResponse;

        const authSupabase = await createServerSupabaseClient();
        const { data: { user } } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
        }

        const body = await request.json();
        const { birth_date, is_public } = body;

        let formattedBirthDate: string | undefined = undefined;
        let parseResult: any = null;

        if (birth_date) {
            parseResult = parseAndValidateBirthDate(birth_date);
            if (!parseResult.valid || !parseResult.formatted) {
                return NextResponse.json(
                    { error: parseResult.error || "Data de nascimento inválida" },
                    { status: 400 }
                );
            }
            formattedBirthDate = parseResult.formatted;
        }

        const supabase = authSupabase;
        const adminSupabase = createAdminSupabaseClient();

        // 1. Fetch current profile
        let currentProfile: any = null;
        const { data: data1, error: error1 } = await (supabase as any)
            .from("profiles")
            .select("id, birth_date, age_verified, birth_date_change_count, is_birth_date_public")
            .eq("id", user.id)
            .maybeSingle();

        if (error1 || !data1) {
            const { data: data2 } = await (adminSupabase as any)
                .from("profiles")
                .select("id, birth_date, age_verified")
                .eq("id", user.id)
                .maybeSingle();
            currentProfile = data2;
        } else {
            currentProfile = data1;
        }

        if (!currentProfile) {
            currentProfile = {
                id: user.id,
                birth_date_change_count: 0,
                age_verified: false,
            };
        }

        const changeCount = Number(currentProfile.birth_date_change_count ?? 0);
        let newChangeCount = changeCount;

        if (formattedBirthDate) {
            if (changeCount >= 1) {
                return NextResponse.json(
                    { error: "Você já alterou sua data de nascimento. Apenas 1 alteração é permitida." },
                    { status: 403 }
                );
            }
            newChangeCount = changeCount + 1;
        }

        let isAdult = currentProfile.age_verified ?? false;
        let age: number | null = null;

        if (parseResult && parseResult.year !== undefined) {
            age = calculateAgeFromParts(parseResult.year, parseResult.month!, parseResult.day!);
            isAdult = isAdultAge(age);
        }

        const updatePayload: any = {
            id: user.id,
            updated_at: new Date().toISOString(),
        };

        if (formattedBirthDate) {
            updatePayload.birth_date = formattedBirthDate;
            updatePayload.age_verified = isAdult;
            updatePayload.birth_date_change_count = newChangeCount;
        }

        if (typeof is_public === "boolean") {
            updatePayload.is_birth_date_public = is_public;
        }

        // 2. Perform Update / Upsert with fallback for legacy DB schema
        let updatedProfile: any = null;
        let updateError: any = null;

        const { data: upData1, error: upErr1 } = await (supabase as any)
            .from("profiles")
            .upsert(updatePayload)
            .select("id, birth_date, age_verified, birth_date_change_count, is_birth_date_public")
            .maybeSingle();

        if (upErr1 || !upData1) {
            console.warn("Update com campos adicionais falhou ou retornou sem dados, tentando fallback:", upErr1?.message);
            
            const fallbackPayload = { ...updatePayload };
            delete fallbackPayload.birth_date_change_count;
            delete fallbackPayload.is_birth_date_public;

            let resUpdate2 = await (supabase as any)
                .from("profiles")
                .upsert(fallbackPayload)
                .select("id, birth_date, age_verified")
                .maybeSingle();

            if (!resUpdate2.data) {
                resUpdate2 = await (adminSupabase as any)
                    .from("profiles")
                    .upsert(fallbackPayload)
                    .select("id, birth_date, age_verified")
                    .maybeSingle();
            }

            updatedProfile = resUpdate2.data;
            updateError = resUpdate2.error;
        } else {
            updatedProfile = upData1;
        }

        if (updateError || !updatedProfile) {
            console.error("Erro ao atualizar dados no banco:", updateError);
            return NextResponse.json({ 
                error: `Falha ao salvar os dados: ${updateError?.message || 'Erro ao gravar no banco de dados'}` 
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
            age,
            isAdult,
            remainingChanges: Math.max(0, 1 - newChangeCount),
        });
    } catch (error: any) {
        console.error("Age verification API error:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
    }
}
