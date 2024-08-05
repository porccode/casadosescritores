"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";

// Gera ou recupera um session_id único para este usuário (expira em 30 min de inatividade)
function getOrCreateSessionId(): string {
    try {
        const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
        const key = "cde_session_id";
        const tsKey = "cde_session_ts";
        const now = Date.now();
        
        let id = localStorage.getItem(key);
        let ts = localStorage.getItem(tsKey);

        if (!id || !ts || (now - parseInt(ts, 10) > SESSION_TIMEOUT)) {
            id = crypto.randomUUID();
            localStorage.setItem(key, id);
        }
        
        // Atualiza o tempo do último acesso para renovar a sessão atual
        localStorage.setItem(tsKey, now.toString());
        return id;
    } catch {
        return crypto.randomUUID();
    }
}

// Paths que não devem ser contados como visitas do site público
const IGNORED_PREFIXES = ["/admin", "/login", "/register", "/signup", "/forgot-password", "/reset-password"];

export default function AccessTracker() {
    const pathname = usePathname();
    const supabase = createBrowserClient();
    // Guarda o último path rastreado para evitar duplicatas na mesma sessão
    const trackedPaths = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Ignorar páginas administrativas/auth
        if (IGNORED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return;

        // Evitar re-contar o mesmo path na mesma sessão do componente
        if (trackedPaths.current.has(pathname)) return;
        trackedPaths.current.add(pathname);

        const trackVisit = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const sessionId = getOrCreateSessionId();

                await fetch("/api/analytics/visit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        path: pathname,
                        userId: user?.id || null,
                        sessionId,
                        referer: document.referrer || null,
                    }),
                });
            } catch (error) {
                console.warn("Analytics error:", error);
            }
        };

        trackVisit();
    }, [pathname, supabase]);

    return null;
}
