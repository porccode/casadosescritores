"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AuthStatusMessagesProps {
    error: string | null;
    success: boolean;
    isSignUp: boolean;
}

/**
 * AuthStatusMessages Component.
 *
 * Exibe alertas de erro ou sucesso durante o fluxo de autenticação.
 * Usa o componente Alert nativo do Shadcn UI.
 */
export function AuthStatusMessages({ error, success, isSignUp }: AuthStatusMessagesProps) {
    return (
        <>
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription>
                        {isSignUp ? "Conta criada! Redirecionando..." : "Login realizado com sucesso!"}
                    </AlertDescription>
                </Alert>
            )}
        </>
    );
}
