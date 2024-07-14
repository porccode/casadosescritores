"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-browser";
import { AuthError, User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Custom hook for managing Authentication Form logic.
 * Handles state, validation, and submission for Login and Signup.
 */
export function useAuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");
    const supabase = createBrowserClient();

    const isSignupMode = searchParams.get("signup") === "true" || searchParams.get("mode") === "signup";
    const [isSignUp, setIsSignUp] = useState(isSignupMode);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleLogin = async () => {
        let loginData: { user: SupabaseUser | null } | null = null;
        let loginError: AuthError | null = null;

        const { data: emailLoginData, error: emailLoginError } = await supabase.auth.signInWithPassword({
            email: identifier,
            password,
        });

        if (emailLoginError) {
            const isEmail = identifier.includes("@");
            if (!isEmail && emailLoginError.message === "Invalid login credentials") {
                const { data: profile } = await (supabase
                    .from("profiles")
                    .select("email")
                    .eq("username", identifier)
                    .single() as any);

                if (profile && profile.email) {
                    const { data: usernameLoginData, error: usernameLoginError } = await supabase.auth.signInWithPassword({
                        email: profile.email,
                        password,
                    });
                    if (usernameLoginError) loginError = usernameLoginError;
                    else loginData = usernameLoginData;
                } else {
                    loginError = emailLoginError;
                }
            } else {
                loginError = emailLoginError;
            }
        } else {
            loginData = emailLoginData;
        }

        if (loginError) throw loginError;
        if (!loginData?.user) throw new Error("Falha ao obter dados do usuário.");

        let profileUsername: string | null = null;
        try {
            const { data: fetchedProfile } = await (supabase
                .from("profiles")
                .select("username")
                .eq("id", loginData.user.id)
                .single() as any);

            profileUsername = (fetchedProfile as any)?.username;

            if (!fetchedProfile) {
                const meta = loginData.user.user_metadata;
                const defaultUsername = meta?.username || loginData.user.email?.split("@")[0] || `user_${Math.random().toString(36).substring(2, 7)}`;

                const { data: newProfile } = await (supabase as any).from("profiles").insert({
                    id: loginData.user.id,
                    username: defaultUsername,
                    email: loginData.user.email!,
                    role: "user",
                    created_at: new Date().toISOString(),
                }).select("username").single();

                profileUsername = newProfile?.username;
            }
        } catch (e: any) {
            console.warn("Erro ao verificar perfil:", e?.message || e);
        }

        setSuccess(true);
        const targetUrl = redirectTo || (profileUsername ? `/profile/${encodeURIComponent(profileUsername)}` : "/");
        setTimeout(() => router.push(targetUrl), 1000);
    };

    const handleSignup = async () => {
        if (!firstName || !lastName) throw new Error("Nome e Sobrenome são obrigatórios.");
        if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

        const baseUsername = (firstName + lastName).toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');

        let generatedUsername = baseUsername;
        let suffix = 0;

        const { data: existingUsers } = await (supabase as any)
            .from("profiles")
            .select("username")
            .ilike("username", `${baseUsername}%`);

        if (existingUsers && (existingUsers as any[]).length > 0) {
            const existingUsernames = new Set((existingUsers as any[]).map(u => u.username?.toLowerCase()));
            while (existingUsernames.has(generatedUsername)) {
                suffix++;
                generatedUsername = `${baseUsername}${suffix}`;
            }
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: identifier,
            password,
            options: {
                data: {
                    username: generatedUsername,
                    first_name: firstName,
                    last_name: lastName,
                },
                emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            },
        });

        if (signUpError) throw signUpError;

        setSuccess(true);
        if (!data.session) {
            setTimeout(() => {
                setIsSignUp(false);
                setSuccess(false);
                setError("Conta criada! Verifique seu e-mail para confirmar.");
            }, 3000);
        } else {
            setTimeout(() => router.push(redirectTo || "/"), 1500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!identifier.trim()) throw new Error("Por favor, insira seu e-mail ou usuário.");
            if (!password) throw new Error("Por favor, insira sua senha.");

            if (isSignUp) {
                await handleSignup();
            } else {
                await handleLogin();
            }
        } catch (err: any) {
            console.warn("Erro de autenticação:", err?.message || err);
            let msg = "Ocorreu um erro inesperado. Tente novamente.";
            const rawMessage = err.message || "";

            if (rawMessage.includes("Invalid login credentials")) {
                msg = "E-mail/Usuário ou senha incorretos.";
            } else if (rawMessage.includes("Too many requests") || err.status === 429) {
                msg = "Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.";
            } else if (rawMessage.includes("already registered")) {
                msg = "Este e-mail já está cadastrado em nossa plataforma.";
            } else if (rawMessage.includes("Email not confirmed")) {
                msg = "Por favor, confirme seu e-mail antes de acessar.";
            } else if (rawMessage.includes("Error sending confirmation email")) {
                msg = "Erro ao enviar e-mail de confirmação. Verifique o endereço digitado.";
            } else if (err.message) {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError(null);
        setSuccess(false);
    };

    return {
        isSignUp,
        identifier,
        setIdentifier,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        error,
        loading,
        setLoading,
        setError,
        success,
        handleSubmit,
        toggleMode,
        redirectTo,
        supabase
    };
}
