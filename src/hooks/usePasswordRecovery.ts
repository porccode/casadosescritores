"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";

/**
 * Custom hook for Password Recovery flows.
 * Handles both "Forgot Password" (sending email) and "Reset Password" (updating password).
 */
export function usePasswordRecovery() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Reset Password specific states
    const [tokenError, setTokenError] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [initializing, setInitializing] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createBrowserClient();

    // --- Forgot Password Logic ---
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!email) {
                setError("O campo de e-mail é obrigatório");
                setLoading(false);
                return;
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err: any) {
            console.error("Erro ao solicitar recuperação de senha:", err);
            setError(err.message || "Erro ao solicitar recuperação de senha. Por favor, tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // --- Reset Password Logic ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!password) {
                setError("O campo de senha é obrigatório");
                setLoading(false);
                return;
            }

            if (password.length < 6) {
                setError("A senha deve ter pelo menos 6 caracteres");
                setLoading(false);
                return;
            }

            if (password !== confirmPassword) {
                setError("As senhas não coincidem");
                setLoading(false);
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            console.error("Erro ao redefinir senha:", err);
            setError(err.message || "Erro ao redefinir a senha. Por favor, tente novamente ou solicite um novo link.");
        } finally {
            setLoading(false);
        }
    };

    // Initialize session for Reset Password
    const initializeResetSession = async () => {
        try {
            // Hash params check
            if (typeof window !== "undefined" && window.location.hash) {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");
                const type = hashParams.get("type");

                if (accessToken && type === "recovery") {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || "",
                    });

                    if (sessionError) {
                        console.error("Erro ao estabelecer sessão de recovery:", sessionError);
                        setTokenError(true);
                    } else {
                        setSessionReady(true);
                    }
                    setInitializing(false);
                    return;
                }
            }

            // PKCE check
            const code = searchParams?.get("code");
            if (code) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setSessionReady(true);
                } else {
                    setTokenError(true);
                }
                setInitializing(false);
                return;
            }

            // Fallback: check active session
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSessionReady(true);
                setInitializing(false);
                return;
            }

            // Timeout fallback
            const timeout = setTimeout(() => {
                if (!sessionReady) {
                    setTokenError(true);
                    setInitializing(false);
                }
            }, 3000);

            return () => clearTimeout(timeout);
        } catch (err) {
            console.error("Erro ao processar token de recovery:", err);
            setTokenError(true);
            setInitializing(false);
        }
    };

    return {
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        error, setError,
        loading, setLoading,
        success, setSuccess,
        tokenError, setTokenError,
        sessionReady, setSessionReady,
        initializing, setInitializing,
        handleForgotPassword,
        handleResetPassword,
        initializeResetSession,
        supabase
    };
}
