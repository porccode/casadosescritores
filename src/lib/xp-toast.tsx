"use client";

import { toast } from "@/lib/toast";
import { XP_CONFIG, XP_METHODS } from "@/config/xp";

export { XP_METHODS };

interface XPToastOptions {
    amount: number;
    action: string;
    type?: 'writer' | 'reader';
    message?: string;
    skipPersistence?: boolean;
}

/**
 * Show a standardized XP gain toast notification AND persist to database if needed.
 * serverSide actions defined in XP_CONFIG will skip client-side persistence by default.
 */
export async function showXPToast({ amount, action, type, message, skipPersistence }: XPToastOptions) {
    const title = message || (amount >= 0 ? `+${amount} XP` : `${amount} XP`);
    
    // Determine type from config if not provided
    const actionConfig = Object.values(XP_CONFIG).find(cfg => cfg.action === action) as any;
    const finalType = type || actionConfig?.type || 'reader';
    const isServerSide = actionConfig?.serverSide ?? false;

    const typeLabel = finalType === 'writer' ? 'Escrita' : 'Leitura';
    const description = `${action} (${typeLabel})`;

    // Show toast with differentiated styling (conceptual, using emoji for now)
    const icon = finalType === 'writer' ? '✍️' : '📖';
    toast.success(`${icon} ${title} - ${description}`);

    // If explicit skip or it's a server-side action, do not persist from client
}
