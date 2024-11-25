import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// Bots conhecidos a filtrar
const BOT_PATTERNS = [
    "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
    "yandexbot", "sogou", "semrushbot", "ahrefsbot", "dotbot",
    "rogerbot", "exabot", "mj12bot", "python-requests", "curl/",
    "wget/", "scrapy", "go-http-client", "facebookexternalhit",
    "linkedinbot", "twitterbot", "whatsapp", "telegrambot",
    "applebot", "lighthouse", "headlesschrome", "phantomjs",
];

function isBot(userAgent: string | null): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_PATTERNS.some(bot => ua.includes(bot));
}

export async function POST(request: NextRequest) {
    try {
        const userAgent = request.headers.get("user-agent");

        // Filtrar bots
        if (isBot(userAgent)) {
            return NextResponse.json({ skipped: "bot" });
        }

        const body = await request.json().catch(() => ({}));
        const { path, userId, sessionId, referer } = body;

        if (!path) {
            return NextResponse.json({ error: "Path não fornecido" }, { status: 400 });
        }

        // Não registrar paths de admin/auth
        const ignoredPrefixes = ["/admin", "/login", "/register", "/signup", "/forgot-password", "/reset-password"];
        if (ignoredPrefixes.some(prefix => path.startsWith(prefix))) {
            return NextResponse.json({ skipped: "ignored_path" });
        }

        const supabase = createAdminSupabaseClient();

        // Se já existe registro desta session_id + path, não duplicar
        if (sessionId) {
            const { data: existing } = await supabase
                .from("site_visits")
                .select("id")
                .eq("session_id", sessionId)
                .eq("path", path)
                .maybeSingle();

            if (existing) {
                return NextResponse.json({ skipped: "duplicate" });
            }
        }

        const { error } = await supabase.from("site_visits").insert({
            path,
            session_id: sessionId || null,
            user_id: userId || null,
            referer: referer || request.headers.get("referer"),
            user_agent: userAgent,
        });

        if (error) {
            console.error("Erro ao registrar visita ao site:", error);
            if (error.code === "42501") {
                console.warn(
                    "DICA: O erro 42501 (RLS policy violation) geralmente ocorre porque a chave SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env.local está incorreta ou usando a chave anônima (anon) por engano. Certifique-se de usar a chave 'service_role' do painel do Supabase para ignorar as políticas de RLS no servidor."
                );
            }
            return NextResponse.json({ error: "Erro ao registrar visita" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Erro na API de analytics:", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
