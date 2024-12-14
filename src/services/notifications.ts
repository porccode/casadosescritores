import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { NotificationPayload } from "@/types/notifications";

/**
 * Serviço centralizado de notificações (Server-Side Only)
 * Usa o cliente Admin para garantir permissões de escrita.
 */
export async function createNotification(payload: NotificationPayload) {
    try {
        const supabase = createAdminSupabaseClient();

        // Validação básica para evitar notificações para si mesmo
        if (payload.target_user_id === payload.actor_id) {
            return { success: false, error: "Self-notification blocked" };
        }

        const { error } = await supabase
            .from("notifications")
            .insert({
                target_user_id: payload.target_user_id,
                actor_id: payload.actor_id,
                type: payload.type,
                related_id: payload.related_id,
                additional_data: payload.additional_data || {},
                is_read: false,
            });

        if (error) {
            console.error("[NotificationService] Error creating notification:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("[NotificationService] Unexpected error:", err);
        return { success: false, error: "Internal Server Error" };
    }
}
