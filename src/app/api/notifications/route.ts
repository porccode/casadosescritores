// src/app/api/notifications/route.ts
// ⚠️ Esta API deve ser chamada apenas pelo servidor (server actions/APIs)
// Não exponha diretamente ao cliente

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
    try {
        // ✅ SEGURANÇA: Verificar origem da requisição (apenas chamadas internas)
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");

        // Em produção, verificar se a origem corresponde ao host
        if (process.env.NODE_ENV === "production") {
            // Aceitar apenas requisições sem origin (server-side) ou do mesmo domínio
            if (origin && !origin.includes(host || "")) {
                console.error(`[SECURITY] Tentativa de criação de notificação de origem externa: ${origin}`);
                return NextResponse.json(
                    { error: "Acesso negado" },
                    { status: 403 }
                );
            }
        }

        const notificationData = await request.json();

        // Validação básica
        if (
            !notificationData.target_user_id ||
            !notificationData.type
        ) {
            return NextResponse.json(
                { error: "Campos obrigatórios ausentes" },
                { status: 400 }
            );
        }

        // ✅ SEGURANÇA: Validar UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(notificationData.target_user_id)) {
            return NextResponse.json(
                { error: "ID de usuário inválido" },
                { status: 400 }
            );
        }

        if (notificationData.actor_id && !uuidRegex.test(notificationData.actor_id)) {
            return NextResponse.json(
                { error: "ID de ator inválido" },
                { status: 400 }
            );
        }

        // ✅ SEGURANÇA: Validar tipos de notificação permitidos
        const allowedTypes = [
            "like", "comment", "reply", "follow", "new_chapter",
            "new_series", "series_comment", "mention", "system"
        ];
        if (!allowedTypes.includes(notificationData.type)) {
            return NextResponse.json(
                { error: "Tipo de notificação inválido" },
                { status: 400 }
            );
        }

        // Criar cliente Supabase usando factory centralizado
        const supabase = createAdminSupabaseClient();

        // Adicionar timestamp
        const data = {
            ...notificationData,
            created_at: new Date().toISOString(),
        };

        // Inserir notificação
        const { data: notification, error } = await supabase
            .from("notifications")
            .insert(data)
            .select();

        if (error) {
            console.error("Erro ao criar notificação:", error);
            return NextResponse.json(
                { error: "Falha ao criar notificação" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            notification: notification[0],
        });
    } catch (error) {
        console.error("Erro do servidor:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
