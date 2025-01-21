// src/app/api/blog/redirect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
    try {
        const supabaseAdmin = createAdminSupabaseClient();

        // Encontrar a sérieComunicados Oficiais de um administrador
        const { data: blogSeries, error } = await supabaseAdmin
            .from("series")
            .select("id, title, profiles!author_id!inner(role)")
            .eq("title", "Comunicados Oficiais")
            .eq("profiles.role", "admin")
            .limit(1)
            .maybeSingle();

        if (error || !blogSeries) {
            console.error("Blog series not found:", error);
            return NextResponse.redirect(new URL("/", request.url));
        }

        const slug = generateSlug(blogSeries.title, blogSeries.id);
        const url = new URL(`/series/${slug}`, request.url);

        return NextResponse.redirect(url);

    } catch (error) {
        console.error("Redirect error:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}
