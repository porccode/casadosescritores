import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { XP_CONFIG, XPActionType } from "@/config/xp";

/**
 * XP Service.
 * 
 * Centralized logic for awarding XP on the server side via the `grant_xp` RPC.
 * Prevents double-granting by checking `xp_history`.
 */

export interface GXPResult {
    success: boolean;
    awarded: boolean;
    amount: number;
    error?: any;
}

const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

const extractUUID = (str: string | undefined): string | null => {
    if (!str) return null;
    if (isUUID(str)) return str;
    const parts = str.split(':');
    const potentialId = parts.find(p => isUUID(p));
    return potentialId || null;
};

/**
 * Grants XP to a user for a specific action.
 * 
 * @param userId The ID of the user receiving XP
 * @param actionKey Key from XP_CONFIG (e.g. 'COMMENT_PUBLISH')
 * @param entityId Optional. ID of the entity that triggered the XP
 * @param force If true, bypasses duplicate check (use with caution)
 */
export async function grantXP(
    userId: string,
    actionKey: XPActionType,
    entityId?: string,
    force: boolean = false
): Promise<GXPResult> {
    const supabase = createAdminSupabaseClient();
    let finalActionKey = actionKey;
    const config = XP_CONFIG[finalActionKey];

    if (!config) {
        console.error(`[XP Service] Action key NOT FOUND: ${actionKey}`);
        return { success: false, awarded: false, amount: 0, error: "Action not found" };
    }

    try {
        const validUUID = extractUUID(entityId);
        
        // --- Specialized Logic for Upgrades/First-Time ---

        // 1. First Comment in Series Upgrade
        if (actionKey === 'COMMENT_PUBLISH' && validUUID) {
            const { count } = await supabase
                .from('xp_history')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .in('action_type', ['comment_publish', 'comment_first_in_series'])
                .eq('entity_id', validUUID);
            
            if (!count || count === 0) {
                finalActionKey = 'COMMENT_FIRST_IN_SERIES';
            }
        }

        // 2. First Message Upgrade
        if (actionKey === 'MESSAGE_SEND' && validUUID) {
            const { count } = await supabase
                .from('xp_history')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .in('action_type', ['message_send', 'message_send_first'])
                .eq('entity_id', validUUID);

            if (!count || count === 0) {
                finalActionKey = 'MESSAGE_SEND_FIRST';
            } else if (count >= 10) {
                // Anti-abuse limit 10
                return { success: true, awarded: false, amount: 0 };
            }
        }

        // --- Standard Duplicate & Daily Rate-Limit Check ---
        const finalConfig = XP_CONFIG[finalActionKey];
        const actionStr = finalActionKey.toLowerCase();
        
        // Daily limits logic based on actionKey
        const dailyActions: XPActionType[] = ['BIO_UPDATE', 'SOCIAL_UPDATE', 'PROFILE_EDIT', 'SERIES_EDIT'];
        const isDailyLimited = dailyActions.includes(finalActionKey);
        
        // Search limit
        const isSearch = finalActionKey === 'SEARCH_PERFORM';

        if (!force) {
            let query = supabase.from("xp_history").select("id").eq("user_id", userId).eq("action_type", actionStr);
            
            if (isDailyLimited) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (isSearch) {
                const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
                query = query.gte('created_at', fiveMinsAgo).limit(1);
            } else if (validUUID) {
                query = query.eq("entity_id", validUUID);
            } else {
                // One time logic fallback
                const oneTimeActions = ['PROFILE_COMPLETE', 'AVATAR_ADD'];
                if (!oneTimeActions.includes(finalActionKey)) {
                   // If not properly handled, allow by default but warn
                   // (We try to match exactly how gamification needs it)
                }
            }

            const { data: existing } = await query.maybeSingle();

            if (existing) {
                return { success: true, awarded: false, amount: 0 };
            }
        }

        // 4. Award the XP via RPC which also logs safely
        const amount = finalConfig.xp;
        const type = finalConfig.type as 'writer' | 'reader';

        const { error: rpcError } = await (supabase.rpc as any)('grant_xp', {
            p_user_id: userId,
            p_amount: amount,
            p_role: type,
            p_action_type: actionStr,
            p_entity_id: validUUID
        });

        if (rpcError) {
             console.error(`[XP Service] RPC error for ${actionStr}:`, rpcError);
             return { success: false, awarded: false, amount: 0, error: rpcError };
        }

        return {
            success: true,
            awarded: true,
            amount: amount,
        };

    } catch (error) {
        console.error(`[XP Service] Unexpected error:`, error);
        return { success: false, awarded: false, amount: 0, error };
    }
}

export interface SXPResult {
    success: boolean;
    spent: boolean;
    amount: number;
    newXP?: number;
    error?: any;
}

/**
 * Gasta XP de um usuário para realizar uma ação premium (série, capítulo, comunidade, etc.)
 */
export async function spendXP(
    userId: string,
    actionKey: XPActionType,
    entityId?: string
): Promise<SXPResult> {
    const supabase = createAdminSupabaseClient();
    const config = XP_CONFIG[actionKey];

    if (!config) {
        console.error(`[XP Service] Gasto não cadastrado: ${actionKey}`);
        return { success: false, spent: false, amount: 0, error: "Ação não encontrada" };
    }

    const amount = Math.abs(config.xp); // O banco de dados espera um valor positivo para a redução

    try {
        const validUUID = extractUUID(entityId);
        const actionStr = actionKey.toLowerCase();

        const { data, error } = await (supabase.rpc as any)('spend_xp', {
            p_user_id: userId,
            p_amount: amount,
            p_action_type: actionStr,
            p_entity_id: validUUID
        });

        if (error) {
            console.error(`[XP Service] Erro RPC spend_xp para ${actionStr}:`, error);
            return { success: false, spent: false, amount: 0, error };
        }

        const res = data as any;
        if (!res.success) {
            return { success: false, spent: false, amount: 0, error: res.error };
        }

        return {
            success: true,
            spent: true,
            amount: -amount,
            newXP: res.new_xp
        };
    } catch (error) {
        console.error(`[XP Service] Erro inesperado ao gastar XP:`, error);
        return { success: false, spent: false, amount: 0, error };
    }
}


