import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

/**
 * Interface para os dados de auditoria
 */
export interface AuditLogData {
    userId: string;
    adminId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    request?: NextRequest | Request;
}

/**
 * Obtém o IP do cliente de forma segura
 */
function getClientIP(request: NextRequest | Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
        return realIP.trim();
    }

    const cfConnectingIP = request.headers.get("cf-connecting-ip");
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }

    return "unknown";
}

/**
 * Registra uma ação de auditoria no banco de dados.
 * Sempre usa o Service Role Key para garantir que o log seja gravado.
 */
export async function logAuditAction(data: AuditLogData) {
    try {
        const supabaseAdmin = createAdminSupabaseClient();

        const {
            userId,
            adminId,
            action,
            entityType,
            entityId,
            metadata = {},
            request,
        } = data;

        const logEntry = {
            user_id: userId,
            admin_id: adminId || null,
            action,
            entity_type: entityType || null,
            entity_id: entityId || null,
            metadata,
            ip_address: request ? getClientIP(request) : "unknown",
            user_agent: request ? request.headers.get("user-agent") || "unknown" : "unknown",
            created_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin.from("audit_logs").insert(logEntry);

        if (error) {
            console.error("[AuditService] Error inserting audit log:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("[AuditService] Unexpected error:", error);
        return { success: false, error };
    }
}
